import { fail, isNode, checkDiagram } from "./contracts.mjs";

const text = { type: "string", minLength: 1 };
const optionalText = { type: "string" };
const list = (items, minItems = 0) => ({ type: "array", items, minItems });
const choice = (...values) => ({ enum: values });
const object = (properties, optional = []) => ({
  type: "object",
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  additionalProperties: false,
});
const actor = object({ name: text, role: text, detail: text });
const action = object({
  type: choice("discovery", "action", "fix", "sync"),
  label: text,
  detail: text,
});
const question = object({
  question: text,
  shortAnswer: text,
  deepExplanation: text,
});
const completed = object({ item: text, ref: text, note: text });
const pending = object({ task: text, owner: text, when: text });
const glossary = object({ term: text, plain: text });
const impact = object({
  label: text,
  value: { type: ["string", "number"], minLength: 1 },
  note: text,
});
const timeline = object({ time: text, event: text, stepRef: text });
const decision = object({
  title: text,
  context: text,
  options: list(text, 2),
  choice: text,
  rationale: text,
});
const publication = object({
  kicker: text,
  headline: text,
  dek: text,
  authors: list(text, 1),
  readingTime: text,
  tldr: list(text, 1),
  impact: list(impact),
  timeline: list(timeline),
  decisions: list(decision, 1),
  lessons: list(text),
  redactionNote: text,
  audience: text,
  authorsConfirmed: choice(true),
});
const rootSchema = object(
  {
    xsuVersion: choice(1),
    id: text,
    preset: choice("replay-self", "replay-public"),
    title: text,
    date: text,
    theme: choice("system", "light", "dark"),
    subtitle: optionalText,
    repo: optionalText,
    branch: optionalText,
    sessionName: optionalText,
    status: optionalText,
    totalRawTurns: text,
  },
  [
    "theme",
    "subtitle",
    "repo",
    "branch",
    "sessionName",
    "status",
    "totalRawTurns",
  ],
);
const stepSchema = object({
  id: text,
  title: text,
  phase: text,
  summary: text,
  status: choice("completed", "decision", "blocked"),
});
const rootChildren = [
  "Context",
  "Actors",
  "ReplayStep",
  "EndState",
  "Glossary",
  "Questions",
  "Publication",
];
const stepChildren = [
  "LookAt",
  "Why",
  "Actions",
  "Insight",
  "Handoff",
  "Evidence",
];
const definition = (
  name,
  propsSchema,
  allowedParents,
  allowedChildren = [],
  presets = ["replay-self", "replay-public"],
) => ({
  name,
  signatures:
    name === "Why"
      ? ["Why(text)"]
      : allowedChildren.length
        ? [`${name}(props, children)`]
        : [`${name}(props)`],
  propsSchema,
  allowedParents,
  allowedChildren,
  presets,
  features: name === "Evidence" ? ["diagram-requires-connected"] : [],
});

// Data-only catalog: the CLI and bundled skill references use this same contract.
export const REPLAY_COMPONENTS = {
  Replay: definition("Replay", rootSchema, [], rootChildren),
  Context: definition(
    "Context",
    object({ originGoal: text, whyConfusing: text, readingGuide: text }),
    ["Replay"],
  ),
  Actors: definition("Actors", object({ items: list(actor, 1) }), ["Replay"]),
  ReplayStep: definition("ReplayStep", stepSchema, ["Replay"], stepChildren),
  LookAt: definition("LookAt", object({ target: text, anchors: list(text) }), [
    "ReplayStep",
  ]),
  Why: definition("Why", text, ["ReplayStep"]),
  Actions: definition("Actions", object({ items: list(action, 1) }), [
    "ReplayStep",
  ]),
  Insight: definition("Insight", object({ myth: text, reality: text }), [
    "ReplayStep",
  ]),
  Handoff: definition("Handoff", object({ next: text, hook: text }), [
    "ReplayStep",
  ]),
  Evidence: definition(
    "Evidence",
    object({
      kind: choice("code", "command", "quote", "table", "diagram"),
      title: text,
      content: text,
    }),
    ["ReplayStep"],
  ),
  EndState: definition(
    "EndState",
    object({ completedItems: list(completed), pendingHandoffs: list(pending) }),
    ["Replay"],
  ),
  Glossary: definition(
    "Glossary",
    object({ items: list(glossary) }),
    ["Replay"],
    [],
    ["replay-self"],
  ),
  Questions: definition("Questions", object({ items: list(question) }), [
    "Replay",
  ]),
  Publication: definition(
    "Publication",
    publication,
    ["Replay"],
    [],
    ["replay-public"],
  ),
};

