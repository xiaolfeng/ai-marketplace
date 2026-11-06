// Shared contract for trusted preset adapters. XSU nodes are data, never executable code.
export class XsuError extends Error {
  constructor(code, message, node, related = []) {
    super(message);
    this.name = "XsuError";
    this.diagnostic = {
      code,
      severity: "error",
      message,
      ...(node?.loc || {}),
      related,
    };
  }
}

export function fail(node, code, message) {
  throw new XsuError(code, message, node);
}

export function isNode(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.type === "string" &&
    Array.isArray(value.args)
  );
}

export function props(node) {
  const value = node.args[0];
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    isNode(value)
  )
    fail(
      node,
      "XSU_SIGNATURE",
      `${node.type} requires an object as its first argument`,
    );
  return value;
}

export function children(node) {
  if (node.args.length < 2) return [];
  if (
    !Array.isArray(node.args[1]) ||
    node.args[1].some((value) => !isNode(value))
  )
    fail(
      node,
      "XSU_SIGNATURE",
      `${node.type} children must be an array of components`,
    );
  return node.args[1];
}

export function checkProps(node, schema, required = [], maxArgs = 2) {
  const value = props(node);
  if (node.args.length > maxArgs)
    fail(node, "XSU_SIGNATURE", `Too many arguments for ${node.type}`);
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(schema, key))
      fail(node, "XSU_PROP", `Unknown ${node.type} property: ${key}`);
    const expected = schema[key];
    const item = value[key];
    const valid =
      expected === "any" ||
      (Array.isArray(expected)
        ? expected.includes(item)
        : expected === "array"
          ? Array.isArray(item)
          : expected === "object"
            ? !!item &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              !isNode(item)
            : typeof item === expected);
    if (!valid || (typeof item === "number" && !Number.isFinite(item)))
      fail(
        node,
        "XSU_PROP",
        `${node.type}.${key} must be ${Array.isArray(expected) ? expected.join(" | ") : expected}`,
      );
  }
  for (const key of required)
    if (
      value[key] === undefined ||
      value[key] === null ||
      (typeof value[key] === "string" && !value[key].trim())
    )
      fail(node, "XSU_REQUIRED", `${node.type}.${key} is required`);
  return value;
}

export function textArg(node) {
  if (node.args.length !== 1 || typeof node.args[0] !== "string")
    fail(node, "XSU_SIGNATURE", `${node.type} requires one string`);
  return node.args[0];
}

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeUrl(value, node) {
  const url = String(value);
  if (/[\u0000-\u0020\u007f]/.test(url))
    fail(node, "XSU_URL", "URL contains whitespace or control characters");
  if (/^#[A-Za-z][\w-]*$/.test(url)) return url;
  if (!/^(https?:\/\/|mailto:)/i.test(url))
    fail(
      node,
      "XSU_URL",
      "Only http, https, mailto or internal anchors are supported",
    );
  try {
    new URL(url);
  } catch {
    fail(node, "XSU_URL", "Invalid URL");
  }
  return url;
}

export function stableJson(value) {
  const sort = (item) =>
    Array.isArray(item)
      ? item.map(sort)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, sort(item[key])]),
          )
        : item;
  return JSON.stringify(sort(value));
}

export function scriptJson(value) {
  return stableJson(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function checkDiagram(source, node, context) {
  if (context.network !== "connected")
    fail(
      node,
      "XSU_NETWORK_REQUIRED",
      "Pele diagrams require --network connected",
    );
  if (/^(?:\s*%%\{)|<[A-Za-z/!]|\bclick\s|javascript:|https?:\/\//im.test(source))
    fail(
      node,
      "XSU_DIAGRAM",
      "Diagram directives, HTML and interactive links are not supported",
    );
}
