import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseXsu } from "../parser.mjs";
import {
  REPLAY_COMPONENTS,
  validateReplay,
  lowerReplay,
  migrateReplay,
} from "../replay.mjs";
import { scriptJson } from "../contracts.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const fixture = (preset = "self") =>
  parseXsu(
    fs.readFileSync(
      path.join(root, `scripts/xsu/fixtures/replay-${preset}.xsu`),
      "utf8",
    ),
    `replay-${preset}.xsu`,
  );
const nodes = (tree, type) => tree.args[1].filter((node) => node.type === type);
const one = (tree, type) => nodes(tree, type)[0];
const props = (node) => node.args[0];
const ctx = (network = "offline") => ({ network, warnings: [] });
function rejectMutation(label, mutate, code, preset = "self") {
  test(label, () => {
    const tree = fixture(preset);
    mutate(tree);
    assert.throws(
      () => validateReplay(tree, ctx()),
      (error) => {
        assert.ok(
          error.diagnostic,
          `Expected a located XSU diagnostic, got ${error.stack}`,
        );
        assert.equal(error.diagnostic.code, code);
        assert.match(error.diagnostic.file, /^replay-(self|public)\.xsu$/);
        assert.ok(error.diagnostic.line > 0 && error.diagnostic.column > 0);
        return true;
      },
    );
  });
}

test("Replay catalog is serializable and explicitly restricts presets and parents", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(REPLAY_COMPONENTS)),
    REPLAY_COMPONENTS,
  );
  assert.deepEqual(REPLAY_COMPONENTS.Glossary.presets, ["replay-self"]);
  assert.deepEqual(REPLAY_COMPONENTS.Evidence.allowedParents, ["ReplayStep"]);
  assert.ok(!REPLAY_COMPONENTS.Replay.allowedChildren.includes("Section"));
});
for (const preset of ["self", "public"]) {
  test(`${preset} fixture lowers deterministically without AST mutation`, () => {
    const tree = fixture(preset);
    const before = JSON.stringify(tree);
    const context = ctx();
    validateReplay(tree, context);
    const model = lowerReplay(tree, context);
    assert.equal(JSON.stringify(tree), before);
    assert.deepEqual(lowerReplay(tree, ctx()), model);
    assert.equal(model.meta.distilledSteps, 2);
    assert.deepEqual(
      model.steps.map((step) => step.id),
      [1, 2],
    );
    assert.equal(model.steps[0].anchor, "inspect-config");
    assert.equal(
      model.steps[0].leadsToNext.nextTarget,
      model.steps[1].lookAt.target,
    );
    assert.equal(model.steps[1].leadsToNext.nextTarget, "终点");
    assert.deepEqual(
      model.confusionMatrix,
      JSON.parse(JSON.stringify(props(one(tree, "Questions")).items)),
    );
    assert.ok(!JSON.stringify(model).includes('"loc"'));
    assert.equal(
      context.warnings.filter(
        (warning) => warning.code === "XSU_REPLAY_STEP_COUNT",
      ).length,
      1,
    );
    if (preset === "public") {
      assert.deepEqual(
        model.publication.timeline.map((item) => item.stepRef),
        [1, 2],
      );
      assert.ok(!Object.hasOwn(model, "glossary"));
      assert.ok(!Object.hasOwn(model.publication, "authorsConfirmed"));
      assert.ok(!Object.hasOwn(model.publication, "audience"));
      assert.equal(
        model.publication.redactionNote,
        props(one(tree, "Publication")).redactionNote,
      );
    }
  });
}

