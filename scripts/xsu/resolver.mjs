import fs from "node:fs";
import path from "node:path";
import { parseXsu } from "./parser.mjs";
import { fail, isNode, XsuError } from "./contracts.mjs";

const TEXT_LIMIT = 2 * 1024 * 1024;
const TOTAL_LIMIT = 20 * 1024 * 1024;

export function resolveDocument(entry) {
  const rootFile = fs.realpathSync(entry);
  const rootDir = path.dirname(rootFile);
  const files = new Map();
  let total = 0;
  let nodeCount = 0;
  let expandedTextBytes = 0;
  const account = (file) => {
    if (files.has(file)) return files.get(file);
    const stat = fs.statSync(file);
    if (!stat.isFile())
      throw new XsuError("XSU_RESOURCE", `Not a regular file: ${file}`);
    if (stat.size > TOTAL_LIMIT || total + stat.size > TOTAL_LIMIT)
      throw new XsuError("XSU_LIMIT", "Input resources exceed 20 MiB");
    const data = fs.readFileSync(file);
    total += data.length;
    if (!files.has(file)) files.set(file, data);
    return data;
  };
  const sandboxPath = (ref, base, node) => {
    if (
      typeof ref !== "string" ||
      !ref ||
      path.isAbsolute(ref) ||
      /[\u0000-\u001f]|^[a-z][a-z0-9+.-]*:/i.test(ref)
    )
      fail(node, "XSU_RESOURCE", "Resource must be a relative local path");
    let resolved;
    try {
      resolved = fs.realpathSync(path.resolve(base, ref));
    } catch {
      fail(node, "XSU_RESOURCE", `Resource does not exist: ${ref}`);
    }
    const relative = path.relative(rootDir, resolved);
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      fail(node, "XSU_RESOURCE", "Resource escapes the document directory");
    return resolved;
  };
  const load = (file, stack = []) => {
    if (stack.length > 8 || stack.includes(file))
      throw new XsuError(
        "XSU_INCLUDE",
        "Include cycle or depth limit exceeded",
        { loc: { file, line: 1, column: 1 } },
      );
    if (files.size >= 101 && !files.has(file))
      throw new XsuError("XSU_LIMIT", "Maximum 100 included files");
    const bytes = account(file);
    expandedTextBytes += bytes.length;
    if (expandedTextBytes > TOTAL_LIMIT)
      throw new XsuError("XSU_LIMIT", "Expanded source text exceeds 20 MiB");
    if (bytes.length > TEXT_LIMIT)
      throw new XsuError("XSU_LIMIT", "A source file exceeds 2 MiB", {
        loc: { file, line: 1, column: 1 },
      });
    let source;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new XsuError("XSU_ENCODING", "Source is not valid UTF-8");
    }
    const root = parseXsu(source, file);
    const expand = (value, sequence = false) => {
      if (Array.isArray(value))
        return value.flatMap((item) => {
          if (isNode(item) && item.type === "Include") {
            if (
              !sequence ||
              item.args.length !== 1 ||
              typeof item.args[0] !== "string"
            )
              fail(
                item,
                "XSU_INCLUDE",
                "Include is only valid in a component children array",
              );
            const target = sandboxPath(item.args[0], path.dirname(file), item);
            const fragment = load(target, [...stack, file]);
            if (
              fragment.type !== "Fragment" ||
              fragment.args.length !== 1 ||
              !Array.isArray(fragment.args[0]) ||
              fragment.args[0].some((child) => !isNode(child))
            )
              fail(
                item,
                "XSU_INCLUDE",
                "Included files require Fragment([components])",
              );
            return fragment.args[0];
          }
          return [expand(item)];
        });
      if (isNode(value)) {
        if (++nodeCount > 10000)
          fail(
            value,
            "XSU_LIMIT",
            "Expanded document exceeds 10000 components",
          );
        if (value.type === "Include")
          fail(
            value,
            "XSU_INCLUDE",
            "Include is only valid in a component children array",
          );
        value.args = value.args.map((arg, i) =>
          expand(arg, value.type === "Fragment" ? i === 0 : i === 1),
        );
        return value;
      }
      if (value && typeof value === "object") {
        for (const key of Object.keys(value)) value[key] = expand(value[key]);
      }
      return value;
    };
    return expand(root);
  };
  const root = load(rootFile);
  const readImage = (ref, node) => {
    const file = sandboxPath(
      ref,
      path.dirname(node?.loc?.file || rootFile),
      node,
    );
    const data = account(file);
    const type = data
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : data[0] === 255 && data[1] === 216 && data[2] === 255
        ? "image/jpeg"
        : /^GIF8[79]a$/.test(data.subarray(0, 6).toString("ascii"))
          ? "image/gif"
          : data.subarray(0, 4).toString("ascii") === "RIFF" &&
              data.subarray(8, 12).toString("ascii") === "WEBP"
            ? "image/webp"
            : null;
    if (!type)
      fail(
        node,
        "XSU_IMAGE",
        "Only PNG, JPEG, GIF and WebP images are accepted",
      );
    return `data:${type};base64,${data.toString("base64")}`;
  };
  return { root, rootFile, rootDir, files, readImage, sandboxPath };
}
