import { XsuError } from "./contracts.mjs";

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function parseXsu(input, file = "<input>") {
  const source = input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  let offset = 0;
  let nodes = 0;
  const lineStarts = [0];
  for (let index = 0; index < source.length; index++)
    if (source[index] === "\n") lineStarts.push(index + 1);
  const location = (start) => {
    let low = 0;
    let high = lineStarts.length;
    while (low + 1 < high) {
      const middle = (low + high) >>> 1;
      if (lineStarts[middle] <= start) low = middle;
      else high = middle;
    }
    return { file, line: low + 1, column: start - lineStarts[low] + 1 };
  };
  const error = (message, start = offset) => {
    throw new XsuError("XSU_SYNTAX", message, { loc: location(start) });
  };
  const skip = () => {
    while (offset < source.length) {
      if (/\s/.test(source[offset])) {
        offset++;
        continue;
      }
      if (source.startsWith("//", offset)) {
        const end = source.indexOf("\n", offset);
        offset = end < 0 ? source.length : end;
        continue;
      }
      if (source.startsWith("/*", offset)) {
        const end = source.indexOf("*/", offset + 2);
        if (end < 0) error("Unterminated comment");
        offset = end + 2;
        continue;
      }
      break;
    }
  };
  const token = (text) => {
    skip();
    if (!source.startsWith(text, offset)) error(`Expected ${text}`);
    offset += text.length;
  };
  const identifier = () => {
    skip();
    const result = /^[A-Za-z][A-Za-z0-9_]*/.exec(source.slice(offset));
    if (!result) error("Expected identifier");
    offset += result[0].length;
    return result[0];
  };
  const string = () => {
    skip();
    const start = offset;
    if (source.startsWith('"""', offset)) {
      const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
      if (source.slice(lineStart, offset).trim())
        error("Raw string delimiter must be on its own line");
      offset += 3;
      const opening = /^[ \t]*\n/.exec(source.slice(offset));
      if (!opening) error("Raw string delimiter must be on its own line");
      offset += opening[0].length;
      const contentStart = offset;
      const end = /^[ \t]*"""[ \t]*(?:\n|$)/m.exec(source.slice(offset));
      if (!end) error("Unterminated raw string", start);
      const content = source
        .slice(contentStart, offset + end.index)
        .replace(/\n$/, "");
      offset += end.index + end[0].length;
      return content;
    }
    offset++;
    while (offset < source.length) {
      const char = source[offset++];
      if (char === "\\") {
        offset++;
        continue;
      }
      if (char === '"') {
        try {
          return JSON.parse(source.slice(start, offset));
        } catch {
          error("Invalid JSON string", start);
        }
      }
      if (char === "\n")
        error("Newline in JSON string; use a raw multiline string", start);
    }
    error("Unterminated string", start);
  };
  const sequence = (end, read) => {
    const values = [];
    skip();
    if (source[offset] === end) {
      offset++;
      return values;
    }
    while (offset < source.length) {
      values.push(read());
      skip();
      if (source[offset] === end) {
        offset++;
        return values;
      }
      token(",");
      skip();
      if (source[offset] === end) {
        offset++;
        return values;
      }
    }
    error(`Expected ${end}`);
  };
  const value = (depth = 0) => {
    if (depth > 64) error("Maximum syntax depth is 64");
    skip();
    const start = offset;
    const char = source[offset];
    if (char === '"') return string();
    if (char === "[") {
      offset++;
      return sequence("]", () => value(depth + 1));
    }
    if (char === "{") {
      offset++;
      const object = Object.create(null);
      sequence("}", () => {
        skip();
        const key = source[offset] === '"' ? string() : identifier();
        if (FORBIDDEN_KEYS.has(key) || Object.hasOwn(object, key))
          error(`Forbidden or duplicate property: ${key}`, start);
        token(":");
        object[key] = value(depth + 1);
      });
      return object;
    }
    const number = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      source.slice(offset),
    );
    if (number) {
      offset += number[0].length;
      const parsed = Number(number[0]);
      if (!Number.isFinite(parsed)) error("Number must be finite", start);
      return parsed;
    }
    const name = identifier();
    if (name === "true") return true;
    if (name === "false") return false;
    if (name === "null") return null;
    if (
      [
        "import",
        "export",
        "eval",
        "function",
        "new",
        "return",
        "if",
        "for",
        "while",
      ].includes(name)
    )
      error(`Reserved word: ${name}`, start);
    token("(");
    const args = sequence(")", () => value(depth + 1));
    if (++nodes > 10000) error("Maximum component count is 10000", start);
    return {
      type: name,
      args,
      loc: {
        ...location(start),
        endLine: location(offset).line,
        endColumn: location(offset).column,
      },
    };
  };
  const root = value();
  skip();
  if (offset !== source.length) error("Only one root component is allowed");
  if (!root || typeof root.type !== "string" || !Array.isArray(root.args))
    error("Document must be a component call", 0);
  return root;
}