for (const type of ["Context", "Actors", "EndState", "Questions", "Glossary"]) {
  rejectMutation(
    `missing ${type} is rejected`,
    (tree) =>
      tree.args[1].splice(
        tree.args[1].findIndex((node) => node.type === type),
        1,
      ),
    "XSU_CARDINALITY",
  );
  rejectMutation(
    `duplicate ${type} is rejected`,
    (tree) => tree.args[1].push(structuredClone(one(tree, type))),
    "XSU_CARDINALITY",
  );
}
for (const type of ["LookAt", "Why", "Actions", "Insight", "Handoff"]) {
  rejectMutation(
    `missing step ${type} is rejected`,
    (tree) => {
      const step = one(tree, "ReplayStep");
      step.args[1].splice(
        step.args[1].findIndex((node) => node.type === type),
        1,
      );
    },
    "XSU_CARDINALITY",
  );
  rejectMutation(
    `duplicate step ${type} is rejected`,
    (tree) => {
      const step = one(tree, "ReplayStep");
      step.args[1].push(structuredClone(one(step, type)));
    },
    "XSU_CARDINALITY",
  );
}
rejectMutation(
  "generic components cannot enter Replay",
  (tree) =>
    tree.args[1].push({
      type: "Section",
      args: [{ title: "No" }, []],
      loc: tree.loc,
    }),
  "XSU_COMPONENT",
);
rejectMutation(
  "domain components cannot enter wrong parent",
  (tree) => tree.args[1].push(one(one(tree, "ReplayStep"), "LookAt")),
  "XSU_PARENT",
);
rejectMutation(
  "a text node cannot hide in props",
  (tree) =>
    (props(one(tree, "Context")).originGoal = one(
      one(tree, "ReplayStep"),
      "Why",
    )),
  "XSU_PROP",
);
rejectMutation(
  "leaf arguments are exact",
  (tree) => one(tree, "Context").args.push([]),
  "XSU_SIGNATURE",
);
rejectMutation(
  "children must be component nodes",
  (tree) => tree.args[1].push("text"),
  "XSU_SIGNATURE",
);
rejectMutation(
  "zero steps is rejected",
  (tree) =>
    (tree.args[1] = tree.args[1].filter((node) => node.type !== "ReplayStep")),
  "XSU_REQUIRED",
);
rejectMutation(
  "step status is a domain enum",
  (tree) => (props(one(tree, "ReplayStep")).status = "good"),
  "XSU_PROP",
);
rejectMutation(
  "action type is a domain enum",
  (tree) =>
    (props(one(one(tree, "ReplayStep"), "Actions")).items[0].type = "decision"),
  "XSU_PROP",
);
rejectMutation(
  "action arrays cannot be empty",
  (tree) => (props(one(one(tree, "ReplayStep"), "Actions")).items = []),
  "XSU_REQUIRED",
);
rejectMutation(
  "Why requires nonempty text",
  (tree) => (one(one(tree, "ReplayStep"), "Why").args[0] = "  "),
  "XSU_REQUIRED",
);
rejectMutation(
  "LookAt target requires nonempty text",
  (tree) => (props(one(one(tree, "ReplayStep"), "LookAt")).target = "  "),
  "XSU_REQUIRED",
);
rejectMutation(
  "nonterminal Handoff cannot skip ahead",
  (tree) => (props(one(one(tree, "ReplayStep"), "Handoff")).next = "end"),
  "XSU_HANDOFF",
);
rejectMutation(
  "terminal Handoff must be end",
  (tree) =>
    (props(one(nodes(tree, "ReplayStep")[1], "Handoff")).next =
      "inspect-config"),
  "XSU_HANDOFF",
);
rejectMutation(
  "end is reserved",
  (tree) => (props(one(tree, "ReplayStep")).id = "end"),
  "XSU_ID",
);
rejectMutation(
  "duplicate stable IDs are rejected",
  (tree) => (props(nodes(tree, "ReplayStep")[1]).id = "inspect-config"),
  "XSU_ID",
);
rejectMutation(
  "IDs cannot inject a hash",
  (tree) => (props(one(tree, "ReplayStep")).id = "x#y"),
  "XSU_ID",
);
rejectMutation(
  "wrong root version is rejected",
  (tree) => (props(tree).xsuVersion = 2),
  "XSU_PROP",
);
rejectMutation(
  "invalid calendar date is rejected",
  (tree) => (props(tree).date = "2026-02-30"),
  "XSU_DATE",
);
rejectMutation(
  "theme is controlled",
  (tree) => (props(tree).theme = "pink"),
  "XSU_PROP",
);
rejectMutation(
  "self rejects publication",
  (tree) => tree.args[1].push(one(fixture("public"), "Publication")),
  "XSU_PRESET",
);
rejectMutation(
  "public rejects glossary",
  (tree) => tree.args[1].push(one(fixture(), "Glossary")),
  "XSU_PRESET",
  "public",
);
rejectMutation(
  "public requires Publication",
  (tree) =>
    (tree.args[1] = tree.args[1].filter((node) => node.type !== "Publication")),
  "XSU_CARDINALITY",
  "public",
);
rejectMutation(
  "publication timeline references stable IDs",
  (tree) => (props(one(tree, "Publication")).timeline[0].stepRef = "missing"),
  "XSU_REFERENCE",
  "public",
);
rejectMutation(
  "publication timeline cannot use old numeric refs",
  (tree) => (props(one(tree, "Publication")).timeline[0].stepRef = 1),
  "XSU_PROP",
  "public",
);
rejectMutation(
  "publication decisions must have two options",
  (tree) => (props(one(tree, "Publication")).decisions[0].options = ["only"]),
  "XSU_REQUIRED",
  "public",
);
rejectMutation(
  "publication choice must exactly match",
  (tree) => (props(one(tree, "Publication")).decisions[0].choice += " "),
  "XSU_DECISION",
  "public",
);
rejectMutation(
  "publication decisions cannot duplicate options",
  (tree) =>
    (props(one(tree, "Publication")).decisions[0].options = ["same", "same"]),
  "XSU_DECISION",
  "public",
);
rejectMutation(
  "publication TLDR cannot be empty",
  (tree) => (props(one(tree, "Publication")).tldr = []),
  "XSU_REQUIRED",
  "public",
);
rejectMutation(
  "publication needs nonempty audience",
  (tree) => (props(one(tree, "Publication")).audience = " "),
  "XSU_REQUIRED",
  "public",
);
rejectMutation(
  "publication needs explicit authors confirmation",
  (tree) => (props(one(tree, "Publication")).authorsConfirmed = false),
  "XSU_PROP",
  "public",
);
rejectMutation(
  "publication needs redaction record",
  (tree) => delete props(one(tree, "Publication")).redactionNote,
  "XSU_REQUIRED",
  "public",
);
rejectMutation(
  "publication impact rejects nonfinite numbers",
  (tree) =>
    (props(one(tree, "Publication")).impact = [
      { label: "bad", value: Infinity, note: "bad" },
    ]),
  "XSU_PROP",
  "public",
);
rejectMutation(
  "publication checks hidden evidence for explicit secrets",
  (tree) =>
    (props(one(one(tree, "ReplayStep"), "Evidence")).content =
      "ghp_" + "a".repeat(32)),
  "XSU_PUBLIC_SECRET",
  "public",
);