function check(value, schema, node, path) {
  if (schema.enum) {
    if (!schema.enum.includes(value))
      fail(node, "XSU_PROP", `${path} must be ${schema.enum.join(" | ")}`);
    return;
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actual = Array.isArray(value)
    ? "array"
    : value === null
      ? "null"
      : typeof value;
  if (!types.includes(actual) || isNode(value))
    fail(node, "XSU_PROP", `${path} must be ${types.join(" | ")}`);
  if (actual === "string" && schema.minLength && !value.trim())
    fail(node, "XSU_REQUIRED", `${path} must not be empty`);
  if (actual === "number" && !Number.isFinite(value))
    fail(node, "XSU_PROP", `${path} must be finite`);
  if (actual === "array") {
    if (value.length < schema.minItems)
      fail(
        node,
        "XSU_REQUIRED",
        `${path} requires at least ${schema.minItems} items`,
      );
    value.forEach((item, index) =>
      check(item, schema.items, node, `${path}[${index}]`),
    );
  }
  if (actual === "object") {
    if (![null, Object.prototype].includes(Object.getPrototypeOf(value)))
      fail(node, "XSU_PROP", `${path} must be a plain object`);
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties, key))
        fail(node, "XSU_PROP", `Unknown ${path} property: ${key}`);
      check(value[key], schema.properties[key], node, `${path}.${key}`);
    }
    for (const key of schema.required) {
      if (!Object.hasOwn(value, key))
        fail(node, "XSU_REQUIRED", `${path}.${key} is required`);
    }
  }
}

function checkId(id, node) {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(id))
    fail(node, "XSU_ID", "Replay IDs must start with a letter and contain at most 64 letters, digits, _ or -");
}
const ofType = (node, type) =>
  node.args[1].filter((child) => child.type === type);
const one = (node, type) => ofType(node, type)[0];
const p = (node) => node.args[0];

function warn(context, node, code, message) {
  context.warnings ??= [];
  if (
    !context.warnings.some(
      (item) =>
        item.code === code &&
        item.message === message &&
        item.file === node.loc?.file &&
        item.line === node.loc?.line,
    )
  ) {
    context.warnings.push({ code, severity: "warning", message, ...node.loc });
  }
}

