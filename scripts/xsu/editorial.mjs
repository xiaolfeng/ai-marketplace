import {
  fail,
  isNode,
  props,
  children,
  esc,
  safeUrl,
  textArg,
  checkDiagram,
  stableJson,
} from "./contracts.mjs";

// The registry is deliberately data-only: the CLI can print the exact validation contract.
const str = { type: "string" };
const nonempty = { type: "string", minLength: 1 };
const num = { type: "number", minimum: -1e100, maximum: 1e100 };
const positive = { ...num, minimum: 0 };
const bool = { type: "boolean" };
const en = (...values) => ({ enum: values });
const arr = (items, maxItems = 5000) => ({ type: "array", items, maxItems });
const obj = (properties, required = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const tone = en("neutral", "good", "warn", "bad", "info");
const status = en("done", "progress", "warn", "blocked", "plan", "info");
const scalar = { anyOf: [str, num, bool, { type: "null" }] };
const cell = {
  anyOf: [scalar, { nodeTypes: ["Badge", "EvidenceLabel", "Sparkline"] }],
};
const words = arr(nonempty);
const named = obj(
  { label: nonempty, value: { anyOf: [nonempty, num] }, note: str },
  ["label", "value"],
);
const link = obj(
  { title: nonempty, url: { type: "url" }, note: str, id: nonempty },
  ["title", "url"],
);
const image = obj({ src: nonempty, alt: nonempty, caption: str, title: str }, [
  "src",
  "alt",
]);
const itemText = obj({ title: nonempty, detail: str }, ["title"]);
const task = obj(
  { title: nonempty, detail: str, priority: str, owner: str, status },
  ["title"],
);
const flowNode = obj(
  {
    id: nonempty,
    title: nonempty,
    detail: str,
    accent: bool,
    state: en(
      "initial",
      "in-progress",
      "active",
      "terminal-success",
      "terminal-fail",
    ),
  },
  ["id", "title"],
);
const edge = obj(
  { from: nonempty, to: nonempty, label: str, guard: str, return: bool },
  ["from", "to"],
);
const properties = Object.create(null);
const groups = Object.create(null);
function register(
  name,
  schema,
  required = [],
  signature = "props",
  group = "content",
) {
  properties[name] = {
    name,
    signatures:
      signature === "text"
        ? ["(text)"]
        : signature === "code"
          ? ["(props, text)"]
          : signature === "children"
            ? ["(props, children)"]
            : ["(props)"],
    propsSchema: obj(schema, required),
    allowedParents: [],
    allowedChildren: [],
    presets: ["editorial"],
    features: [],
    render: name,
    lowerToReplay: null,
    toMarkdown: null,
  };
  groups[name] = { signature, group };
}
register(
  "Report",
  {
    xsuVersion: en(1),
    id: nonempty,
    preset: en("editorial"),
    title: nonempty,
    date: nonempty,
    theme: en("system", "light", "dark"),
    brand: str,
    subtitle: str,
    author: str,
    footer: str,
  },
  ["xsuVersion", "id", "preset", "title", "date"],
  "children",
  "root",
);
register(
  "Section",
  { id: nonempty, title: nonempty, number: str, intro: str, kicker: str },
  ["id", "title"],
  "children",
  "layout",
);
register(
  "Row",
  { variant: en("equal", "split-note") },
  [],
  "children",
  "layout",
);
register("Stack", {}, [], "children", "layout");
register("Grid", { columns: en(1, 2, 3, 4) }, [], "children", "layout");
register(
  "Split",
  { variant: en("default", "equal", "note") },
  [],
  "children",
  "layout",
);
register(
  "Details",
  { title: nonempty, tag: str, open: bool },
  ["title"],
  "children",
  "layout",
);
register(
  "Cover",
  {
    variant: en("default", "banner", "metric", "minimal", "split-lead"),
    kicker: str,
    lead: str,
    publication: str,
    documentId: str,
    author: str,
    reviewer: str,
    readingTime: str,
    status,
    metric: obj(
      {
        label: nonempty,
        value: { anyOf: [nonempty, num] },
        unit: str,
        delta: str,
        tone,
      },
      ["label", "value"],
    ),
  },
  [],
  "children",
  "cover",
);
register("Takeaway", { title: str, text: nonempty }, ["text"]);
register(
  "Glance",
  {
    items: arr(
      obj({ label: nonempty, value: nonempty, note: str }, ["label", "value"]),
    ),
  },
  ["items"],
);
register("Markdown", {}, [], "text");
register("Quote", { text: nonempty, source: str }, ["text"]);
register("List", { items: arr({ anyOf: [str, itemText] }), ordered: bool }, [
  "items",
]);
register("Sources", { title: str, meta: str, items: arr(link) }, ["items"]);
register("Code", { language: str }, [], "code");
register("Metrics", { variant: en("grid", "tape") }, [], "children", "metrics");
register(
  "Metric",
  {
    label: nonempty,
    value: { anyOf: [nonempty, num] },
    unit: str,
    note: str,
    tone,
    delta: str,
    progress: { ...num, minimum: 0, maximum: 100 },
    variant: en("kpi", "scope"),
    tag: str,
    status,
  },
  ["label", "value"],
  "props",
  "metric",
);
register(
  "Progress",
  {
    value: positive,
    max: { ...positive, exclusiveMinimum: 0 },
    label: str,
    note: str,
    tone,
  },
  ["value"],
);
register("Badge", { text: nonempty, status }, ["text", "status"]);
register(
  "EvidenceLabel",
  { text: str, kind: en("confirmed", "reported", "inferred", "unknown") },
  ["kind"],
);
register(
  "Compare",
  {
    items: arr(
      obj({ title: nonempty, tag: str, items: words, target: bool }, [
        "title",
        "items",
      ]),
    ),
  },
  ["items"],
);
const tabular = {
  columns: words,
  rows: arr(arr(cell, 40)),
  highlight: { type: "integer", minimum: 0, maximum: 39 },
  title: str,
  meta: str,
  variant: en("default", "benchmark", "risk", "actions", "sparkline"),
  highlightRow: { type: "integer", minimum: 0, maximum: 4999 },
};
register("Table", tabular, ["columns", "rows"]);
register("CompareTable", tabular, ["columns", "rows"]);
register("Diff", { title: str, before: str, after: str, language: str }, [
  "before",
  "after",
]);
register(
  "Scorecard",
  {
    title: str,
    subtitle: str,
    criteria: arr(
      obj({ name: nonempty, weight: positive, detail: str }, [
        "name",
        "weight",
      ]),
    ),
    options: arr(
      obj(
        { name: nonempty, scores: arr({ ...num, minimum: 0, maximum: 10 }) },
        ["name", "scores"],
      ),
    ),
  },
  ["criteria", "options"],
);
register(
  "Decision",
  { title: str, options: words, choice: nonempty, rationale: nonempty },
  ["options", "choice", "rationale"],
);
register(
  "Chart",
  {
    title: str,
    subtitle: str,
    kind: en("bar", "line", "area", "donut", "scatter", "stacked-bar"),
    labels: arr(str),
    series: arr(
      obj(
        {
          name: nonempty,
          values: arr({
            anyOf: [
              num,
              { type: "null" },
              obj({ x: num, y: num, label: str, outlier: bool }, ["x", "y"]),
            ],
          }),
          tone,
        },
        ["name", "values"],
      ),
      20,
    ),
    unit: str,
    threshold: num,
  },
  ["kind", "labels", "series"],
);
register("Sparkline", { values: arr(num), tone, label: str }, ["values"]);
register(
  "Gauge",
  {
    title: str,
    subtitle: str,
    value: num,
    min: num,
    max: num,
    label: str,
    unit: str,
    details: arr(named),
    tone,
  },
  ["value"],
);
register(
  "Heatmap",
  {
    title: str,
    subtitle: str,
    columns: words,
    rows: words,
    values: arr(arr(positive)),
  },
  ["columns", "rows", "values"],
);
register(
  "Quadrant",
  {
    title: str,
    subtitle: str,
    items: arr(
      obj(
        {
          title: nonempty,
          x: { ...num, minimum: 0, maximum: 1 },
          y: { ...num, minimum: 0, maximum: 1 },
          status,
        },
        ["title", "x", "y"],
      ),
    ),
    labels: words,
  },
  ["items"],
);
register(
  "Roadmap",
  {
    title: str,
    subtitle: str,
    items: arr(
      obj(
        {
          title: nonempty,
          start: nonempty,
          end: nonempty,
          lane: str,
          status: en("done", "active", "crit", "plan"),
          milestone: bool,
        },
        ["title", "start", "end"],
      ),
    ),
    markers: arr(obj({ date: nonempty, label: nonempty }, ["date", "label"])),
  },
  ["items"],
);
register(
  "Timeline",
  {
    title: str,
    meta: str,
    variant: en("default", "incident"),
    items: arr(
      obj({ time: nonempty, title: nonempty, detail: str, status, tone }, [
        "time",
        "title",
      ]),
    ),
  },
  ["items"],
);
register(
  "Flow",
  {
    title: str,
    note: str,
    loop: str,
    nodes: arr(flowNode, 100),
    edges: arr(edge, 200),
  },
  ["nodes", "edges"],
);
const treeItem = obj(
  { name: nonempty, note: str, children: { type: "tree" } },
  ["name"],
);
register("Tree", { title: str, items: arr(treeItem) }, ["items"]);
register(
  "Diagram",
  {
    engine: en("mermaid", "pele"),
    source: nonempty,
    title: str,
    variant: en("default", "gantt"),
  },
  ["source"],
);
register(
  "People",
  {
    items: arr(
      obj({ name: nonempty, department: str, role: str, detail: str, status }, [
        "name",
      ]),
    ),
  },
  ["items"],
);
register("Gallery", { columns: en(2, 3), items: arr(image) }, ["items"]);
register("Image", image.properties, image.required);
register(
  "OpenQuestions",
  { title: str, items: arr({ anyOf: [nonempty, itemText] }) },
  ["items"],
);
register(
  "Callout",
  { tone, title: str, variant: en("default", "split-note") },
  [],
  "children",
  "layout",
);
register(
  "Evidence",
  {
    kind: en("code", "command", "quote", "table", "diagram"),
    title: nonempty,
    content: nonempty,
  },
  ["kind", "title", "content"],
);
// These components cover the newer fragments which were absent from the original index.
register(
  "Takeaways",
  {
    items: arr(obj({ title: nonempty, detail: str, active: bool }, ["title"])),
  },
  ["items"],
);
register(
  "FAQ",
  {
    title: str,
    meta: str,
    items: arr(
      obj({ question: nonempty, answer: nonempty, open: bool }, [
        "question",
        "answer",
      ]),
    ),
  },
  ["items"],
);
register(
  "Glossary",
  {
    title: str,
    items: arr(
      obj({ term: nonempty, definition: nonempty }, ["term", "definition"]),
    ),
  },
  ["items"],
);
register(
  "Interview",
  {
    title: str,
    meta: str,
    items: arr(
      obj(
        { speaker: nonempty, text: nonempty, role: en("question", "answer") },
        ["speaker", "text", "role"],
      ),
    ),
  },
  ["items"],
);
register("Json", { title: str, meta: str, value: { type: "json" } }, ["value"]);
register(
  "Terminal",
  {
    title: str,
    shell: str,
    lines: arr(
      obj(
        {
          text: str,
          kind: en("command", "output", "info", "good", "warn", "bad"),
        },
        ["text"],
      ),
    ),
  },
  ["lines"],
);
register(
  "Kanban",
  {
    title: str,
    columns: arr(
      obj(
        {
          title: nonempty,
          status: en("todo", "active", "review", "done"),
          items: arr(task),
        },
        ["title", "status", "items"],
      ),
      4,
    ),
  },
  ["columns"],
);
register("ProsCons", { title: str, pros: words, cons: words }, [
  "pros",
  "cons",
]);
register(
  "DecisionLog",
  {
    title: str,
    items: arr(
      obj(
        {
          id: nonempty,
          title: nonempty,
          status,
          detail: str,
          owner: str,
          date: str,
          alternative: str,
        },
        ["id", "title", "status"],
      ),
    ),
  },
  ["items"],
);
register(
  "ReleaseNotes",
  {
    version: nonempty,
    date: nonempty,
    status,
    sections: arr(
      obj({ kind: en("feat", "fix", "break"), title: nonempty, items: words }, [
        "kind",
        "title",
        "items",
      ]),
    ),
  },
  ["version", "date", "sections"],
);
register(
  "Incident",
  {
    title: nonempty,
    level: en("p0", "p1", "p2", "p3"),
    cause: str,
    status,
    impact: arr(named),
  },
  ["title", "level"],
);
register(
  "RootCause",
  {
    title: str,
    items: arr(
      obj({ question: nonempty, answer: nonempty, label: str, root: bool }, [
        "question",
        "answer",
      ]),
    ),
  },
  ["items"],
);
register(
  "Architecture",
  {
    title: str,
    layers: arr(
      obj(
        {
          title: nonempty,
          highlight: bool,
          connector: str,
          nodes: arr(
            obj({ title: nonempty, detail: str, accent: bool }, ["title"]),
          ),
        },
        ["title", "nodes"],
      ),
    ),
  },
  ["layers"],
);
register(
  "Sequence",
  {
    title: str,
    actors: words,
    steps: arr(
      obj(
        {
          from: { type: "integer", minimum: 1, maximum: 4 },
          to: { type: "integer", minimum: 1, maximum: 4 },
          text: nonempty,
          return: bool,
        },
        ["from", "to", "text"],
      ),
    ),
  },
  ["actors", "steps"],
);
register(
  "ServiceMesh",
  {
    title: str,
    columns: arr(
      obj(
        {
          title: nonempty,
          center: bool,
          items: arr(
            obj(
              {
                title: nonempty,
                detail: str,
                badge: str,
                status,
                pills: words,
              },
              ["title"],
            ),
          ),
        },
        ["title", "items"],
      ),
      3,
    ),
  },
  ["columns"],
);
register(
  "VisualCompare",
  {
    title: str,
    before: obj({ title: nonempty, text: str, image }, ["title"]),
    after: obj({ title: nonempty, text: str, image }, ["title"]),
  },
  ["before", "after"],
);
register(
  "StateMachine",
  { title: str, nodes: arr(flowNode), transitions: arr(edge) },
  ["nodes", "transitions"],
);
register(
  "Colophon",
  { editorial: nonempty, publication: nonempty, seal: str, issuer: str },
  ["editorial", "publication"],
);
const layouts = [
  "Section",
  "Row",
  "Stack",
  "Grid",
  "Split",
  "Details",
  "Callout",
];
const content = Object.keys(properties).filter(
  (name) => !["Report", "Cover", "Metric"].includes(name),
);
for (const [name, entry] of Object.entries(properties)) {
  entry.allowedChildren =
    name === "Report"
      ? ["Cover", ...content]
      : name === "Metrics"
        ? ["Metric"]
        : name === "Cover"
          ? ["Takeaway", "Badge", "EvidenceLabel", "Image"]
          : layouts.includes(name)
            ? content
            : [];
  if (["Diagram", "Evidence"].includes(name))
    entry.features.push("connected-diagrams");
  if (["Image", "Gallery", "VisualCompare", "Cover"].includes(name))
    entry.features.push("sandbox-images");
}
for (const [name, entry] of Object.entries(properties)) {
  entry.allowedParents = Object.values(properties)
    .filter((parent) => parent.allowedChildren.includes(name))
    .map((parent) => parent.name);
  if (["Badge", "EvidenceLabel", "Sparkline"].includes(name))
    entry.allowedParents.push("TableCell");
}
properties.Cover.signatures = ["(props)", "(props, children)"];
export const EDITORIAL_COMPONENTS = Object.freeze(properties);

function ensure(condition, node, message, code = "XSU_PROP") {
  if (!condition) fail(node, code, message);
}
function check(value, schema, node, path, context, depth = 0) {
  ensure(depth <= 64, node, `${path}: data nesting exceeds 64`);
  if (schema.anyOf) {
    for (const candidate of schema.anyOf) {
      try {
        check(value, candidate, node, path, context, depth + 1);
        return;
      } catch (error) {
        if (!error?.diagnostic) throw error;
      }
    }
    fail(node, "XSU_PROP", `${path}: does not match an allowed value shape`);
  }
  if (schema.enum) {
    ensure(
      schema.enum.includes(value),
      node,
      `${path}: expected ${schema.enum.join(" | ")}`,
    );
    return;
  }
  if (schema.nodeTypes) {
    ensure(
      isNode(value) && schema.nodeTypes.includes(value.type),
      node,
      `${path}: unsupported cell component`,
    );
    validateNode(value, "TableCell", context, new Set(), depth + 1);
    return;
  }
  const type = schema.type;
  if (type === "json") {
    ensure(!isNode(value), node, `${path}: components are not JSON values`);
    if (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "string"
    )
      return;
    if (typeof value === "number")
      return check(value, num, node, path, context, depth + 1);
    if (Array.isArray(value)) {
      ensure(value.length <= 5000, node, `${path}: too many values`);
      value.forEach((v, i) =>
        check(v, schema, node, `${path}[${i}]`, context, depth + 1),
      );
      return;
    }
    ensure(
      value && typeof value === "object",
      node,
      `${path}: expected JSON data`,
    );
    Object.entries(value).forEach(([k, v]) => {
      ensure(
        !["__proto__", "constructor", "prototype"].includes(k),
        node,
        `${path}: forbidden key ${k}`,
      );
      check(v, schema, node, `${path}.${k}`, context, depth + 1);
    });
    return;
  }
  if (type === "tree")
    return check(value, arr(treeItem), node, path, context, depth + 1);
  if (type === "url") {
    ensure(typeof value === "string", node, `${path}: expected URL`);
    safeUrl(value, node);
    return;
  }
  if (type === "array") {
    ensure(Array.isArray(value), node, `${path}: expected array`);
    ensure(
      value.length <= schema.maxItems,
      node,
      `${path}: exceeds ${schema.maxItems} items`,
    );
    value.forEach((v, i) =>
      check(v, schema.items, node, `${path}[${i}]`, context, depth + 1),
    );
    return;
  }
  if (type === "object") {
    ensure(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !isNode(value),
      node,
      `${path}: expected object`,
    );
    for (const key of Object.keys(value)) {
      ensure(
        Object.hasOwn(schema.properties, key),
        node,
        `${path}: unknown field ${key}`,
      );
      check(
        value[key],
        schema.properties[key],
        node,
        `${path}.${key}`,
        context,
        depth + 1,
      );
    }
    for (const key of schema.required)
      ensure(
        Object.hasOwn(value, key),
        node,
        `${path}.${key}: required`,
        "XSU_REQUIRED",
      );
    return;
  }
  ensure(
    type === "null"
      ? value === null
      : type === "integer"
        ? Number.isInteger(value)
        : typeof value === type,
    node,
    `${path}: expected ${type}`,
  );
  if (type === "string" && value.length > 160) {
    const message = `${path} is ${value.length} characters; verify wrapping in the browser (content is not truncated)`;
    if (
      !context.warnings.some(
        (warning) =>
          warning.code === "XSU_LONG_TEXT" &&
          warning.message === message &&
          warning.file === node.loc?.file &&
          warning.line === node.loc?.line,
      )
    )
      context.warnings.push({
        code: "XSU_LONG_TEXT",
        severity: "warning",
        message,
        ...node.loc,
      });
  }
  if (type === "string" && schema.minLength)
    ensure(
      value.trim().length >= schema.minLength,
      node,
      `${path}: must not be empty`,
      "XSU_REQUIRED",
    );
  if (type === "number" || type === "integer") {
    ensure(
      Number.isFinite(value) &&
        value >= (schema.minimum ?? -Infinity) &&
        value <= (schema.maximum ?? Infinity),
      node,
      `${path}: number is outside supported finite range`,
    );
    if (schema.exclusiveMinimum !== undefined)
      ensure(
        value > schema.exclusiveMinimum,
        node,
        `${path}: must be greater than ${schema.exclusiveMinimum}`,
      );
  }
}
function date(value, node) {
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    node,
    `Invalid ISO date: ${value}`,
  );
  return Date.parse(value);
}
function validateNode(node, parent, context, ids, depth = 0) {
  ensure(
    depth <= 64 && isNode(node),
    node,
    "Expected a component; nesting must not exceed 64",
    "XSU_COMPONENT",
  );
  const entry = properties[node.type];
  ensure(
    entry,
    node,
    `Unknown editorial component: ${node.type}`,
    "XSU_COMPONENT",
  );
  ensure(
    parent === null
      ? node.type === "Report"
      : parent === "TableCell"
        ? ["Badge", "EvidenceLabel", "Sparkline"].includes(node.type)
        : properties[parent].allowedChildren.includes(node.type),
    node,
    `${node.type} is not allowed inside ${parent ?? "document"}`,
    "XSU_NESTING",
  );
  const signature = groups[node.type].signature;
  if (signature === "text") {
    markdown(textArg(node), node);
    return;
  }
  const p = props(node);
  check(p, entry.propsSchema, node, node.type, context);
  ensure(
    (node.type === "Cover" && node.args.length === 1) ||
      node.args.length ===
        (signature === "code" ? 2 : signature === "children" ? 2 : 1),
    node,
    `${node.type}: expected ${entry.signatures[0]}`,
    "XSU_SIGNATURE",
  );
  if (signature === "code")
    ensure(
      typeof node.args[1] === "string",
      node,
      "Code content must be a string",
      "XSU_SIGNATURE",
    );
  if (p.id !== undefined) {
    ensure(/^[A-Za-z][\w-]*$/.test(p.id), node, `Invalid ID ${p.id}`);
    ensure(!ids.has(p.id), node, `Duplicate ID ${p.id}`, "XSU_ID");
    ids.add(p.id);
  }
  switch (node.type) {
    case "Image":
      readImage(p, node, context);
      break;
    case "Gallery":
      p.items.forEach((item) => readImage(item, node, context));
      break;
    case "VisualCompare":
      [p.before, p.after].forEach((item) => {
        if (item.image) readImage(item.image, node, context);
      });
      break;
    case "Sources":
      p.items.forEach((item) => {
        if (item.id !== undefined) {
          ensure(
            /^[A-Za-z][\w-]{0,63}$/.test(item.id) && !ids.has(item.id),
            node,
            "Source IDs must be valid and unique",
            "XSU_ID",
          );
          ids.add(item.id);
        }
      });
      break;
    case "Report":
      date(p.date, node);
      break;
    case "Cover":
      ensure(
        p.variant !== "metric" || p.metric,
        node,
        "Metric Cover requires metric",
      );
      break;
    case "Grid":
      break;
    case "Split":
      ensure(
        children(node).length === 2,
        node,
        "Split requires exactly two children",
      );
      break;
    case "Row":
      if (p.variant === "split-note")
        ensure(
          children(node).length === 2,
          node,
          "split-note requires exactly two children",
        );
      break;
    case "Callout":
      if (p.variant === "split-note")
        ensure(
          children(node).length === 2,
          node,
          "split-note requires exactly two children",
        );
      break;
    case "Progress":
      ensure(
        p.value <= (p.max ?? 100),
        node,
        "Progress value must be within [0, max]",
      );
      break;
    case "Table":
    case "CompareTable":
      ensure(
        p.columns.length > 0 && p.columns.length <= 40,
        node,
        "Table requires 1..40 columns",
      );
      p.rows.forEach((row) =>
        ensure(
          row.length === p.columns.length,
          node,
          "Table row dimensions must match columns",
          "XSU_DIMENSION",
        ),
      );
      if (p.highlight !== undefined)
        ensure(
          p.highlight < p.columns.length,
          node,
          "highlight column does not exist",
        );
      if (p.highlightRow !== undefined)
        ensure(
          p.highlightRow < p.rows.length,
          node,
          "highlightRow does not exist",
        );
      break;
    case "Scorecard": {
      ensure(
        p.criteria.length > 0 && p.options.length > 0,
        node,
        "Scorecard requires criteria and options",
      );
      const total = p.criteria.reduce(
        (sum, criterion) => sum + criterion.weight,
        0,
      );
      ensure(
        total > 0 && Number.isFinite(total),
        node,
        "Scorecard weights must have a finite positive sum",
      );
      p.options.forEach((o) =>
        ensure(
          o.scores.length === p.criteria.length,
          node,
          "Score dimensions must match criteria",
          "XSU_DIMENSION",
        ),
      );
      break;
    }
    case "Decision":
      ensure(
        p.options.length >= 2 &&
          new Set(p.options).size === p.options.length &&
          p.options.includes(p.choice),
        node,
        "Decision requires distinct options and an exact choice",
      );
      break;
    case "Chart":
      validateChart(p, node);
      break;
    case "Gauge":
      ensure(
        (p.min ?? 0) < (p.max ?? 100) &&
          p.value >= (p.min ?? 0) &&
          p.value <= (p.max ?? 100),
        node,
        "Gauge value must be within increasing min/max",
      );
      break;
    case "Heatmap":
      ensure(
        p.values.length === p.rows.length &&
          p.values.every((row) => row.length === p.columns.length),
        node,
        "Heatmap dimensions must match axes",
        "XSU_DIMENSION",
      );
      ensure(
        p.rows.length * p.columns.length <= 5000,
        node,
        "Heatmap exceeds 5000 data points",
      );
      break;
    case "Quadrant":
      if (p.labels)
        ensure(
          p.labels.length === 4,
          node,
          "Quadrant requires exactly four labels",
        );
      break;
    case "Roadmap":
      p.items.forEach((i) =>
        ensure(
          date(i.start, node) <= date(i.end, node),
          node,
          "Roadmap end precedes start",
        ),
      );
      p.markers?.forEach((i) => date(i.date, node));
      break;
    case "Flow":
    case "StateMachine": {
      const nodeIds = new Set(p.nodes.map((i) => i.id));
      ensure(
        nodeIds.size === p.nodes.length,
        node,
        "Graph node IDs must be unique",
      );
      (p.edges ?? p.transitions).forEach((e) =>
        ensure(
          nodeIds.has(e.from) && nodeIds.has(e.to),
          node,
          "Graph edge references a missing node",
          "XSU_REFERENCE",
        ),
      );
      break;
    }
    case "Diagram":
      checkDiagram(p.source, node, context);
      break;
    case "Evidence":
      if (p.kind === "diagram") checkDiagram(p.content, node, context);
      break;
    case "Sequence":
      ensure(
        p.actors.length === 4,
        node,
        "Sequence uses the fixed four-actor CSS layout",
      );
      p.steps.forEach((s) =>
        ensure(s.from !== s.to, node, "Sequence endpoints must differ"),
      );
      break;
    case "ServiceMesh":
      ensure(
        p.columns.length === 3 &&
          p.columns.filter((c) => c.center).length === 1 &&
          p.columns[1].center,
        node,
        "ServiceMesh requires three columns with center in the middle",
      );
      break;
    case "ReleaseNotes":
      date(p.date, node);
      break;
  }
  if (signature === "children")
    children(node).forEach((child) =>
      validateNode(child, node.type, context, ids, depth + 1),
    );
}
function validateChart(p, node) {
  if (p.threshold !== undefined)
    ensure(
      p.kind === "scatter",
      node,
      "threshold is only supported by scatter charts",
    );
  const count = p.series.reduce((n, s) => n + s.values.length, 0);
  ensure(count <= 5000, node, "Chart exceeds 5000 data points");
  if (!p.labels.length || !p.series.length) {
    ensure(count === 0, node, "Chart data requires labels and series");
    return;
  }
  if (p.kind === "donut")
    ensure(p.series.length === 1, node, "Donut requires exactly one series");
  for (const s of p.series) {
    if (p.kind !== "scatter")
      ensure(
        s.values.length === p.labels.length,
        node,
        "Series lengths must match labels",
        "XSU_DIMENSION",
      );
    for (const v of s.values) {
      if (p.kind === "scatter")
        ensure(
          v !== null && typeof v === "object",
          node,
          "Scatter values require {x,y}",
        );
      else {
        ensure(
          v === null || typeof v === "number",
          node,
          "Numeric chart values must be numbers or null",
        );
        if (["donut", "stacked-bar"].includes(p.kind))
          ensure(
            v !== null && v >= 0,
            node,
            `${p.kind} requires nonnegative numbers (no missing values)`,
          );
      }
    }
  }
}
export function validateEditorial(root, context = {}) {
  const ctx = {
    network: "offline",
    warnings: [],
    imageCache: new Map(),
    ...context,
    measureImages: true,
    imageReferenceBytes: 0,
  };
  validateNode(root, null, ctx, new Set());
  for (const type of ["Cover", "Glance", "OpenQuestions", "Colophon"])
    ensure(
      children(root).filter((n) => n.type === type).length <= 1,
      root,
      `Report accepts at most one top-level ${type}`,
      "XSU_CARDINALITY",
    );
  ensure(
    children(root).filter((n) => n.type === "Takeaway").length <= 1,
    root,
    "Report accepts at most one top-level Takeaway",
    "XSU_CARDINALITY",
  );
  return root;
}