// Every populated object/array in both fixtures is covered, including nested publication rows.
for (const preset of ["self", "public"]) {
  test(`${preset}: reject unknown nested fields and empty required strings throughout`, () => {
    const base = fixture(preset);
    const paths = [];
    function collect(value, route = []) {
      if (value && typeof value === "object") {
        if (!Array.isArray(value) && !("loc" in value && "args" in value))
          paths.push(route);
        for (const [key, child] of Object.entries(value))
          if (key !== "loc") collect(child, [...route, key]);
      }
    }
    collect(base);
    for (const route of paths) {
      const tree = structuredClone(base);
      const target = route.reduce((value, key) => value[key], tree);
      target.privateScratch = "must not leak";
      assert.throws(() => validateReplay(tree, ctx()), /Unknown|must be/);
    }
    const strings = [];
    function collectStrings(value, route = []) {
      if (typeof value === "string") {
        const optionalRoot = route.length === 3 && route[0] === "args" && route[1] === "0" && ["subtitle", "repo", "branch", "sessionName", "status"].includes(route[2]);
        if (!optionalRoot) strings.push(route);
      } else if (value && typeof value === "object") {
        const component = typeof value.type === "string" && Array.isArray(value.args);
        for (const [key, child] of Object.entries(value)) {
          if (key !== "loc" && !(component && key === "type")) collectStrings(child, [...route, key]);
        }
      }
    }
    collectStrings(base);
    for (const route of strings) {
      const tree = structuredClone(base);
      const parent = route.slice(0, -1).reduce((value, key) => value[key], tree);
      parent[route.at(-1)] = "   ";
      assert.throws(() => validateReplay(tree, ctx()), undefined, `Empty text accepted: ${route.join(".")}`);
    }
    for (const type of [
      "Actions",
      "LookAt",
      "Insight",
      "Evidence",
      "Handoff",
    ]) {
      const tree = fixture(preset);
      props(one(one(tree, "ReplayStep"), type)).unexpected = null;
      assert.throws(() => validateReplay(tree, ctx()), /Unknown/);
    }
  });
}