export function validateReplay(
  root,
  context = { network: "offline", warnings: [] },
) {
  if (!isNode(root) || root.type !== "Replay")
    fail(root, "XSU_ROOT", "Replay preset requires a Replay root");
  const preset = root.args[0]?.preset;
  function visit(node, parent) {
    const contract =
      Object.hasOwn(REPLAY_COMPONENTS, node.type) &&
      REPLAY_COMPONENTS[node.type];
    if (!contract)
      fail(node, "XSU_COMPONENT", `Unsupported Replay component: ${node.type}`);
    if (parent && !contract.allowedParents.includes(parent.type))
      fail(node, "XSU_PARENT", `${node.type} is not allowed in ${parent.type}`);
    if (!contract.presets.includes(preset))
      fail(node, "XSU_PRESET", `${node.type} is not supported by ${preset}`);
    const hasChildren = contract.allowedChildren.length > 0;
    if (node.args.length !== (hasChildren ? 2 : 1))
      fail(node, "XSU_SIGNATURE", `${node.type} has an invalid argument count`);
    check(p(node), contract.propsSchema, node, node.type);
    if (hasChildren) {
      if (
        !Array.isArray(node.args[1]) ||
        node.args[1].some((child) => !isNode(child))
      )
        fail(node, "XSU_SIGNATURE", `${node.type} requires component children`);
      node.args[1].forEach((child) => visit(child, node));
    }
    if (node.type === "Evidence" && p(node).kind === "diagram")
      checkDiagram(p(node).content, node, context);
  }
  visit(root, null);
  checkId(p(root).id, root);
  const date = p(root).date;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    fail(root, "XSU_DATE", "Replay.date must be a real YYYY-MM-DD date");
  for (const type of [
    "Context",
    "Actors",
    "EndState",
    "Questions",
    preset === "replay-self" ? "Glossary" : "Publication",
  ]) {
    if (ofType(root, type).length !== 1)
      fail(root, "XSU_CARDINALITY", `Replay requires exactly one ${type}`);
  }
  const steps = ofType(root, "ReplayStep");
  if (!steps.length)
    fail(root, "XSU_REQUIRED", "Replay requires at least one ReplayStep");
  const ids = new Set(["start", "end", p(root).id]);
  steps.forEach((step) => {
    checkId(p(step).id, step);
    if (ids.has(p(step).id))
      fail(step, "XSU_ID", `Duplicate or reserved Replay ID: ${p(step).id}`);
    ids.add(p(step).id);
  });
  steps.forEach((step, index) => {
    for (const type of stepChildren.filter((type) => type !== "Evidence")) {
      if (ofType(step, type).length !== 1)
        fail(
          step,
          "XSU_CARDINALITY",
          `ReplayStep requires exactly one ${type}`,
        );
    }
    const expected = steps[index + 1] ? p(steps[index + 1]).id : "end";
    if (p(one(step, "Handoff")).next !== expected)
      fail(
        one(step, "Handoff"),
        "XSU_HANDOFF",
        `Handoff.next must be ${expected}`,
      );
  });
  if (steps.length < 5 || steps.length > 9)
    warn(
      context,
      root,
      "XSU_REPLAY_STEP_COUNT",
      "Replay usually benefits from 5–9 factual steps; do not invent facts to reach this count.",
    );
  if (preset === "replay-self") {
    const items = p(one(root, "Glossary")).items;
    const terms = new Set();
    items.forEach((item) => {
      if (terms.has(item.term))
        fail(
          one(root, "Glossary"),
          "XSU_GLOSSARY",
          `Duplicate glossary term: ${item.term}`,
        );
      terms.add(item.term);
    });
    if (items.length < 6 || items.length > 12)
      warn(
        context,
        one(root, "Glossary"),
        "XSU_GLOSSARY_COUNT",
        "Self glossary usually has 6–12 terms relevant to this reader.",
      );
  } else {
    const node = one(root, "Publication");
    const pub = p(node);
    pub.timeline.forEach((item) => {
      if (!steps.some((step) => p(step).id === item.stepRef))
        fail(
          node,
          "XSU_REFERENCE",
          `Unknown timeline.stepRef: ${item.stepRef}`,
        );
    });
    pub.decisions.forEach((item) => {
      if (new Set(item.options).size !== item.options.length)
        fail(node, "XSU_DECISION", "Decision options must be distinct");
      if (!item.options.includes(item.choice))
        fail(
          node,
          "XSU_DECISION",
          "Decision choice must exactly match an option",
        );
    });
    // This only catches explicit patterns; the required review record is not proof of redaction.
    const contents = JSON.stringify(lowerUnchecked(root));
    if (
      /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_]{16,}|\bAKIA[A-Z0-9]{16}\b/.test(
        contents,
      )
    )
      fail(
        node,
        "XSU_PUBLIC_SECRET",
        "Public replay contains a recognizable credential pattern",
      );
    if (
      /\b(?:localhost|127\.0\.0\.1|[a-z0-9-]+\.internal|[a-z0-9-]+\.local)\b|你拍板|我懵了/.test(
        contents,
      )
    )
      warn(
        context,
        node,
        "XSU_PUBLIC_REVIEW",
        "Public replay may contain internal addresses or Self wording; manually review the entire output.",
      );
  }
  return root;
}

