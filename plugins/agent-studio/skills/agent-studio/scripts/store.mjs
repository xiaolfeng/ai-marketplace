import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

export const DATA = ".xlf-marketplace";

export function fail(code, message) {
  throw Object.assign(new Error(message), { code });
}

export function requireValue(condition, code, message) {
  if (!condition) fail(code, message);
}

export function object(value, keys, label) {
  requireValue(
    value !== null && typeof value === "object" && !Array.isArray(value),
    "SCHEMA",
    `${label} 必须是对象`,
  );
  for (const key of Object.keys(value)) {
    requireValue(keys.includes(key), "SCHEMA", `${label} 含未知字段 ${key}`);
  }
}

export function version(value) {
  requireValue(
    value.schemaVersion === 1,
    "SCHEMA_VERSION",
    "只支持 schemaVersion: 1",
  );
}

export function text(value, label) {
  requireValue(
    typeof value === "string" &&
      value.trim().length > 0 &&
      !value.includes("\0"),
    "SCHEMA",
    `${label} 必须是非空字符串`,
  );
  return value;
}

export function id(value) {
  requireValue(
    typeof value === "string" &&
      value.length <= 64 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "ID",
    "ID 必须为不超过 64 字符的 kebab-case",
  );
  return value;
}

export function relativePath(value) {
  text(value, "路径");
  requireValue(
    !isAbsolute(value) &&
      !/[\\:\x00-\x1f]/.test(value) &&
      value.split("/").every((part) => part && part !== "." && part !== ".."),
    "PATH",
    "路径必须是项目内相对路径，不能包含 .、..、反斜杠或冒号",
  );
  return value;
}

export function digest(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export class Workspace {
  static async open(root) {
    const actual = await realpath(resolve(root));
    requireValue(
      (await lstat(actual)).isDirectory(),
      "PATH",
      "项目根必须是目录",
    );
    return new Workspace(actual);
  }

  constructor(root) {
    this.root = root;
  }

  async path(relative) {
    relativePath(relative);
    let current = this.root;
    const parts = relative.split("/");
    for (let i = 0; i < parts.length; i += 1) {
      current = join(current, parts[i]);
      try {
        const info = await lstat(current);
        requireValue(
          !info.isSymbolicLink(),
          "SYMLINK",
          "管理路径与输入文件不允许符号链接",
        );
        if (i < parts.length - 1)
          requireValue(info.isDirectory(), "PATH", "路径中间节点必须是目录");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    return current;
  }

  async exists(relative) {
    const file = await this.path(relative);
    try {
      await lstat(file);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  async bytes(relative) {
    const file = await this.path(relative);
    requireValue((await lstat(file)).isFile(), "PATH", "输入必须是普通文件");
    return readFile(file);
  }

  async json(relative) {
    const raw = await this.bytes(relative);
    try {
      return JSON.parse(raw.toString("utf8"));
    } catch {
      fail("JSON", `${relative} 不是合法 JSON`);
    }
  }

  async write(relative, content) {
    const file = await this.path(relative);
    if (await this.exists(relative))
      requireValue(
        (await lstat(file)).isFile(),
        "PATH",
        "写入目标必须是普通文件",
      );
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
      await rename(temporary, file);
    } finally {
      await unlink(temporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }

  async writeJSON(relative, value) {
    await this.write(relative, serialize(value));
  }

  async locked(action) {
    await mkdir(await this.path(DATA), { recursive: true });
    const lock = await this.path(`${DATA}/.lock`);
    try {
      await writeFile(lock, `${process.pid}\n`, { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (error.code === "EEXIST")
        fail(
          "LOCKED",
          "已有写操作或遗留 .xlf-marketplace/.lock；确认没有活跃写者后再移除",
        );
      throw error;
    }
    try {
      return await action();
    } finally {
      await unlink(lock);
    }
  }
}

export async function saveDefinition(workspace, relative, value, replace) {
  const content = serialize(value);
  if (await workspace.exists(relative)) {
    const previous = (await workspace.bytes(relative)).toString("utf8");
    if (previous === content) return { path: relative, changed: false };
    requireValue(replace, "EXISTS", "定义已存在；确认更新后使用 --replace");
  }
  await workspace.write(relative, content);
  return { path: relative, changed: true };
}