for (const preset of ["self", "public"]) {
  test(`${preset} diagram evidence uses shared network and safety gate`, () => {
    const tree = fixture(preset);
    const ev = one(one(tree, "ReplayStep"), "Evidence");
    props(ev).kind = "diagram";
    props(ev).content = "flowchart LR\nA --- B";
    assert.throws(
      () => lowerReplay(tree, ctx()),
      (error) => error.diagnostic.code === "XSU_NETWORK_REQUIRED",
    );
    assert.equal(
      lowerReplay(tree, ctx("connected")).steps[0].evidence[0].kind,
      "diagram",
    );
    for (const source of [
      "flowchart LR\nclick A 'https://example.com'",
      "%%{init: {}}%%\nflowchart LR",
      "flowchart LR\nA[<img>]",
    ]) {
      props(ev).content = source;
      assert.throws(
        () => lowerReplay(tree, ctx("connected")),
        (error) => error.diagnostic.code === "XSU_DIAGRAM",
      );
    }
  });
}

test("self migration round-trips facts, stable IDs, evidence, Questions and numeric hashes", () => {
  const original = lowerReplay(fixture());
  const source = migrateReplay(original, "replay-self");
  assert.match(source, /^\/\/ Migrated from explicit JSON/);
  assert.deepEqual(lowerReplay(parseXsu(source)), original);
});
test("public migration preserves authorized publication without leaking review fields", () => {
  const tree = fixture("public");
  const original = lowerReplay(tree);
  const reviewed = structuredClone(original);
  reviewed.publication.audience = props(one(tree, "Publication")).audience;
  reviewed.publication.authorsConfirmed = true;
  assert.deepEqual(
    lowerReplay(parseXsu(migrateReplay(reviewed, "replay-public"))),
    original,
  );
  const unconfirmed = parseXsu(migrateReplay(original, "replay-public"));
  const publication = props(one(unconfirmed, "Publication"));
  assert.equal(publication.authorsConfirmed, false);
  assert.equal(publication.audience, "");
  assert.throws(() => validateReplay(unconfirmed, ctx()), /audience|authorsConfirmed/);
  publication.audience = reviewed.publication.audience;
  publication.authorsConfirmed = true;
  assert.deepEqual(lowerReplay(unconfirmed), original);
});
test("migration rejects non-JSON, HTML, unknown fields and broken legacy references", () => {
  for (const value of [
    "<html></html>",
    undefined,
    () => {},
    new Date(),
    NaN,
    {
      meta: {
        get title() {
          throw Error("must not run");
        },
      },
    },
  ]) {
    assert.throws(() => migrateReplay(value));
  }
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => migrateReplay(cycle), /acyclic JSON/);
  for (const mutate of [
    (data) => (data.privateNotes = "private"),
    (data) => (data.steps[0].id = 8),
    (data) => (data.steps[0].leadsToNext.nextTarget = "wrong"),
    (data) => (data.meta.distilledSteps = 999),
    (data) => (data.steps[0].whatWasDone[0].unused = "private"),
    (data) => (data.glossary[0].plain = null),
  ]) {
    const data = lowerReplay(fixture());
    mutate(data);
    assert.throws(() => migrateReplay(data));
  }
});
test("script JSON cannot close a script tag or carry source locations", () => {
  const tree = fixture();
  props(tree).title = '</script><script>alert("x")</script>\u2028\u2029';
  const payload = scriptJson(lowerReplay(tree));
  assert.ok(!payload.includes("<"));
  assert.ok(!payload.includes("\u2028"));
  assert.equal(JSON.parse(payload).meta.title, props(tree).title);
});