function lowerUnchecked(root) {
  const source = p(root);
  const meta = { title: source.title, date: source.date };
  for (const key of [
    "subtitle",
    "repo",
    "branch",
    "sessionName",
    "status",
    "totalRawTurns",
  ])
    if (Object.hasOwn(source, key)) meta[key] = source[key];
  const steps = ofType(root, "ReplayStep");
  meta.distilledSteps = steps.length;
  const data = {
    meta,
    background: p(one(root, "Context")),
    actorsAndRepos: p(one(root, "Actors")).items,
    steps: steps.map((step, index) => ({
      id: index + 1,
      anchor: p(step).id,
      phase: p(step).phase,
      title: p(step).title,
      summary: p(step).summary,
      status: p(step).status,
      lookAt: p(one(step, "LookAt")),
      whyLookHere: p(one(step, "Why")),
      whatWasDone: p(one(step, "Actions")).items,
      confusionBuster: p(one(step, "Insight")),
      leadsToNext: {
        hook: p(one(step, "Handoff")).hook,
        nextTarget: steps[index + 1]
          ? p(one(steps[index + 1], "LookAt")).target
          : "终点",
      },
      evidence: ofType(step, "Evidence").map(p),
    })),
    confusionMatrix: p(one(root, "Questions")).items,
    endState: p(one(root, "EndState")),
  };
  if (source.preset === "replay-self")
    data.glossary = p(one(root, "Glossary")).items;
  else {
    const { audience, authorsConfirmed, ...pub } = p(one(root, "Publication"));
    data.publication = {
      ...pub,
      timeline: pub.timeline.map((item) => ({
        ...item,
        stepRef: steps.findIndex((step) => p(step).id === item.stepRef) + 1,
      })),
    };
  }
  return data;
}

export function lowerReplay(
  root,
  context = { network: "offline", warnings: [] },
) {
  validateReplay(root, context);
  // Detach the output from the AST; no source locations or author-only checks enter HTML.
  return JSON.parse(JSON.stringify(lowerUnchecked(root)));
}

function jsonData(value, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (
    !value ||
    typeof value !== "object" ||
    seen.has(value) ||
    (!Array.isArray(value) &&
      ![null, Object.prototype].includes(Object.getPrototypeOf(value)))
  )
    fail(
      null,
      "XSU_MIGRATION",
      "Migration accepts only finite, acyclic JSON data, not HTML or executable values",
    );
  if (Array.isArray(value)) {
    if (Object.keys(value).length !== value.length || !Array.from({ length: value.length }, (_, index) => Object.hasOwn(value, index)).every(Boolean))
      fail(null, "XSU_MIGRATION", "Migration rejects sparse arrays and extra array properties");
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length") continue;
    if (
      typeof key !== "string" ||
      ["__proto__", "constructor", "prototype"].includes(key) ||
      !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value")
    )
      fail(
        null,
        "XSU_MIGRATION",
        "Migration rejects dangerous keys and accessors",
      );
    jsonData(value[key], seen);
  }
  seen.delete(value);
}
const call = (type, ...args) => ({ type, args });
function printCall(node) {
  return `${node.type}(${node.args.map((arg) => (Array.isArray(arg) && arg.every(isNode) ? `[\n${arg.map(printCall).join(",\n")}\n]` : JSON.stringify(arg, null, 2))).join(", ")})`;
}