// Small token scanner, not regex substitutions over HTML. Unsupported Markdown is rejected.
function inline(source, node, depth = 0) {
  ensure(
    depth <= 32,
    node,
    "Markdown inline nesting exceeds 32",
    "XSU_MARKDOWN",
  );
  let out = "",
    i = 0;
  let linkMiddle = source.indexOf("]("),
    linkEnd = linkMiddle < 0 ? -1 : source.indexOf(")", linkMiddle + 2);
  while (i < source.length) {
    if (source[i] === "\\" && i + 1 < source.length) {
      out += esc(source[i + 1]);
      i += 2;
      continue;
    }
    if (source[i] === "`") {
      const end = source.indexOf("`", i + 1);
      ensure(end !== -1, node, "Unclosed inline code", "XSU_MARKDOWN");
      out += `<code>${esc(source.slice(i + 1, end))}</code>`;
      i = end + 1;
      continue;
    }
    if (source[i] === "[") {
      if (linkMiddle >= 0 && linkMiddle < i) {
        linkMiddle = source.indexOf("](", i + 1);
        linkEnd = linkMiddle < 0 ? -1 : source.indexOf(")", linkMiddle + 2);
      }
      const middle = linkMiddle,
        end = linkEnd;
      if (end >= 0) {
        const label = source.slice(i + 1, middle),
          url = source.slice(middle + 2, end);
        out += `<a href="${esc(safeUrl(url, node))}" rel="noopener noreferrer">${esc(label)}</a>`;
        i = end + 1;
        continue;
      }
    }
    const marker = source.startsWith("**", i)
      ? "**"
      : source[i] === "*"
        ? "*"
        : null;
    if (marker) {
      const end = source.indexOf(marker, i + marker.length);
      ensure(
        end > i + marker.length,
        node,
        "Unclosed emphasis",
        "XSU_MARKDOWN",
      );
      const tag = marker.length === 2 ? "strong" : "em";
      out += `<${tag}>${inline(source.slice(i + marker.length, end), node, depth + 1)}</${tag}>`;
      i = end + marker.length;
      continue;
    }
    if (source[i] === "<")
      ensure(
        !/^<\/?[A-Za-z!]/.test(source.slice(i, i + 3)),
        node,
        "Raw HTML is not supported",
        "XSU_MARKDOWN",
      );
    out += esc(source[i++]);
  }
  return out;
}
function markdown(source, node) {
  ensure(
    !/(^|\n)[ \t]*(#{1,6}\s|```|~~~|>|\|)|!\[|\[\^|(^|\n) {2,}[-*+\d]/.test(
      source,
    ),
    node,
    "Unsupported Markdown extension; use a dedicated component",
    "XSU_MARKDOWN",
  );
  const blocks = source.split(/\n\s*\n/);
  return blocks
    .filter((b) => b.trim())
    .map((block) => {
      const lines = block.split("\n"),
        list = lines.every((l) => /^[-*+]\s+/.test(l)),
        ordered = lines.every((l) => /^\d+\.\s+/.test(l));
      if (list || ordered)
        return `<${ordered ? 'ol class="steps"' : 'ul class="bits"'}>${lines.map((l) => `<li>${inline(l.replace(/^(?:[-*+]|\d+\.)\s+/, ""), node)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`;
      ensure(
        !lines.some((l) => /^(?:[-*+]\s+|\d+\.\s+)/.test(l)),
        node,
        "Separate Markdown lists from paragraphs with a blank line",
        "XSU_MARKDOWN",
      );
      return `<p>${inline(block.replace(/\n/g, " "), node)}</p>`;
    })
    .join("");
}
const tones = {
  neutral: "",
  good: "success",
  warn: "warn",
  bad: "danger",
  info: "info",
};
const colors = ["var(--accent)", "var(--mark)", "var(--rose)", "var(--subtle)"];
const color = (index) => colors[index % colors.length];
const fmt = (n) => Number(n.toFixed(4)).toString();
const h = (tag, cls, body, attrs = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""}${attrs ? ` ${attrs}` : ""}>${body}</${tag}>`;
const div = (cls, body, attrs) => h("div", cls, body, attrs);
const span = (cls, value) => h("span", cls, esc(value));
const badge = (text, state = "plan") =>
  h(
    "span",
    `badge badge-${state === "info" ? "progress" : state}`,
    esc(text),
    state === "info" ? 'data-status="info"' : "",
  );
const titleHead = (prefix, title = "", meta = "") =>
  div(
    `${prefix}-head`,
    span(`${prefix}-title`, title) + span(`${prefix}-meta`, meta),
  );
const panel = (prefix, title, body, meta) =>
  div(`${prefix}-box`, titleHead(prefix, title, meta) + body);
const bullet = (items) =>
  h("ul", "bits", items.map((i) => h("li", "", esc(i))).join(""));
const svg = (content, label, width = 600, height = 240, cls = "chart-svg") =>
  `<svg class="${cls}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label || "数据图表")}">${content}</svg>`;
const textSvg = (x, y, text, anchor = "middle") =>
  `<text x="${fmt(x)}" y="${fmt(y)}" class="chart-label" text-anchor="${anchor}">${esc(text)}</text>`;
const lineSvg = (x1, y1, x2, y2, stroke = "var(--rule)") =>
  `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${stroke}"/>`;
function domain(values, zero = false) {
  let lo = zero ? Math.min(0, ...values) : Math.min(...values),
    hi = zero ? Math.max(0, ...values) : Math.max(...values);
  if (!values.length) return [0, 1];
  if (lo === hi) {
    if (lo === 0) hi = 1;
    else {
      const pad = Math.max(Math.abs(lo) * 0.1, Number.MIN_VALUE);
      lo -= pad;
      hi += pad;
    }
  }
  return [lo, hi];
}
const scale = (n, lo, hi, start, end) =>
  start + ((n - lo) / (hi - lo)) * (end - start);
const emptyChart = () => h("p", "chart-sub", "暂无数据");
function chartBox(p, body, legend = "") {
  return div(
    "chart-box",
    div(
      "chart-head",
      div(
        "",
        div("chart-title", esc(p.title || "")) +
          div("chart-sub", esc(p.subtitle || p.unit || "")),
      ) + legend,
    ) + body,
  );
}
function renderChart(p) {
  const values = p.series
    .flatMap((s) => s.values)
    .filter((v) => typeof v === "number");
  if (
    !p.labels.length ||
    !p.series.length ||
    (!values.length && p.kind !== "scatter")
  )
    return chartBox(p, emptyChart());
  const legend = div(
    "chart-legend",
    p.series
      .map((s, i) =>
        h(
          "span",
          "legend-item",
          `<span class="legend-dot" style="background:${color(i)}"></span>${esc(s.name)}`,
        ),
      )
      .join(""),
  );
  if (p.kind === "donut") {
    const data = p.series[0].values,
      maximum = Math.max(...data),
      normalized = maximum ? data.map((v) => v / maximum) : data.map(() => 0),
      total = normalized.reduce((a, b) => a + b, 0),
      circumference = 2 * Math.PI * 60;
    if (!total) return chartBox(p, emptyChart());
    let offset = 0;
    const rings = normalized
      .map((v, i) => {
        const length = (v / total) * circumference;
        const circle = `<circle cx="80" cy="80" r="60" fill="none" stroke="${color(i)}" stroke-width="24" stroke-dasharray="${fmt(length)} ${fmt(circumference)}" stroke-dashoffset="${fmt(-offset)}"><title>${esc(p.labels[i])}: ${esc(data[i])}${esc(p.unit || "")}</title></circle>`;
        offset += length;
        return circle;
      })
      .join("");
    return chartBox(
      p,
      div(
        "donut-wrap",
        div(
          "donut-svg-container",
          svg(rings, p.title, 160, 160, "donut-svg") +
            div(
              "donut-center",
              span("donut-center-num", "100%") +
                span("donut-center-label", p.unit || "TOTAL"),
            ),
        ) +
          div(
            "donut-legend-list",
            data
              .map((v, i) =>
                div(
                  "donut-legend-row",
                  `<span class="legend-dot" style="background:${color(i)}"></span>` +
                    span("donut-legend-name", p.labels[i]) +
                    h(
                      "strong",
                      "donut-legend-val",
                      `${fmt((normalized[i] / total) * 100)}%`,
                    ),
                ),
              )
              .join(""),
          ),
      ),
    );
  }
  let lo,
    hi,
    content = "";
  if (p.kind === "scatter") {
    const points = p.series.flatMap((s) => s.values);
    if (!points.length) return chartBox(p, emptyChart());
    const [xlo, xhi] = domain(points.map((v) => v.x));
    [lo, hi] = domain([
      ...points.map((v) => v.y),
      ...(p.threshold === undefined ? [] : [p.threshold]),
    ]);
    content = points
      .map(
        (v) =>
          `<circle cx="${fmt(scale(v.x, xlo, xhi, 50, 570))}" cy="${fmt(scale(v.y, lo, hi, 180, 30))}" r="${v.outlier ? 5 : 3.5}" fill="${v.outlier ? "var(--color-danger)" : color(0)}"><title>${esc(v.label || "")} (${esc(v.x)}, ${esc(v.y)})</title></circle>`,
      )
      .join("");
    content += textSvg(50, 212, xlo) + textSvg(570, 212, xhi);
    if (p.threshold !== undefined)
      content += lineSvg(
        50,
        scale(p.threshold, lo, hi, 180, 30),
        570,
        scale(p.threshold, lo, hi, 180, 30),
        "var(--color-danger)",
      );
  } else {
    const totals = p.labels.map((_, i) =>
      p.series.reduce((s, v) => s + (v.values[i] ?? 0), 0),
    );
    [lo, hi] = domain(p.kind === "stacked-bar" ? totals : values, true);
    const baseline = scale(0, lo, hi, 180, 30),
      spacing = 520 / p.labels.length;
    if (p.kind === "bar" || p.kind === "stacked-bar") {
      const width = (spacing * 0.72) / (p.kind === "bar" ? p.series.length : 1);
      p.labels.forEach((label, i) => {
        let sum = 0;
        p.series.forEach((s, j) => {
          const v = s.values[i];
          if (v === null) return;
          const stacked = p.kind === "stacked-bar",
            x = 50 + spacing * i + spacing * 0.14 + (stacked ? 0 : j * width),
            start = stacked ? sum : 0,
            end = start + v,
            y1 = scale(start, lo, hi, 180, 30),
            y2 = scale(end, lo, hi, 180, 30);
          content += `<rect x="${fmt(x)}" y="${fmt(Math.min(y1, y2))}" width="${fmt(width * 0.9)}" height="${fmt(Math.abs(y1 - y2))}" fill="${color(j)}"><title>${esc(label)} · ${esc(s.name)}: ${esc(v)}${esc(p.unit || "")}</title></rect>`;
          sum += v;
        });
      });
    } else {
      p.series.forEach((s, j) => {
        const segments = [];
        let segment = [];
        s.values.forEach((v, i) => {
          if (v === null) {
            if (segment.length) segments.push(segment);
            segment = [];
            return;
          }
          segment.push([
            p.labels.length === 1
              ? 310
              : 50 + (i * 520) / (p.labels.length - 1),
            scale(v, lo, hi, 180, 30),
            v,
            p.labels[i],
          ]);
        });
        if (segment.length) segments.push(segment);
        segments.forEach((points) => {
          const coords = points
            .map(([x, y]) => `${fmt(x)},${fmt(y)}`)
            .join(" ");
          if (p.kind === "area")
            content += `<polygon points="${fmt(points[0][0])},${fmt(baseline)} ${coords} ${fmt(points.at(-1)[0])},${fmt(baseline)}" fill="${color(j)}" opacity="0.18"/>`;
          content += `<polyline points="${coords}" fill="none" stroke="${color(j)}" stroke-width="2.5"/>`;
          content += points
            .map(
              ([x, y, v, label]) =>
                `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="3" fill="${color(j)}"><title>${esc(label)} · ${esc(s.name)}: ${esc(v)}${esc(p.unit || "")}</title></circle>`,
            )
            .join("");
        });
      });
    }
    const stride = Math.max(1, Math.ceil(p.labels.length / 10));
    p.labels.forEach((label, i) => {
      if (i % stride === 0 || i === p.labels.length - 1)
        content += textSvg(
          p.kind === "bar" || p.kind === "stacked-bar"
            ? 50 + spacing * (i + 0.5)
            : p.labels.length === 1
              ? 310
              : 50 + (i * 520) / (p.labels.length - 1),
          210,
          label,
        );
    });
  }
  let axes = "";
  for (let i = 0; i <= 3; i++) {
    const y = 180 - i * 50;
    axes +=
      lineSvg(50, y, 570, y) +
      textSvg(43, y + 4, fmt(lo + ((hi - lo) * i) / 3), "end");
  }
  return chartBox(
    p,
    div("chart-svg-wrap", svg(axes + content, p.title)),
    legend,
  );
}
function spark(p) {
  if (!p.values.length) return emptyChart();
  const [lo, hi] = domain(p.values);
  const coords = p.values.map((v, i) => [
    p.values.length === 1 ? 50 : (i * 100) / (p.values.length - 1),
    scale(v, lo, hi, 22, 2),
  ]);
  return svg(
    `<polyline points="${coords.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ")}" fill="none" stroke="${p.tone && p.tone !== "neutral" ? `var(--color-${tones[p.tone]})` : "var(--accent)"}" stroke-width="2"/>${coords.length === 1 ? `<circle cx="50" cy="${fmt(coords[0][1])}" r="2" fill="var(--accent)"/>` : ""}`,
    p.label || "趋势",
    100,
    24,
    "sparkline-svg",
  );
}
function readImage(p, node, context) {
  ensure(
    typeof context.readImage === "function",
    node,
    "Image requires a sandbox resource reader",
    "XSU_RESOURCE",
  );
  ensure(
    !/^[a-z][a-z0-9+.-]*:|^[\/]|[\u0000-\u001f\u007f]/i.test(p.src),
    node,
    "Images require a sandbox-relative local path",
    "XSU_RESOURCE",
  );
  const cacheKey = JSON.stringify([node.loc?.file || "", p.src]);
  const uri =
    context.imageCache?.get(cacheKey) ?? context.readImage(p.src, node);
  context.imageCache?.set(cacheKey, uri);
  ensure(
    typeof uri === "string" &&
      /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(uri),
    node,
    "Resource reader must return a raster image data URI",
    "XSU_RESOURCE",
  );
  if (context.measureImages) {
    context.imageReferenceBytes += Buffer.byteLength(uri);
    ensure(
      context.imageReferenceBytes <= 25 * 1024 * 1024,
      node,
      "Expanded image references exceed 25 MiB",
      "XSU_LIMIT",
    );
  }
  return `<img src="${esc(uri)}" alt="${esc(p.alt)}" loading="lazy"/>`;
}
function renderTable(p, node, context, compare = false) {
  const variant = p.variant || "default";
  const cells = p.rows
    .map((row, r) =>
      h(
        "tr",
        p.highlightRow === r ? "highlight-row" : "",
        row
          .map((v, c) =>
            h(
              "td",
              p.highlight === c
                ? "highlight"
                : isNode(v) && v.type === "Sparkline"
                  ? "spark-cell"
                  : "",
              isNode(v) ? renderNode(v, context) : esc(v),
              `data-label="${esc(p.columns[c])}"`,
            ),
          )
          .join(""),
      ),
    )
    .join("");
  const body = div(
    "table-wrap",
    h(
      "table",
      compare
        ? "compare-table"
        : `data${variant === "default" ? "" : ` ${variant === "sparkline" ? "sparkline-table" : variant === "actions" ? "action-table" : `${variant}-table`}`}`,
      h(
        "thead",
        "",
        h(
          "tr",
          "",
          p.columns
            .map((c, i) =>
              h("th", p.highlight === i ? "highlight" : "", esc(c)),
            )
            .join(""),
        ),
      ) + h("tbody", "", cells),
    ),
  );
  const prefix = { benchmark: "benchmark", risk: "risk", actions: "action" }[
    variant
  ];
  return prefix ? panel(prefix, p.title, body, p.meta) : body;
}
function renderMetric(p, tape = false) {
  const delta = span(
    `${tape ? "tape-delta" : "stat-delta"} delta-${p.tone === "good" ? "up" : p.tone === "bad" || p.tone === "warn" ? "warn" : "neutral"}`,
    p.delta || "",
  );
  if (tape)
    return div(
      "stat-tape-item",
      span("tape-label", p.label) +
        h("strong", "tape-val", esc(`${p.value ?? ""}${p.unit || ""}`)) +
        delta,
    );
  const scope = p.variant === "scope",
    stateClass =
      {
        good: "card-pass",
        warn: "card-warn",
        bad: "card-fail",
        info: "card-info",
      }[p.tone] || "";
  return div(
    `stat-card${scope && stateClass ? ` ${stateClass}` : ""}`,
    div(
      "stat-head",
      scope
        ? div(
            "card-title-group",
            span("compare-tag", p.tag || "") +
              h("strong", "card-title", esc(p.label)),
          ) +
            badge(
              p.value,
              p.status ||
                { good: "done", warn: "warn", bad: "blocked", info: "info" }[
                  p.tone
                ] ||
                "plan",
            )
        : span("stat-label", p.label) + delta,
    ) +
      (scope
        ? h("p", "stat-desc", esc(p.note || ""))
        : div("stat-val", esc(`${p.value ?? ""}${p.unit || ""}`)) +
          div("stat-footer", span("", p.note || ""))) +
      (p.progress !== undefined
        ? div(
            "progress-track",
            div(
              `progress-fill ${tones[p.tone] || ""}`.trim(),
              "",
              `style="width:${fmt(p.progress)}%"`,
            ),
          )
        : ""),
  );
}
function renderRoadmap(p) {
  if (!p.items.length) return panel("gantt", p.title, emptyChart());
  const dates = p.items
      .flatMap((i) => [Date.parse(i.start), Date.parse(i.end)])
      .concat((p.markers || []).map((m) => Date.parse(m.date))),
    lo = Math.min(...dates),
    hi = Math.max(...dates) === lo ? lo + 86400000 : Math.max(...dates),
    height = 80 + p.items.length * 34;
  let body =
    textSvg(180, 20, new Date(lo).toISOString().slice(0, 10)) +
    textSvg(760, 20, new Date(hi).toISOString().slice(0, 10));
  p.items.forEach((i, n) => {
    const y = 44 + n * 34,
      x = scale(Date.parse(i.start), lo, hi, 180, 760),
      end = scale(Date.parse(i.end), lo, hi, 180, 760);
    body += textSvg(
      170,
      y + 14,
      `${i.lane ? `${i.lane} · ` : ""}${i.title}`,
      "end",
    );
    const fill =
      i.status === "crit"
        ? "var(--color-danger)"
        : i.status === "done"
          ? "var(--color-success)"
          : i.status === "active"
            ? "var(--accent)"
            : "var(--subtle)";
    body += i.milestone
      ? `<polygon points="${fmt(x)},${y} ${fmt(x + 8)},${y + 10} ${fmt(x)},${y + 20} ${fmt(x - 8)},${y + 10}" fill="${fill}"/>`
      : `<rect x="${fmt(x)}" y="${y}" width="${fmt(Math.max(1, end - x))}" height="20" fill="${fill}"><title>${esc(i.start)} — ${esc(i.end)}</title></rect>`;
  });
  p.markers?.forEach((m) => {
    const x = scale(Date.parse(m.date), lo, hi, 180, 760);
    body +=
      lineSvg(x, 30, x, height - 10, "var(--mark)") +
      textSvg(x, height - 1, m.label);
  });
  return panel(
    "gantt",
    p.title,
    div("chart-svg-wrap", svg(body, p.title, 800, height)),
    p.subtitle,
  );
}
function renderNode(node, context) {
  const p = node.type === "Markdown" ? {} : props(node),
    kids = () =>
      children(node)
        .map((n) => renderNode(n, context))
        .join("");
  switch (node.type) {
    case "Section":
      return h(
        "section",
        "block",
        (p.kicker ? h("p", "kicker", esc(p.kicker)) : "") +
          div(
            "block-head",
            div("block-no", esc(p.number || "")) +
              div(
                "",
                h("h2", "", esc(p.title)) +
                  (p.intro ? h("p", "section-intro", esc(p.intro)) : ""),
              ),
          ) +
          kids(),
        `id="${esc(p.id)}"`,
      );
    case "Row":
      return div(
        p.variant === "split-note" ? "callout split-note" : "compare-grid",
        kids(),
      );
    case "Stack":
      return div("", kids());
    case "Grid":
      if (p.columns === 4) {
        const items = children(node);
        return div(
          "gallery-grid col-2",
          items
            .filter((_, i) => i % 2 === 0)
            .map((_, i) =>
              div(
                "compare-grid",
                items
                  .slice(i * 2, i * 2 + 2)
                  .map((item) => renderNode(item, context))
                  .join(""),
              ),
            )
            .join(""),
        );
      }
      return div(
        p.columns === 1
          ? "gallery-grid"
          : "gallery-grid col-" + (p.columns ?? 2),
        kids(),
      );
    case "Split":
      return div(
        p.variant === "note"
          ? "callout split-note"
          : p.variant === "equal"
            ? "compare-grid"
            : "split",
        kids(),
      );
    case "Details":
      return h(
        "details",
        "details-collapse",
        h(
          "summary",
          "details-summary",
          span("details-title", p.title) + span("details-tag", p.tag || ""),
        ) + div("details-content", kids()),
        p.open ? "open" : "",
      );
    case "Takeaway":
      return h(
        "aside",
        "takeaway",
        div("takeaway-title", esc(p.title || "核心判断 / VERDICT")) +
          h("p", "", esc(p.text)),
      );
    case "Glance":
      return div(
        "glance",
        p.items
          .map((i) =>
            div(
              "glance-item",
              h("p", "kicker", esc(i.label)) +
                h("p", "val", esc(i.value)) +
                h("p", "note", esc(i.note || "")),
            ),
          )
          .join(""),
      );
    case "Markdown":
      return markdown(node.args[0], node);
    case "Quote":
      return h(
        "blockquote",
        "quote",
        esc(p.text) + (p.source ? h("small", "", esc(p.source)) : ""),
      );
    case "List":
      return h(
        p.ordered ? "ol" : "ul",
        p.ordered ? "steps" : "bits",
        p.items
          .map((i) =>
            h(
              "li",
              "",
              typeof i === "string"
                ? esc(i)
                : h("strong", "", esc(i.title)) +
                    (i.detail ? `：${esc(i.detail)}` : ""),
            ),
          )
          .join(""),
      );
    case "Sources":
      return panel(
        "citation",
        p.title || "REFERENCES / 参考来源",
        h(
          "ol",
          "citation-list",
          p.items
            .map((i) =>
              h(
                "li",
                "",
                div(
                  "cite-body",
                  h("strong", "", esc(i.title)) +
                    span("", i.note || "") +
                    `<a href="${esc(safeUrl(i.url, node))}" target="_blank" rel="noopener noreferrer">${esc(i.title)}</a>`,
                ),
                i.id ? `id="${esc(i.id)}"` : "",
              ),
            )
            .join(""),
        ),
        p.meta,
      );
    case "Code":
      return div(
        "code-block",
        h(
          "pre",
          "",
          h(
            "code",
            "",
            esc(node.args[1]),
            p.language ? `data-language="${esc(p.language)}"` : "",
          ),
        ),
      );
    case "Metrics":
      return p.variant === "tape"
        ? div(
            "stat-tape-wrap",
            div(
              "stat-tape",
              children(node)
                .map((n) => renderMetric(props(n), true))
                .join(""),
            ),
          )
        : div("stat-grid", kids());
    case "Metric":
      return renderMetric(p);
    case "Progress":
      return div(
        "meter-row",
        div("meter-label", esc(p.label || "")) +
          div(
            `meter${p.tone === "warn" || p.tone === "bad" ? " warn" : ""}`,
            `<span style="width:${fmt((p.value / (p.max ?? 100)) * 100)}%"></span>`,
          ) +
          div("meter-note", esc(p.note || `${p.value}/${p.max ?? 100}`)),
      );
    case "Badge":
      return badge(p.text, p.status);
    case "EvidenceLabel":
      return span(
        `label ${p.kind}`,
        p.text ||
          {
            confirmed: "已确认",
            reported: "媒体转述",
            inferred: "技术反推",
            unknown: "未知",
          }[p.kind],
      );
    case "Compare":
      return div(
        "compare-grid",
        p.items
          .map((i) =>
            div(
              `compare-card${i.target ? " target" : ""}`,
              span("compare-tag", i.tag || "") +
                div("compare-title", esc(i.title)) +
                bullet(i.items),
            ),
          )
          .join(""),
      );
    case "Table":
    case "CompareTable":
      return renderTable(p, node, context, node.type === "CompareTable");
    case "Diff": {
      const before = p.before.split("\n"),
        after = p.after.split("\n");
      let prefix = 0,
        suffix = 0;
      while (
        prefix < Math.min(before.length, after.length) &&
        before[prefix] === after[prefix]
      )
        prefix++;
      while (
        suffix < Math.min(before.length, after.length) - prefix &&
        before.at(-suffix - 1) === after.at(-suffix - 1)
      )
        suffix++;
      const line = (text, kind, index) =>
        div(
          `diff-line ${kind}`,
          span("ln", index + 1) +
            span("sign", kind === "add" ? "+" : kind === "del" ? "-" : " ") +
            span("code", text),
        );
      return div(
        "diff-box",
        div(
          "diff-head",
          div("diff-file-title", esc(p.title || p.language || "Diff")) +
            div(
              "diff-stats",
              span("diff-add", `+${after.length - prefix - suffix}`) +
                span("diff-del", `-${before.length - prefix - suffix}`),
            ),
        ) +
          div(
            "diff-body",
            before
              .slice(0, prefix)
              .map((v, i) => line(v, "ctx", i))
              .join("") +
              before
                .slice(prefix, before.length - suffix)
                .map((v, i) => line(v, "del", prefix + i))
                .join("") +
              after
                .slice(prefix, after.length - suffix)
                .map((v, i) => line(v, "add", prefix + i))
                .join("") +
              after
                .slice(after.length - suffix)
                .map((v, i) => line(v, "ctx", after.length - suffix + i))
                .join(""),
          ),
      );
    }
    case "Scorecard": {
      const weight = p.criteria.reduce((s, c) => s + c.weight, 0);
      return p.options
        .map((o) => {
          const total = p.criteria.reduce(
            (s, c, i) => s + o.scores[i] * (c.weight / weight),
            0,
          );
          return div(
            "scorecard-box",
            div(
              "scorecard-head",
              div(
                "",
                div(
                  "scorecard-title",
                  esc(`${p.title || ""} ${o.name}`.trim()),
                ) +
                  div(
                    "scorecard-sub",
                    esc(
                      p.subtitle ||
                        "加权均值 = Σ(原始评分 × 权重) / Σ权重；评分范围 0–10",
                    ),
                  ),
              ) +
                div(
                  "scorecard-total",
                  span("scorecard-total-num", total.toFixed(2)),
                ),
            ) +
              div(
                "scorecard-list",
                p.criteria
                  .map((c, i) =>
                    div(
                      "scorecard-row",
                      div(
                        "scorecard-dim",
                        h(
                          "strong",
                          "",
                          esc(`${c.name} (${fmt((c.weight / weight) * 100)}%)`),
                        ) + span("", c.detail || ""),
                      ) +
                        div(
                          "scorecard-bar-wrap",
                          div(
                            `scorecard-bar${o.scores[i] < 5 ? " warn" : ""}`,
                            `<span style="width:${fmt(o.scores[i] * 10)}%"></span>`,
                          ) + span("scorecard-score", o.scores[i]),
                        ),
                    ),
                  )
                  .join(""),
              ),
          );
        })
        .join("");
    }
    case "Decision":
      return panel(
        "decision",
        p.title || "方案决策",
        div(
          "decision-items",
          p.options
            .map((o) =>
              div(
                "decision-item",
                div(
                  "decision-top",
                  span("decision-name", o) +
                    badge(
                      o === p.choice ? "已选择" : "未选择",
                      o === p.choice ? "done" : "plan",
                    ),
                ),
              ),
            )
            .join(""),
        ) + h("p", "decision-desc", esc(p.rationale)),
      );
    case "Chart":
      return renderChart(p);
    case "Sparkline":
      return spark(p);
    case "Gauge": {
      const ratio = (p.value - (p.min ?? 0)) / ((p.max ?? 100) - (p.min ?? 0)),
        angle = Math.PI * (1 - ratio),
        x = 100 + 60 * Math.cos(angle),
        y = 100 - 60 * Math.sin(angle),
        arc = Math.PI * 80;
      return chartBox(
        p,
        div(
          "gauge-wrap",
          div(
            "gauge-svg-container",
            svg(
              `<path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--rule)" stroke-width="20"/><path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--accent)" stroke-width="20" stroke-dasharray="${fmt(arc * ratio)} ${fmt(arc)}"/>${lineSvg(100, 100, x, y, "var(--ink)")}<circle cx="100" cy="100" r="6" fill="var(--ink)"/>`,
              p.title || p.label,
              200,
              120,
              "gauge-svg",
            ) +
              div(
                "gauge-readout",
                span("gauge-num", `${p.value}${p.unit || ""}`) +
                  span("gauge-label", p.label || ""),
              ),
          ) +
            div(
              "gauge-details",
              (p.details || [])
                .map((i) =>
                  div(
                    "gauge-stat-row",
                    span("", i.label) +
                      h("strong", "", esc(i.value)) +
                      span("", i.note || ""),
                  ),
                )
                .join(""),
            ),
        ),
      );
    }
    case "Heatmap": {
      const max = Math.max(0, ...p.values.flat());
      return chartBox(
        p,
        div(
          "heatmap-wrap",
          div(
            "heatmap-grid",
            p.rows
              .map((r, i) =>
                div(
                  "heatmap-row",
                  span("heatmap-day", r) +
                    div(
                      "heatmap-cells",
                      p.values[i]
                        .map(
                          (v, j) =>
                            `<span class="hm-c l${max ? Math.ceil((v / max) * 5) : 0}" title="${esc(`${r} · ${p.columns[j]}: ${v}`)}"></span>`,
                        )
                        .join(""),
                    ),
                ),
              )
              .join(""),
          ) + div("heatmap-hours", p.columns.map((c) => span("", c)).join("")),
        ),
      );
    }
    case "Quadrant": {
      const quadrants = ["high-high", "high-low", "low-high", "low-low"];
      return panel(
        "matrix",
        p.title,
        div(
          "quadrant-grid",
          quadrants
            .map((q, i) =>
              div(
                `quadrant q-${q}`,
                div("quadrant-label", esc(p.labels?.[i] || q)) +
                  h(
                    "ul",
                    "quadrant-items",
                    p.items
                      .filter(
                        (item) =>
                          (item.y >= 0.5 ? "high" : "low") +
                            "-" +
                            (item.x >= 0.5 ? "high" : "low") ===
                          q,
                      )
                      .map((item) =>
                        h(
                          "li",
                          "",
                          span("", item.title) +
                            (item.status
                              ? badge(item.status, item.status)
                              : ""),
                        ),
                      )
                      .join(""),
                  ),
              ),
            )
            .join(""),
        ),
        p.subtitle,
      );
    }
    case "Roadmap":
      return renderRoadmap(p);
    case "Timeline":
      return p.variant === "incident"
        ? panel(
            "incident-timeline",
            p.title,
            div(
              "inc-timeline",
              p.items
                .map((i) =>
                  div(
                    `inc-time-row ${tones[i.tone] || ""}`.trim(),
                    div("inc-time", esc(i.time)) +
                      div("inc-dot", "") +
                      div(
                        "inc-content",
                        h("strong", "", esc(i.title)) +
                          h("p", "", esc(i.detail || "")),
                      ),
                  ),
                )
                .join(""),
            ),
            p.meta,
          )
        : div(
            "timeline",
            p.items
              .map((i) =>
                div(
                  "timeline-item",
                  div(
                    `timeline-dot${i.status === "done" ? " done" : i.status === "progress" ? " current" : ""}`,
                    "",
                  ) +
                    div(
                      "timeline-header",
                      span("timeline-date", i.time) +
                        span("timeline-title", i.title) +
                        (i.status ? badge(i.status, i.status) : ""),
                    ) +
                    h("p", "timeline-body", esc(i.detail || "")),
                ),
              )
              .join(""),
          );
    case "Flow":
      return div(
        "system-map",
        h("h3", "", esc(p.title || "")) +
          div(
            "flow",
            p.nodes
              .map((n) =>
                div(
                  `node${n.accent ? " accent" : ""}`,
                  h("strong", "", esc(n.title)) + span("", n.detail || ""),
                ),
              )
              .join(""),
          ) +
          div("loop", esc(p.loop || "")) +
          h("p", "map-note", esc(p.note || "")) +
          h(
            "ul",
            "bits",
            p.edges
              .map((e) =>
                h(
                  "li",
                  "",
                  esc(
                    `${p.nodes.find((n) => n.id === e.from).title} → ${p.nodes.find((n) => n.id === e.to).title}${e.label ? ` · ${e.label}` : ""}${e.guard ? ` [${e.guard}]` : ""}${e.return ? " (返回)" : ""}`,
                  ),
                ),
              )
              .join(""),
          ),
      );
    case "Tree": {
      const walk = (items, prefix = "") =>
        items
          .map((i, n) => {
            const last = n === items.length - 1;
            return `${esc(prefix)}${last ? "└── " : "├── "}${esc(i.name)}${i.note ? ` ${span("tree-comment", `# ${i.note}`)}` : ""}\n${i.children ? walk(i.children, prefix + (last ? "    " : "│   ")) : ""}`;
          })
          .join("");
      return panel(
        "file-tree",
        p.title || "目录拓扑",
        h("pre", "file-tree-body", h("code", "", walk(p.items))),
      );
    }
    case "Diagram":
      return renderDiagram(p.source, p.title, p.variant);
    case "People":
      return div(
        "personnel-grid",
        p.items
          .map((i) =>
            div(
              "personnel-card",
              div(
                "personnel-head",
                div("personnel-avatar", esc(Array.from(i.name)[0])) +
                  div(
                    "",
                    div("personnel-name", esc(i.name)) +
                      div("personnel-dept", esc(i.department || "")),
                  ),
              ) +
                div("personnel-role", badge(i.role || "", i.status || "plan")) +
                h("p", "personnel-desc", esc(i.detail || "")),
            ),
          )
          .join(""),
      );
    case "Gallery":
      return div(
        "gallery-wrap",
        div(
          `gallery-grid col-${p.columns ?? 2}`,
          p.items
            .map((i) =>
              h(
                "figure",
                "gallery-item",
                div("gallery-frame", readImage(i, node, context)) +
                  h(
                    "figcaption",
                    "gallery-caption",
                    h("strong", "", esc(i.title || "")) +
                      span("", i.caption || ""),
                  ),
              ),
            )
            .join(""),
        ),
      );
    case "Image":
      return h(
        "figure",
        "gallery-item",
        div("gallery-frame", readImage(p, node, context)) +
          (p.caption ? h("figcaption", "gallery-caption", esc(p.caption)) : ""),
      );
    case "OpenQuestions":
      return p.items.length
        ? h(
            "section",
            "open",
            h("h2", "", esc(p.title || "还没钉住的开放问题")) +
              h(
                "ul",
                "",
                p.items
                  .map((i) =>
                    h(
                      "li",
                      "",
                      typeof i === "string"
                        ? esc(i)
                        : h("strong", "", esc(i.title)) +
                            `：${esc(i.detail || "")}`,
                    ),
                  )
                  .join(""),
              ),
          )
        : "";
    case "Callout":
      return div(
        p.variant === "split-note"
          ? "callout split-note"
          : `callout${p.tone && p.tone !== "neutral" ? ` callout-${tones[p.tone]}` : ""}`,
        (p.title ? div("callout-title", esc(p.title)) : "") + kids(),
      );
    case "Evidence":
      return h(
        "details",
        "details-collapse",
        h("summary", "details-summary", span("details-title", p.title)) +
          div(
            "details-content",
            p.kind === "diagram"
              ? renderDiagram(p.content, p.title)
              : p.kind === "quote"
                ? h("blockquote", "quote", esc(p.content))
                : h("pre", "", h("code", "", esc(p.content))),
          ),
      );
    case "Takeaways":
      return div(
        "takeaways-wrap",
        div(
          "takeaways-grid",
          p.items
            .map((i, n) =>
              div(
                `takeaway-card${i.active ? " active-card" : ""}`,
                div("t-num", String(n + 1).padStart(2, "0")) +
                  div("t-title", esc(i.title)) +
                  h("p", "t-desc", esc(i.detail || "")),
              ),
            )
            .join(""),
        ),
      );
    case "FAQ":
      return panel(
        "faq",
        p.title || "常见问题",
        div(
          "faq-list",
          p.items
            .map((i, n) =>
              h(
                "details",
                "faq-item",
                h(
                  "summary",
                  "faq-q",
                  span("q-badge", `Q${n + 1}`) +
                    h("strong", "", esc(i.question)),
                ) + div("faq-a", h("p", "", esc(i.answer))),
                i.open ? "open" : "",
              ),
            )
            .join(""),
        ),
        p.meta,
      );
    case "Glossary":
      return panel(
        "glossary",
        p.title || "领域术语",
        h(
          "dl",
          "glossary-list",
          p.items
            .map((i) =>
              div(
                "glossary-entry",
                h("dt", "", h("dfn", "", esc(i.term))) +
                  h("dd", "", esc(i.definition)),
              ),
            )
            .join(""),
        ),
      );
    case "Interview":
      return panel(
        "interview",
        p.title || "问答实录",
        div(
          "dialogue-list",
          p.items
            .map((i) =>
              div(
                `dialogue-item ${i.role === "question" ? "q" : "a"}-item`,
                div(
                  `speaker-tag ${i.role === "question" ? "q" : "a"}-tag`,
                  esc(i.speaker),
                ) + div("dialogue-bubble", h("p", "", esc(i.text))),
              ),
            )
            .join(""),
        ),
        p.meta,
      );
    case "Json": {
      const source = JSON.stringify(JSON.parse(stableJson(p.value)), null, 2);
      let cursor = 0,
        code = "";
      const tokenPattern =
        /"(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi;
      for (const match of source.matchAll(tokenPattern)) {
        const token = match[0];
        code += esc(source.slice(cursor, match.index));
        const cls = token.startsWith('"')
          ? /^\s*:/.test(source.slice(match.index + token.length))
            ? "j-key"
            : "j-str"
          : /^(true|false|null)$/.test(token)
            ? "j-bool"
            : "j-num";
        code += span(cls, token);
        cursor = match.index + token.length;
      }
      code += esc(source.slice(cursor));
      return div(
        "json-viewer-box",
        div(
          "json-viewer-head",
          span("json-tag", p.title || "JSON PAYLOAD") +
            span("json-meta", p.meta || "APPLICATION/JSON"),
        ) + h("pre", "json-viewer-body", h("code", "", code)),
      );
    }
    case "Terminal":
      return div(
        "term-window",
        div(
          "term-header",
          div(
            "term-controls",
            '<span class="ctrl close"></span><span class="ctrl min"></span><span class="ctrl max"></span>',
          ) +
            div("term-title", esc(p.title || "Terminal")) +
            div("term-badge", esc(p.shell || "")),
        ) +
          h(
            "pre",
            "term-body",
            h(
              "code",
              "",
              p.lines
                .map((l) =>
                  l.kind === "command"
                    ? `${span("prompt", "$")} ${esc(l.text)}`
                    : span(
                        `term-out${tones[l.kind] ? ` ${tones[l.kind]}` : ""}`,
                        l.text,
                      ),
                )
                .join("\n"),
            ),
          ),
      );
    case "Kanban":
      return panel(
        "kanban",
        p.title || "任务看板",
        div(
          "kanban-columns",
          p.columns
            .map((c) =>
              div(
                "kanban-col",
                div(
                  "kanban-col-head",
                  span(
                    `col-dot${c.status === "todo" ? "" : ` ${c.status}`}`,
                    "",
                  ) +
                    span("", c.title) +
                    span("col-count", c.items.length),
                ) +
                  div(
                    "kanban-cards",
                    c.items
                      .map((i) =>
                        div(
                          "kanban-card",
                          div("k-title", esc(i.title)) +
                            div(
                              "k-meta",
                              span("", i.priority || "") +
                                span("", i.owner || ""),
                            ) +
                            (i.detail ? h("p", "", esc(i.detail)) : "") +
                            (i.status ? badge(i.status, i.status) : ""),
                        ),
                      )
                      .join(""),
                  ),
              ),
            )
            .join(""),
        ),
      );
    case "ProsCons":
      return panel(
        "pros-cons",
        p.title || "利弊权衡",
        div(
          "pros-cons-grid",
          ["pros", "cons"]
            .map((k) =>
              div(
                `${k}-col`,
                div(
                  `${k}-head`,
                  h(
                    "strong",
                    "",
                    k === "pros" ? "主要优势 (Pros)" : "潜在代价 (Cons)",
                  ),
                ) +
                  h(
                    "ul",
                    `${k}-list`,
                    p[k].map((i) => h("li", "", esc(i))).join(""),
                  ),
              ),
            )
            .join(""),
        ),
      );
    case "DecisionLog":
      return panel(
        "decision",
        p.title || "架构决策流水",
        div(
          "decision-items",
          p.items
            .map((i) =>
              div(
                "decision-item",
                div(
                  "decision-top",
                  span("decision-id", i.id) +
                    span("decision-name", i.title) +
                    badge(i.status, i.status),
                ) +
                  h("p", "decision-desc", esc(i.detail || "")) +
                  div(
                    "decision-footer",
                    span("", i.owner || "") +
                      span("", i.date || "") +
                      span("", i.alternative || ""),
                  ),
              ),
            )
            .join(""),
        ),
      );
    case "ReleaseNotes":
      return div(
        "release-box",
        div(
          "release-head",
          div(
            "release-version",
            span("ver-tag", "RELEASE") +
              h("strong", "", esc(p.version)) +
              span("ver-date", p.date),
          ) + (p.status ? badge(p.status, p.status) : ""),
        ) +
          div(
            "release-sections",
            p.sections
              .map((s) =>
                div(
                  "release-sec",
                  div(`sec-title ${s.kind}`, esc(s.title)) + bullet(s.items),
                ),
              )
              .join(""),
          ),
      );
    case "Incident":
      return div(
        "incident-header-box",
        div(
          "incident-top-strip",
          div(
            `incident-level level-${p.level}`,
            esc(`INCIDENT · ${p.level.toUpperCase()}`),
          ) + div("incident-status", p.status ? badge(p.status, p.status) : ""),
        ) +
          div(
            "incident-main-grid",
            div(
              "incident-summary",
              div("incident-title", esc(p.title)) +
                h("p", "incident-cause", esc(p.cause || "")),
            ) +
              div(
                "incident-impact-stats",
                (p.impact || [])
                  .map((i) =>
                    div(
                      "impact-item",
                      span("impact-label", i.label) +
                        h("strong", "impact-val", esc(i.value)) +
                        span("", i.note || ""),
                    ),
                  )
                  .join(""),
              ),
          ),
      );
    case "RootCause":
      return panel(
        "why",
        p.title || "根因连续追问",
        div(
          "why-chain",
          p.items
            .map((i, n) =>
              div(
                `why-node${i.root ? " root-why" : ""}`,
                div(
                  `why-step${i.root ? " root-badge" : ""}`,
                  esc(i.label || (i.root ? "ROOT CAUSE" : `WHY ${n + 1}`)),
                ) +
                  h("p", "", esc(i.question)) +
                  div("why-ans", esc(i.answer)),
              ),
            )
            .join(""),
        ),
      );
    case "Architecture":
      return panel(
        "arch-stack",
        p.title || "系统分层架构",
        div(
          "arch-layers",
          p.layers
            .map(
              (l) =>
                div(
                  `arch-layer${l.highlight ? " highlight-layer" : ""}`,
                  div("layer-badge", esc(l.title)) +
                    div(
                      "layer-nodes",
                      l.nodes
                        .map((n) =>
                          div(
                            `layer-node${n.accent ? " accent" : ""}`,
                            span("", n.title) +
                              h("small", "", esc(n.detail || "")),
                          ),
                        )
                        .join(""),
                    ),
                ) +
                (l.connector ? div("layer-connector", esc(l.connector)) : ""),
            )
            .join(""),
        ),
      );
    case "Sequence":
      return panel(
        "seq",
        p.title || "请求调用时序",
        div("seq-actors", p.actors.map((a) => div("actor", esc(a))).join("")) +
          div(
            "seq-steps",
            p.steps
              .map((s, n) =>
                div(
                  `seq-step from-${s.from} to-${s.to}${s.return ? " return-step" : ""}`,
                  span("seq-num", String(n + 1).padStart(2, "0")) +
                    span("seq-desc", s.text) +
                    span("seq-line", ""),
                ),
              )
              .join(""),
          ),
      );
    case "ServiceMesh":
      return panel(
        "mesh",
        p.title || "服务调用拓扑",
        div(
          "mesh-grid",
          p.columns
            .map((c) =>
              div(
                `mesh-col${c.center ? " center-col" : ""}`,
                div("mesh-col-title", esc(c.title)) +
                  c.items
                    .map((i) =>
                      div(
                        `mesh-card${c.center ? " center-card" : ""}`,
                        c.center
                          ? div("mesh-target-name", esc(i.title)) +
                              div("mesh-target-sub", esc(i.detail || "")) +
                              div(
                                "mesh-pills",
                                (i.pills || [])
                                  .map((v) => span("", v))
                                  .join(""),
                              )
                          : h("strong", "", esc(i.title)) +
                              (i.badge
                                ? badge(i.badge, i.status || "plan")
                                : "") +
                              h("p", "", esc(i.detail || "")),
                      ),
                    )
                    .join(""),
              ),
            )
            .join(""),
        ),
      );
    case "VisualCompare":
      return panel(
        "slider",
        p.title || "改造前后对照",
        div(
          "slider-container",
          ["before", "after"]
            .map((key) => {
              const item = p[key];
              return div(
                `slider-pane ${key}-pane`,
                div(
                  `pane-badge${key === "after" ? " active" : ""}`,
                  esc(key.toUpperCase()),
                ) +
                  div(
                    "pane-content",
                    item.image
                      ? readImage(item.image, node, context)
                      : div(
                          `pane-mockup ${key === "after" ? "editorial" : "legacy"}-mockup`,
                          h("p", "", h("strong", "", esc(item.title))) +
                            h("p", "", esc(item.text || "")),
                        ),
                  ),
              );
            })
            .join(""),
        ),
      );
    case "StateMachine":
      return panel(
        "state",
        p.title || "状态机流转",
        div(
          "state-nodes-flow",
          p.nodes
            .map((n) =>
              div(
                `state-node ${n.state || "initial"}`,
                div("state-badge", esc(n.id)) + div("state-name", esc(n.title)),
              ),
            )
            .join(""),
        ) +
          div(
            "state-rules-table",
            renderTable(
              {
                columns: ["起始状态", "事件", "目标状态", "守卫条件"],
                rows: p.transitions.map((t) => [
                  t.from,
                  t.label || "",
                  t.to,
                  t.guard || "",
                ]),
              },
              node,
              context,
            ),
          ),
      );
    case "Colophon":
      return div(
        "colophon-box",
        div("colophon-rule", "") +
          div(
            "colophon-grid",
            div(
              "colophon-block",
              div("colophon-label", "EDITORIAL / 编审") +
                h("p", "", esc(p.editorial)),
            ) +
              div(
                "colophon-block",
                div("colophon-label", "PUBLICATION / 发行声明") +
                  h("p", "", esc(p.publication)),
              ) +
              div(
                "colophon-block colophon-seal-block",
                div(
                  "colophon-seal",
                  span("", p.seal || "") + h("small", "", esc(p.issuer || "")),
                ),
              ),
          ),
      );
    default:
      fail(node, "XSU_INTERNAL", `Missing renderer for ${node.type}`);
  }
}
function renderDiagram(source, title = "", variant = "default") {
  const prefix = variant === "gantt" ? "gantt" : "pele";
  return panel(
    prefix,
    title || "DIAGRAM",
    div(
      `pele-view${variant === "gantt" ? " gantt-view" : ""}`,
      h("pre", "pele", esc(source)),
    ) +
      h(
        "details",
        "pele-source",
        h("summary", "", "查看图表源码") +
          h("pre", "", h("code", "", esc(source))),
      ),
  );
}
function coverMarkup(root, node, context) {
  const p = node ? props(node) : {},
    report = props(root),
    variant = p.variant || "default",
    topTakeaway = children(root)
      .filter((item) => item.type === "Takeaway")
      .map((item) => renderNode(item, context))
      .join(""),
    extra =
      (node
        ? children(node)
            .map((item) => renderNode(item, context))
            .join("")
        : "") + topTakeaway;
  const headline =
    h("p", "kicker", esc(p.kicker || "")) +
    h("h1", "", span("title-copy", report.title)) +
    h("p", "lede", esc(p.lead || report.subtitle || ""));
  if (variant === "banner")
    return h(
      "header",
      "hero hero-banner",
      div(
        "hero-banner-main",
        div(
          "hero-tags",
          node
            ? children(node)
                .filter((n) => ["Badge", "EvidenceLabel"].includes(n.type))
                .map((n) => renderNode(n, context))
                .join("")
            : "",
        ) +
          headline +
          topTakeaway,
      ) +
        div(
          "hero-banner-figure",
          div(
            "hero-figure-box",
            node
              ? children(node)
                  .filter((n) => !["Badge", "EvidenceLabel"].includes(n.type))
                  .map((n) => renderNode(n, context))
                  .join("")
              : "",
          ),
        ),
    );
  if (variant === "metric") {
    const m = p.metric;
    return h(
      "header",
      "hero hero-metric",
      div("hero-metric-content", headline) +
        h(
          "aside",
          "hero-metric-focal",
          div("focal-kicker", "KEY METRIC") +
            div("focal-num", esc(`${m.value ?? ""}${m.unit || ""}`)) +
            div("focal-label", esc(m.label)) +
            div(
              `focal-delta delta-${m.tone === "good" ? "up" : m.tone === "warn" || m.tone === "bad" ? "warn" : "neutral"}`,
              esc(m.delta || ""),
            ),
        ) +
        extra,
    );
  }
  if (variant === "minimal")
    return h(
      "header",
      "hero hero-minimal",
      div(
        "minimal-masthead",
        div("minimal-rule-top", "") +
          div(
            "minimal-meta-strip",
            span("minimal-pub", p.publication || "") +
              span("minimal-doc-id", p.documentId || "") +
              span("minimal-date", report.date),
          ) +
          div("minimal-rule-bottom", ""),
      ) +
        div(
          "minimal-title-wrap",
          headline +
            div(
              "minimal-authors",
              span("", p.author || report.author || "") +
                span("", p.reviewer || "") +
                (p.status ? badge(p.status, p.status) : ""),
            ) +
            extra,
        ),
    );
  if (variant === "split-lead")
    return h(
      "header",
      "hero hero-split-lead",
      div(
        "split-lead-left",
        h("p", "kicker", esc(p.kicker || "")) +
          h("h1", "", span("title-copy", report.title)) +
          div(
            "split-lead-byline",
            span("", p.author || report.author || "") +
              span("", p.readingTime || ""),
          ),
      ) +
        div(
          "split-lead-right",
          div(
            "split-lead-box",
            div("split-lead-tag", "EXECUTIVE SUMMARY") +
              h("p", "split-lead-text", esc(p.lead || report.subtitle || "")) +
              div("split-lead-footer", extra),
          ),
        ),
    );
  return h("header", "hero", headline + extra);
}
export function renderEditorial(root, context = {}) {
  const ctx = {
    network: "offline",
    warnings: [],
    imageCache: new Map(),
    ...context,
  };
  validateEditorial(root, ctx);
  const p = props(root),
    nodes = children(root),
    cover = nodes.find((n) => n.type === "Cover"),
    cp = cover ? props(cover) : {};
  const one = (type) =>
    nodes
      .filter((n) => n.type === type)
      .map((n) => renderNode(n, ctx))
      .join("");
  const slots = {
    brand: esc(p.brand || "REPORT"),
    meta: esc([p.date, p.author].filter(Boolean).join(" · ")),
    kicker: esc(cp.kicker || ""),
    title: esc(p.title),
    lede: esc(cp.lead || p.subtitle || ""),
    verdict:
      (cover
        ? children(cover)
            .map((n) => renderNode(n, ctx))
            .join("")
        : "") + one("Takeaway"),
    glance: one("Glance"),
    sections: nodes
      .filter(
        (n) =>
          ![
            "Cover",
            "Takeaway",
            "Glance",
            "OpenQuestions",
            "Colophon",
          ].includes(n.type),
      )
      .map((n) => renderNode(n, ctx))
      .join(""),
    open: one("OpenQuestions"),
    footer: one("Colophon") || esc(p.footer || ""),
  };
  // A complete fixed cover is supplied separately so the assembler can replace the hero wrapper,
  // not inject a second <header> into an existing paragraph/title slot.
  return { title: p.title, slots, cover: coverMarkup(root, cover, ctx) };
}