const templatePaths = {
  self: "plugins/replay/skills/replay-html/references/template.html",
  public: "plugins/replay/skills/replay-post-html/references/template.html",
};
class Element {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.textContent = "";
    this.innerHTML = "";
    this.attributes = {};
    this.children = [];
    this.isConnected = true;
    this.style = {};
    const classes = new Set();
    this.classList = {
      add: (...items) => items.forEach((item) => classes.add(item)),
      remove: (...items) => items.forEach((item) => classes.delete(item)),
      contains: (item) => classes.has(item),
      toggle: (item, force) =>
        force ? classes.add(item) : classes.delete(item),
    };
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  getAttribute(name) {
    return this.attributes[name] ?? null;
  }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  addEventListener() {}
  querySelector() {
    return new Element();
  }
  querySelectorAll() {
    return [];
  }
  closest() {
    return this.parentNode ?? null;
  }
  focus() {}
}
function runtime(preset, options = {}) {
  const html = fs.readFileSync(path.join(root, templatePaths[preset]), "utf8");
  const scripts = [
    ...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
  ];
  let code = scripts
    .find(
      (match) =>
        match[1].includes('"use strict"') && match[1].includes("var steps ="),
    )
    .at(1);
  const expose = `globalThis.api = { parseHash: parseHash, toMarkdown: toMarkdown, go: go, loadState: loadState, saveState: saveState, act: act, rich: rich, mountPele: mountPele, getCurrent: function () { return current; }${preset === "self" ? ", renderStep: renderStep" : ""} };`;
  const close = code.lastIndexOf("})();");
  code = code.slice(0, close) + expose + code.slice(close);
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const data = options.data ?? lowerReplay(fixture(preset));
  get("replay-data").textContent = JSON.stringify(data);
  const diagrams = options.diagrams ?? [];
  const selectDiagrams = (selector) =>
    selector.includes(":not")
      ? diagrams.filter((el) => !el.getAttribute("data-pele"))
      : diagrams;
  const document = {
    getElementById: get,
    head: new Element("head"),
    body: new Element("body"),
    documentElement: new Element("html"),
    createElement: (tag) => new Element(tag),
    addEventListener() {},
    querySelectorAll: selectDiagrams,
    querySelector: () => diagrams[0] ?? null,
  };
  get("stage").querySelectorAll = selectDiagrams;
  const location = {
    hash: options.hash ?? "#start",
    href: "file:///example.html#start",
  };
  const prompts = [];
  const window = {
    addEventListener() {},
    scrollTo() {},
    matchMedia: () => ({ matches: false }),
    prompt: (...args) => prompts.push(args),
    ...options.window,
  };
  if (options.network) window.__XSU_CONFIG__ = { network: options.network };
  const localStorage = options.localStorage ?? {
    getItem: () => null,
    setItem() {},
  };
  const sandbox = {
    document,
    window,
    location,
    localStorage,
    navigator: options.navigator ?? {},
    history: {
      replaceState: (_state, _unused, hash) => (location.hash = hash),
    },
    setTimeout: () => 0,
    clearTimeout() {},
    URL,
    Blob,
    console,
  };
  vm.runInNewContext(code, sandbox, { filename: templatePaths[preset] });
  return { api: sandbox.api, document, location, get, data, prompts };
}
function diagram() {
  const pre = new Element("pre");
  pre.textContent = "flowchart LR\nA --- B";
  new Element().appendChild(pre);
  return pre;
}
for (const preset of ["self", "public"]) {
  test(`${preset} runtime preserves numeric hashes and adds stable aliases`, () => {
    const rt = runtime(preset);
    rt.location.hash = "#step-1";
    const first = rt.api.parseHash();
    assert.ok(first > 0);
    rt.location.hash = "#step-inspect-config";
    assert.equal(rt.api.parseHash(), first);
    rt.api.go(first);
    assert.equal(rt.location.hash, "#step-1");
    rt.location.hash = "#step-unknown";
    assert.equal(rt.api.parseHash(), null);
    rt.location.hash = "#end";
    assert.ok(preset === "self" ? rt.api.parseHash() > first : true);
  });
  test(`${preset} runtime works when localStorage is unavailable or malformed`, () => {
    for (const saved of [
      null,
      '{"visited":"broken","current":1.5}',
      '{"visited":[],"current":-1}',
      "null",
      '"bad"',
    ]) {
      const rt = runtime(preset, {
        hash: "",
        localStorage:
          saved === null
            ? {
                getItem() {
                  throw Error("denied");
                },
                setItem() {
                  throw Error("denied");
                },
              }
            : { getItem: () => saved, setItem() {} },
      });
      assert.equal(rt.api.getCurrent(), 0);
      rt.api.go(1);
      assert.equal(rt.api.getCurrent(), 1);
    }
  });
  test(`${preset} Markdown evidence fences are longer than arbitrary embedded backticks`, () => {
    const data = lowerReplay(fixture(preset));
    data.steps[0].evidence[0].content = "begin\n```\n``````\nend";
    const rt = runtime(preset, { data });
    const markdown = rt.api.toMarkdown();
    assert.ok(
      markdown.includes("```````text\nbegin\n```\n``````\nend\n```````"),
    );
  });
  test(`${preset} offline runtime never injects CDN even with diagram DOM present`, () => {
    const pre = diagram();
    const rt = runtime(preset, { network: "offline", diagrams: [pre] });
    rt.api.mountPele();
    assert.equal(rt.document.head.children.length, 0);
    assert.equal(pre.getAttribute("data-pele-state"), "error");
    assert.match(pre.parentNode.children.at(-1).textContent, /离线/);
    assert.equal(pre.textContent, "flowchart LR\nA --- B");
  });
  test(`${preset} connected loading failure keeps source and visible error`, () => {
    const pre = diagram();
    const rt = runtime(preset, { network: "connected", diagrams: [pre] });
    rt.api.mountPele();
    assert.equal(rt.document.head.children.length, 1);
    rt.document.head.children[0].onerror();
    assert.match(pre.parentNode.children.at(-1).textContent, /加载失败/);
    assert.equal(pre.textContent, "flowchart LR\nA --- B");
  });
  test(`${preset} legacy HTML without trusted config preserves on-demand loading`, () => {
    const pre = diagram();
    const rt = runtime(preset, { diagrams: [pre] });
    rt.api.mountPele();
    assert.equal(rt.document.head.children.length, 1);
  });
  test(`${preset} a renderer that mutates DOM then throws cannot destroy source`, () => {
    const pre = diagram();
    const rt = runtime(preset, {
      network: "connected",
      diagrams: [pre],
      window: {
        pele: {
          mount(el) {
            el.textContent = "";
            throw Error("bad graph");
          },
        },
      },
    });
    rt.api.mountPele();
    assert.equal(pre.textContent, "flowchart LR\nA --- B");
    assert.match(pre.parentNode.children.at(-1).textContent, /bad graph/);
  });
}
test("self template implements controlled diagram evidence with existing Pele classes", () => {
  const rt = runtime("self");
  rt.data.steps[0].evidence[0].kind = "diagram";
  const fresh = runtime("self", { data: rt.data });
  const html = fresh.api.renderStep(1, false);
  assert.match(html, /class="pele-box"/);
  assert.match(html, /<pre class="pele">/);
  assert.match(html, /FEATURE_ENABLED=false/);
});
test("self glossary never decorates inline code or escaped HTML attributes", () => {
  const rt = runtime("self");
  const html = rt.api.rich('部署配置 `部署配置` <a title="部署配置">');
  assert.match(html, /<code>部署配置<\/code>/);
  assert.ok(!html.includes('<code><span class="term"'));
  assert.ok(!html.includes('<a title="'));
});
test("public clipboard absence, rejection and synchronous failure offer selectable URL without claiming success", async () => {
  for (const navigator of [
    {},
    { clipboard: { writeText: () => Promise.reject(Error("denied")) } },
    {
      clipboard: {
        writeText() {
          throw Error("denied");
        },
      },
    },
  ]) {
    const rt = runtime("public", { navigator });
    rt.api.act("link");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(rt.prompts.length, 1);
    assert.equal(rt.prompts[0][1], rt.location.href);
    assert.ok(!rt.get("toast").textContent.includes("已复制"));
  }
});