export function migrateReplay(data, preset = "replay-self") {
  jsonData(data);
  const node = call("Replay", {});
  const legacyStep = object(
    {
      id: { type: "number" },
      anchor: text,
      ...stepSchema.properties,
      lookAt: REPLAY_COMPONENTS.LookAt.propsSchema,
      whyLookHere: text,
      whatWasDone: list(action, 1),
      confusionBuster: REPLAY_COMPONENTS.Insight.propsSchema,
      leadsToNext: object({ hook: text, nextTarget: text }),
      evidence: list(REPLAY_COMPONENTS.Evidence.propsSchema),
    },
    ["anchor"],
  );
  legacyStep.properties.id = { type: "number" };
  const legacyMeta = object(
    {
      title: text,
      date: text,
      subtitle: optionalText,
      repo: optionalText,
      branch: optionalText,
      sessionName: optionalText,
      status: optionalText,
      totalRawTurns: text,
      distilledSteps: { type: "number" },
    },
    [
      "subtitle",
      "repo",
      "branch",
      "sessionName",
      "status",
      "totalRawTurns",
      "distilledSteps",
    ],
  );
  const legacyPublication = object({
    ...publication.properties,
    audience: optionalText,
    authorsConfirmed: { type: "boolean" },
    timeline: list(object({ time: text, event: text, stepRef: { type: "number" } })),
  }, ["audience", "authorsConfirmed"]);
  check(
    data,
    object(
      {
        meta: legacyMeta,
        background: REPLAY_COMPONENTS.Context.propsSchema,
        actorsAndRepos: list(actor, 1),
        steps: list(legacyStep, 1),
        confusionMatrix: list(question),
        endState: REPLAY_COMPONENTS.EndState.propsSchema,
        glossary: list(glossary),
        publication: legacyPublication,
      },
      preset === "replay-self" ? ["publication"] : ["glossary"],
    ),
    node,
    "legacy",
  );
  if (!["replay-self", "replay-public"].includes(preset))
    fail(node, "XSU_PRESET", "Unknown migration preset");
  if (
    (preset === "replay-self" && data.publication) ||
    (preset === "replay-public" && data.glossary)
  )
    fail(
      node,
      "XSU_MIGRATION",
      "Migration cannot silently discard a different audience's content",
    );
  if (
    data.meta.distilledSteps !== undefined &&
    data.meta.distilledSteps !== data.steps.length
  )
    fail(
      node,
      "XSU_MIGRATION",
      "meta.distilledSteps must match the actual step count",
    );
  const stableIds = data.steps.map((step, index) => {
    if (step.id !== index + 1)
      fail(
        node,
        "XSU_MIGRATION",
        "Legacy step IDs must be contiguous numbers starting at 1 to preserve old hashes",
      );
    const expected = data.steps[index + 1]?.lookAt.target ?? "终点";
    if (step.leadsToNext.nextTarget !== expected)
      fail(node, "XSU_HANDOFF", `Legacy nextTarget must match ${expected}`);
    return step.anchor ?? `step-${step.id}`;
  });
  const { distilledSteps, ...meta } = data.meta;
  const nodes = [
    call("Context", data.background),
    call("Actors", { items: data.actorsAndRepos }),
  ];
  data.steps.forEach((step, index) =>
    nodes.push(
      call(
        "ReplayStep",
        {
          id: stableIds[index],
          phase: step.phase,
          title: step.title,
          summary: step.summary,
          status: step.status,
        },
        [
          call("LookAt", step.lookAt),
          call("Why", step.whyLookHere),
          call("Actions", { items: step.whatWasDone }),
          call("Insight", step.confusionBuster),
          call("Handoff", {
            next: stableIds[index + 1] ?? "end",
            hook: step.leadsToNext.hook,
          }),
          ...step.evidence.map((item) => call("Evidence", item)),
        ],
      ),
    ),
  );
  nodes.push(
    call("EndState", data.endState),
    call("Questions", { items: data.confusionMatrix }),
  );
  if (preset === "replay-self")
    nodes.push(call("Glossary", { items: data.glossary }));
  else
    nodes.push(
      call("Publication", {
        ...data.publication,
        timeline: data.publication.timeline.map((item) => {
          const stepRef = stableIds[item.stepRef - 1];
          if (!stepRef)
            fail(
              node,
              "XSU_REFERENCE",
              `Unknown legacy timeline.stepRef: ${item.stepRef}`,
            );
          return { ...item, stepRef };
        }),
      }),
    );
  const root = call(
    "Replay",
    { xsuVersion: 1, id: "migrated-replay", preset, ...meta },
    nodes,
  );
  if (preset === "replay-public") {
    const pub = p(one(root, "Publication"));
    pub.audience ??= "";
    pub.authorsConfirmed ??= false;
    // Old published JSON deliberately has no review fields. Preserve that absence as
    // an unconfirmed authoring source, never manufacture publication authorization.
    const reviewCopy = JSON.parse(JSON.stringify(root));
    const review = p(one(reviewCopy, "Publication"));
    review.audience ||= "Migration shape validation only";
    review.authorsConfirmed = true;
    validateReplay(reviewCopy, { network: "connected", warnings: [] });
  } else validateReplay(root, { network: "connected", warnings: [] });
  return `// Migrated from explicit JSON. Review facts and publication authorization before rendering.\n// Public: fill audience and explicitly confirm authors; missing legacy checks remain unconfirmed.\n${printCall(root)}\n`;
}
