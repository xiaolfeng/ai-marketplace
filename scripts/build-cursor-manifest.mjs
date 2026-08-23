#!/usr/bin/env node
/**
 * 从 Claude marketplace 清单（唯一事实源）导出 Cursor 市场清单。
 *
 * 用法：
 *   node scripts/build-cursor-manifest.mjs           # 写入 dist/cursor/
 *   node scripts/build-cursor-manifest.mjs --check   # 仅校验产物是否为最新（CI 用）
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exit } from "node:process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, ".claude-plugin/marketplace.json");
const TARGET = resolve(ROOT, "dist/cursor/.cursor-plugin/marketplace.json");

/** Claude 条目与 Cursor 条目的同义字段，按序透传 */
const PASSTHROUGH_FIELDS = [
  "name",
  "source",
  "description",
  "version",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "category",
  "tags",
  "skills",
];

function toCursorManifest(claude) {
  const missing = ["name", "owner", "plugins"].filter((key) => !claude[key]);
  if (missing.length > 0) {
    throw new Error(`源清单缺少必需字段：${missing.join(", ")}`);
  }

  const metadata = {};
  for (const key of ["description", "version", "pluginRoot"]) {
    const value = claude.metadata?.[key] ?? claude[key];
    if (value !== undefined) metadata[key] = value;
  }

  return {
    name: claude.name,
    owner: claude.owner,
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    plugins: claude.plugins.map((entry) =>
      Object.fromEntries(
        PASSTHROUGH_FIELDS.filter((key) => entry[key] !== undefined).map((key) => [key, entry[key]]),
      ),
    ),
  };
}

const source = JSON.parse(await readFile(SOURCE, "utf8"));
const target = toCursorManifest(source);
const serialized = `${JSON.stringify(target, null, 2)}\n`;

if (process.argv.includes("--check")) {
  let current;
  try {
    current = await readFile(TARGET, "utf8");
  } catch {
    console.error(`✗ 缺少导出产物 ${TARGET}，请运行 npm run build`);
    exit(1);
  }
  if (current !== serialized) {
    console.error("✗ Cursor 清单已过期，请运行 npm run build 后一并提交");
    exit(1);
  }
  console.log("✓ Cursor 清单与源清单一致");
  exit(0);
}

await mkdir(dirname(TARGET), { recursive: true });
await writeFile(TARGET, serialized, "utf8");
console.log(`✓ 已导出 ${target.plugins.length} 个插件到 dist/cursor/.cursor-plugin/marketplace.json`);