for (const preset of ["self", "public"]) {
  test(`${preset} compiled pages canonicalize accepted numeric links to stable share hashes`, () => {
    const rt = runtime(preset, { network: "offline", hash: "#step-1" });
    assert.equal(rt.location.hash, "#step-inspect-config");
    const first = rt.api.getCurrent();
    rt.location.hash = "#step-1";
    assert.equal(rt.api.parseHash(), first);
    rt.api.go(first);
    assert.equal(rt.location.hash, "#step-inspect-config");
    rt.location.hash = "#step-2";
    rt.api.go(rt.api.parseHash());
    assert.equal(rt.location.hash, preset === "self" ? "#step-check-result" : "#step-verify-rule");
  });
  test(`${preset} old hand-written pages retain numeric output without trusted config`, () => {
    const rt = runtime(preset, { hash: "#step-1" });
    assert.equal(rt.location.hash, "#step-1");
    rt.api.go(rt.api.getCurrent());
    assert.equal(rt.location.hash, "#step-1");
  });
}
test("public compiled clipboard fallback shares stable hash even after numeric navigation", () => {
  const rt = runtime("public", { network: "offline", hash: "#step-1" });
  rt.location.href = "file:///example.html#step-1";
  rt.api.act("link");
  assert.equal(rt.prompts[0][1], "file:///example.html#step-inspect-config");
});
