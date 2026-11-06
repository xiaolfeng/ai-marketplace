import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  EDITORIAL_COMPONENTS,
  validateEditorial,
  renderEditorial,
} from "../editorial.mjs";
import { XsuError, esc } from "../contracts.mjs";

const loc = { file: "case.xsu", line: 7, column: 3 };
const n = (type, p = {}, kids) => ({
  type,
  args: kids === undefined ? [p] : [p, kids],
  loc,
});
const report = (...nodes) =>
  n(
    "Report",
    {
      xsuVersion: 1,
      preset: "editorial",
      id: "test-report",
      title: "测试 & <核对>",
      date: "2026-11-06",
    },
    nodes,
  );
const md = (text) => ({ type: "Markdown", args: [text], loc });
const imageUri = "data:image/png;base64,iVBORw0KGgo=";
const context = () => ({
  network: "offline",
  readImage: () => imageUri,
  warnings: [],
});
const output = (root, ctx = context()) => {
  const rendered = renderEditorial(root, ctx);
  return rendered.cover + Object.values(rendered.slots).join("");
};
const html = (...nodes) => output(report(...nodes));
function rejects(node, code) {
  assert.throws(
    () => validateEditorial(report(node), context()),
    (e) =>
      e instanceof XsuError &&
      (!code || e.diagnostic.code === code) &&
      e.diagnostic.file === loc.file &&
      e.diagnostic.line === 7,
  );
}
const coverage = JSON.parse(
  await readFile(
    new URL("../component-coverage.json", import.meta.url),
    "utf8",
  ),
);
const fragments = new URL(
  "../../../plugins/html/skills/editorial-report/references/components/",
  import.meta.url,
);

test("registry is serializable, explicit, and parent/child contracts agree", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(EDITORIAL_COMPONENTS)),
    Object.fromEntries(Object.entries(EDITORIAL_COMPONENTS)),
  );
  for (const [name, entry] of Object.entries(EDITORIAL_COMPONENTS)) {
    assert.equal(entry.name, name);
    assert.equal(entry.propsSchema.additionalProperties, false);
    for (const child of entry.allowedChildren)
      assert.ok(EDITORIAL_COMPONENTS[child].allowedParents.includes(name));
  }
});
test("coverage enumerates every reference HTML fragment exactly once", async () => {
  const names = (await readdir(fragments, { recursive: true }))
    .filter((name) => name.endsWith(".html"))
    .sort();
  assert.deepEqual(coverage.entries.map((e) => e.snippet).sort(), names);
  assert.equal(coverage.visualStatus, "browser-old-shell-compared");
  for (const e of coverage.entries) {
    assert.ok(EDITORIAL_COMPONENTS[e.component]);
    assert.equal(
      e.visualBaseline.revision,
      "2335a4f7bdee70834cb876770d7f8e7a6a85a313",
    );
    assert.equal(e.visualBaseline.runner, "scripts/xsu/browser-smoke.mjs");
    assert.equal(e.visualBaseline.matrix.length, 4);
    assert.ok(e.variants.length > 0);
  }
});
for (const entry of coverage.entries)
  for (const variant of entry.variants) {
    test(`fragment ${entry.snippet} / ${variant.name}`, () => {
      const node = structuredClone(variant.node),
        before = JSON.stringify(node);
      const ctx = { ...context(), network: "connected" };
      const root = report(node),
        rendered = output(root, ctx);
      const classes = new Set(
        [...rendered.matchAll(/class="([^"]*)"/g)].flatMap((m) =>
          m[1].split(/\s+/),
        ),
      );
      for (const cls of variant.expectClasses)
        assert.ok(
          classes.has(cls),
          `${entry.snippet} / ${variant.name}: missing .${cls}`,
        );
      for (const text of variant.expectText)
        assert.ok(
          rendered.includes(esc(text)),
          `${entry.snippet} / ${variant.name}: missing text ${text}`,
        );
      assert.equal(JSON.stringify(node), before, "adapter does not mutate AST");
      assert.equal(output(root, ctx), rendered, "output is deterministic");
      assert.doesNotMatch(
        rendered,
        /(?:="(?:NaN|Infinity|-Infinity)|\b(?:NaN|Infinity)\b)/,
      );
    });
  }
test("root slots remain exact HTML contexts and plain title stays plain", () => {
  const rendered = renderEditorial(
    report(
      md("**加粗**、*斜体*、`<code>` 与 [来源](https://example.com/?a=1&b=2)"),
    ),
    context(),
  );
  assert.equal(rendered.title, "测试 & <核对>");
  assert.equal(rendered.slots.title, "测试 &amp; &lt;核对&gt;");
  assert.match(rendered.slots.sections, /<strong>加粗<\/strong>/);
  assert.match(rendered.slots.sections, /<em>斜体<\/em>/);
  assert.match(rendered.slots.sections, /<code>&lt;code&gt;<\/code>/);
  assert.match(rendered.slots.sections, /a=1&amp;b=2/);
});
test("default Cover accepts object-only example signature", () =>
  assert.match(html(n("Cover", { kicker: "周报", lead: "导语" })), /周报/));
test("empty open questions omit the section", () =>
  assert.equal(
    renderEditorial(report(n("OpenQuestions", { items: [] })), context()).slots
      .open,
    "",
  ));
test("table derives escaped responsive labels and trusted cell markup", () => {
  const rendered = html(
    n("Table", {
      columns: ['名称" onmouseover="x', "趋势"],
      rows: [["<script>", n("Sparkline", { values: [1, 4, 2] })]],
    }),
  );
  assert.match(rendered, /data-label="名称&quot; onmouseover=&quot;x"/);
  assert.match(rendered, /&lt;script&gt;/);
  assert.doesNotMatch(rendered, /<script>/);
  assert.match(rendered, /sparkline-svg/);
});
test("unknown components, unknown fields, illegal attributes and nesting are rejected", () => {
  rejects(n("RawHTML", { text: "<b>x</b>" }), "XSU_COMPONENT");
  rejects(n("Quote", { text: "x", className: "evil" }));
  rejects(n("Quote", { text: "x", style: "color:red" }));
  rejects(n("Quote", { text: "x", onclick: "alert(1)" }));
  rejects(n("Metric", { label: "KPI", value: 1 }), "XSU_NESTING");
  rejects(n("Metrics", {}, [md("not a metric")]), "XSU_NESTING");
  rejects(n("Quote", { text: "x" }, []), "XSU_SIGNATURE");
  rejects(n("Section", { id: "s", title: "章节" }), "XSU_SIGNATURE");
  rejects(n("Split", {}, [md("one")]));
  rejects(n("Grid", { columns: 5 }, []));
});
test("nested item shapes and node-as-data are never silently accepted", () => {
  for (const bad of [
    n("People", { items: [{ name: "a", onclick: "x" }] }),
    n("Chart", {
      kind: "line",
      labels: ["a"],
      series: [{ name: "x", values: [1], color: "red" }],
    }),
    n("Tree", {
      items: [{ name: "a", children: [{ name: "b", style: "bad" }] }],
    }),
    n("Kanban", {
      columns: [
        { title: "x", status: "todo", items: [{ title: "a", event: "bad" }] },
      ],
    }),
    n("Metric", { label: "x", value: n("Code", {}) }),
    n("Table", {
      columns: ["x"],
      rows: [[n("Image", { src: "a.png", alt: "x" })]],
    }),
  ])
    rejects(bad);
});
test("required fields, versions, root type, dates, IDs and cardinality are strict", () => {
  assert.throws(
    () =>
      validateEditorial(n("Section", { id: "s", title: "x" }, []), context()),
    XsuError,
  );
  const root = report();
  root.args[0].xsuVersion = 2;
  assert.throws(() => validateEditorial(root, context()), XsuError);
  for (const badDate of ["2026-02-30", "2026-2-1", "nonsense"]) {
    const r = report();
    r.args[0].date = badDate;
    assert.throws(() => validateEditorial(r, context()), XsuError);
  }
  rejects(n("Section", { id: '" onclick="x', title: "bad" }, []));
  assert.throws(
    () =>
      validateEditorial(
        report(
          n("Section", { id: "same", title: "one" }, []),
          n("Section", { id: "same", title: "two" }, []),
        ),
        context(),
      ),
    /Duplicate ID/,
  );
  assert.throws(
    () => validateEditorial(report(n("Cover", {}), n("Cover", {})), context()),
    /at most one/,
  );
});
test("unsafe links and unsupported Markdown extensions fail with locations", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "https://exam\nple.com",
  ])
    rejects(n("Sources", { items: [{ title: "source", url: value }] }));
  for (const source of [
    "[bad](javascript:alert)",
    "<img src=x onerror=x>",
    "# unsupported heading",
    "![image](a.png)",
    "```js\ncode\n```",
    "[^footnote]",
    "- outer\n  - inner",
    "|a|b|",
    "unclosed **bold",
  ])
    rejects(md(source));
  assert.match(
    html(md("- one\n- two\n\n1. first\n2. second")),
    /<ul class="bits">.*<ol class="steps">/,
  );
});
test("image resources use only the provided reader, require alt, and reject SVG results", () => {
  let calls = 0;
  const root = report(
    n("Image", {
      src: "fixtures/a.png",
      alt: '截图" />',
      caption: "<not html>",
    }),
  );
  const rendered = output(root, {
    ...context(),
    readImage: (src) => {
      assert.equal(src, "fixtures/a.png");
      calls++;
      return imageUri;
    },
  });
  assert.ok(calls > 0);
  assert.match(rendered, /alt="截图&quot; \/&gt;"/);
  assert.match(rendered, /&lt;not html&gt;/);
  rejects(n("Image", { src: "a.png" }));
  assert.throws(
    () =>
      renderEditorial(root, { readImage: () => "data:image/svg+xml,<svg/>" }),
    XsuError,
  );
  assert.throws(() => renderEditorial(root), XsuError);
});
test("diagram network policy is the same inside Evidence", () => {
  for (const node of [
    n("Diagram", { source: "flowchart LR\nA --- B" }),
    n("Evidence", {
      kind: "diagram",
      title: "graph",
      content: "flowchart LR\nA --- B",
    }),
  ]) {
    rejects(node, "XSU_NETWORK_REQUIRED");
    assert.match(
      output(report(node), { ...context(), network: "connected" }),
      /class="pele"/,
    );
  }
  for (const source of [
    "%%{init:evil}%%\nflowchart LR",
    'flowchart LR\nclick A "https://evil.test"',
    "flowchart LR\nA[<img>]",
  ])
    assert.throws(
      () =>
        validateEditorial(report(n("Diagram", { source })), {
          ...context(),
          network: "connected",
        }),
      XsuError,
    );
});
test("table, heatmap, chart and score dimensions reject mismatches", () => {
  rejects(n("Table", { columns: ["A", "B"], rows: [[1]] }), "XSU_DIMENSION");
  rejects(n("Table", { columns: [], rows: [] }));
  rejects(
    n("Heatmap", { columns: ["A"], rows: ["B"], values: [[1, 2]] }),
    "XSU_DIMENSION",
  );
  rejects(
    n("Chart", {
      kind: "line",
      labels: ["A", "B"],
      series: [{ name: "N", values: [1] }],
    }),
    "XSU_DIMENSION",
  );
  rejects(
    n("Scorecard", {
      criteria: [{ name: "a", weight: 1 }],
      options: [{ name: "A", scores: [] }],
    }),
    "XSU_DIMENSION",
  );
  rejects(
    n("Scorecard", {
      criteria: [{ name: "a", weight: 0 }],
      options: [{ name: "A", scores: [1] }],
    }),
  );
});
test("scorecard computes weighted mean from raw scores, never trusts a supplied total", () => {
  const p = {
    criteria: [
      { name: "质量", weight: 3 },
      { name: "成本", weight: 1 },
    ],
    options: [{ name: "A", scores: [9, 4] }],
  };
  assert.match(html(n("Scorecard", p)), /scorecard-total-num">7.75<\/span>/);
  rejects(n("Scorecard", { ...p, total: 10 }));
  rejects(n("Scorecard", { ...p, options: [{ name: "A", scores: [11, 4] }] }));
});
for (const kind of ["bar", "line", "area", "donut", "stacked-bar"])
  for (const values of [
    [],
    [0],
    [4],
    [4, 4],
    [1e100, 1e100],
    [Number.MIN_VALUE],
  ]) {
    test(`finite SVG ${kind}: ${JSON.stringify(values)}`, () => {
      const rendered = html(
        n("Chart", {
          kind,
          labels: values.map((_, i) => "标签" + i),
          series: [{ name: "S", values }],
        }),
      );
      assert.doesNotMatch(rendered, /NaN|Infinity|undefined/);
      for (const [, value] of rendered.matchAll(
        /(?:x|y|cx|cy|x1|x2|y1|y2|width|height)="([\d.e+-]+)"/g,
      ))
        assert.ok(Number.isFinite(Number(value)));
    });
  }
test("negative values are represented, not silently clipped; unsuitable domains fail", () => {
  for (const kind of ["bar", "line", "area"])
    assert.match(
      html(
        n("Chart", {
          kind,
          labels: ["负", "正"],
          series: [{ name: "N", values: [-4, 7] }],
        }),
      ),
      /-4/,
    );
  for (const kind of ["donut", "stacked-bar"])
    rejects(
      n("Chart", {
        kind,
        labels: ["负"],
        series: [{ name: "N", values: [-4] }],
      }),
    );
  rejects(n("Heatmap", { columns: ["x"], rows: ["y"], values: [[-1]] }));
});
test("missing line points create gaps instead of zeroes", () => {
  const rendered = html(
    n("Chart", {
      kind: "line",
      labels: ["a", "b", "c"],
      series: [{ name: "S", values: [4, null, 8] }],
    }),
  );
  assert.equal([...rendered.matchAll(/<polyline /g)].length, 2);
  rejects(
    n("Chart", {
      kind: "donut",
      labels: ["missing"],
      series: [{ name: "S", values: [null] }],
    }),
  );
});
test("scatter accepts signed coordinates and equal/single-point domains", () => {
  for (const points of [
    [{ x: -4, y: -7 }],
    [
      { x: 1e100, y: -1e100 },
      { x: -1e100, y: 1e100 },
    ],
    [{ x: Number.MIN_VALUE, y: Number.MIN_VALUE }],
  ])
    assert.doesNotMatch(
      html(
        n("Chart", {
          kind: "scatter",
          labels: ["x"],
          series: [{ name: "S", values: points }],
        }),
      ),
      /NaN|Infinity/,
    );
  rejects(
    n("Chart", {
      kind: "scatter",
      labels: ["x"],
      series: [{ name: "S", values: [4] }],
    }),
  );
});
test("sparkline, gauge and progress boundaries are finite and unclamped", () => {
  for (const value of [0, 100])
    assert.doesNotMatch(
      html(n("Gauge", { value }), n("Progress", { value })),
      /NaN|Infinity/,
    );
  for (const values of [[], [0], [3, 3], [Number.MIN_VALUE], [-1e100, 1e100]])
    assert.doesNotMatch(html(n("Sparkline", { values })), /NaN|Infinity/);
  for (const node of [
    n("Gauge", { value: 101 }),
    n("Gauge", { value: 1, min: 1, max: 1 }),
    n("Progress", { value: -1 }),
    n("Progress", { value: 2, max: 1 }),
    n("Progress", { value: 0, max: 0 }),
  ])
    rejects(node);
});
test("chart point budget is enforced across series and at the exact boundary", () => {
  const labels = Array.from({ length: 2500 }, (_, i) => "point-" + i);
  const props = {
    kind: "line",
    labels,
    series: [
      { name: "A", values: labels.map(() => 1) },
      { name: "B", values: labels.map(() => 2) },
    ],
  };
  assert.doesNotThrow(() =>
    validateEditorial(report(n("Chart", props)), context()),
  );
  props.series.push({ name: "C", values: labels.map(() => 3) });
  rejects(n("Chart", props));
  const many = Array(5001).fill(1);
  rejects(n("Sparkline", { values: many }));
});
test("nonfinite and overflow-prone numbers are rejected recursively", () => {
  for (const value of [NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
    rejects(n("Gauge", { value }));
    rejects(
      n("Chart", {
        kind: "bar",
        labels: ["x"],
        series: [{ name: "A", values: [value] }],
      }),
    );
    rejects(n("Sparkline", { values: [value] }));
    rejects(n("Json", { value: { hidden: value } }));
  }
});
test("native Roadmap works offline, validates actual dates and calculates real positions", () => {
  const node = n("Roadmap", {
    title: "排期",
    items: [
      {
        title: "实施",
        start: "2026-11-01",
        end: "2026-11-08",
        lane: "开发",
        status: "active",
      },
      {
        title: "验收",
        start: "2026-11-08",
        end: "2026-11-08",
        milestone: true,
        status: "crit",
      },
    ],
    markers: [{ date: "2026-11-06", label: "封版" }],
  });
  assert.match(html(node), /<polygon points=/);
  assert.match(html(node), /2026-11-01/);
  assert.match(html(node), /封版/);
  rejects(
    n("Roadmap", {
      items: [{ title: "bad", start: "2026-02-30", end: "2026-11-01" }],
    }),
  );
  rejects(
    n("Roadmap", {
      items: [{ title: "bad", start: "2026-11-08", end: "2026-11-01" }],
    }),
  );
});
test("graphs, decisions and fixed CSS layouts enforce semantic references", () => {
  rejects(
    n("Flow", {
      nodes: [{ id: "a", title: "A" }],
      edges: [{ from: "a", to: "missing" }],
    }),
    "XSU_REFERENCE",
  );
  rejects(
    n("StateMachine", {
      nodes: [
        { id: "a", title: "A" },
        { id: "a", title: "duplicate" },
      ],
      transitions: [],
    }),
  );
  rejects(
    n("Decision", { options: ["A", "B"], choice: "C", rationale: "选型依据" }),
  );
  rejects(n("Sequence", { actors: ["A", "B"], steps: [] }));
  rejects(
    n("Sequence", {
      actors: ["A", "B", "C", "D"],
      steps: [{ from: 2, to: 2, text: "self" }],
    }),
  );
  rejects(n("Quadrant", { labels: ["one"], items: [] }));
});
test("new layout/data components have executable cases beyond the legacy catalog", () => {
  assert.match(
    html(
      n("Row", {}, [md("A"), md("B")]),
      n("Grid", { columns: 4 }, [md("grid")]),
      n("Stack", {}, [md("stack")]),
      n("Decision", {
        options: ["A", "B"],
        choice: "A",
        rationale: "核对通过",
      }),
    ),
    /grid/,
  );
  for (const kind of ["code", "command", "quote", "table"])
    assert.match(
      html(n("Evidence", { kind, title: "证据", content: "<escaped>" })),
      /&lt;escaped&gt;/,
    );
});
test("representative editorial.xsu parses and renders with the shared parser", async () => {
  const { parseXsu } = await import("../parser.mjs");
  const source = await readFile(
    new URL("../fixtures/editorial.xsu", import.meta.url),
    "utf8",
  );
  const root = parseXsu(source, "editorial.xsu");
  assert.match(output(root), /测试特刊/);
});

test("every legacy fixture rejects unknown props instead of dropping attrs", () => {
  for (const entry of coverage.entries) {
    const node = structuredClone(entry.variants[0].node);
    node.args[0].onclick = "bad";
    assert.throws(
      () =>
        validateEditorial(report(node), { ...context(), network: "connected" }),
      (error) =>
        error instanceof XsuError && error.diagnostic.code === "XSU_PROP",
    );
  }
});

test("long labels remain intact and produce deduplicated layout warnings", () => {
  const label = "长标签".repeat(100);
  const root = report(
    n("Chart", {
      kind: "line",
      labels: ["起点", label, "终点"],
      series: [{ name: "S", values: [1, 3, 2] }],
    }),
  );
  const ctx = context();
  validateEditorial(root, ctx);
  const first = ctx.warnings.length;
  const rendered = output(root, ctx);
  assert.ok(first > 0);
  assert.equal(ctx.warnings.length, first);
  assert.ok(rendered.includes(label));
  assert.match(rendered, /<title>长标签/);
});

test("nested trees and Json cannot bypass the data depth limit", () => {
  let items = [{ name: "leaf" }],
    value = "leaf";
  for (let i = 0; i < 70; i++) {
    items = [{ name: "branch", children: items }];
    value = { nested: value };
  }
  rejects(n("Tree", { items }));
  rejects(n("Json", { value }));
});

test("Json token styling preserves the complete original data including repeated strings", () => {
  const value = {
    name: "name",
    exponent: 1e40,
    small: 1e-40,
    nested: [true, null, '<script> & "quoted"'],
  };
  const rendered = html(n("Json", { value }));
  const content = rendered
    .match(/<pre class="json-viewer-body"><code>([\s\S]*?)<\/code><\/pre>/)[1]
    .replace(/<span[^>]*>|<\/span>/g, "");
  const unescaped = content
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  assert.deepEqual(JSON.parse(unescaped), value);
  assert.match(rendered, /class="j-key">&quot;name&quot;/);
  assert.match(rendered, /class="j-str">&quot;name&quot;/);
});

test("image validation rejects remote or author data URLs before invoking the reader", () => {
  for (const src of [
    "https://example.com/a.png",
    "data:image/png;base64,YQ==",
    "file:///tmp/a.png",
    "/tmp/a.png",
    "a\n.png",
  ]) {
    let called = false;
    assert.throws(
      () =>
        validateEditorial(report(n("Image", { src, alt: "图" })), {
          ...context(),
          readImage: () => {
            called = true;
            return imageUri;
          },
        }),
      XsuError,
    );
    assert.equal(called, false);
  }
});

test("image reader is memoized within a render without altering author nodes", () => {
  let called = 0;
  const root = report(
    n("Cover", { variant: "banner" }, [
      n("Image", { src: "a.png", alt: "封面图" }),
    ]),
  );
  renderEditorial(root, {
    ...context(),
    readImage: () => {
      called++;
      return imageUri;
    },
  });
  assert.equal(called, 1);
});

test("cover replacement payload preserves top-level takeaway for every variant", () => {
  for (const variant of [
    "default",
    "banner",
    "metric",
    "minimal",
    "split-lead",
  ]) {
    const root = report(
      n("Cover", {
        variant,
        ...(variant === "metric"
          ? { metric: { label: "指标", value: 12 } }
          : {}),
      }),
      n("Takeaway", { text: "不可丢失的判断" }),
    );
    assert.match(renderEditorial(root, context()).cover, /不可丢失的判断/);
  }
});

test("Sources IDs are checked together with Section IDs", () => {
  const source = n("Sources", {
    items: [{ id: "duplicate", title: "证据", url: "https://example.com" }],
  });
  assert.throws(
    () =>
      validateEditorial(
        report(source, n("Section", { id: "duplicate", title: "章节" }, [])),
        context(),
      ),
    XsuError,
  );
  rejects(
    n("Sources", {
      items: [{ id: "bad id", title: "证据", url: "https://example.com" }],
    }),
    "XSU_ID",
  );
});

test("Markdown handles long literal bracket runs and multiple links without quadratic rescans", () => {
  const text = "[".repeat(50000);
  assert.ok(html(md(text)).includes(text));
  const rendered = html(
    md(
      "[first](https://example.com/one) and [second](https://example.com/two)",
    ),
  );
  assert.match(rendered, /href="https:\/\/example.com\/one"/);
  assert.match(rendered, /href="https:\/\/example.com\/two"/);
});

test("blank KPI values and context-incompatible chart props are rejected", () => {
  for (const value of [null, true, "", "   "])
    rejects(n("Metrics", {}, [n("Metric", { label: "指标", value })]));
  rejects(
    n("Chart", {
      kind: "bar",
      labels: ["x"],
      series: [{ name: "S", values: [1] }],
      threshold: 2,
    }),
  );
});

test("Grid uses only existing responsive classes for all allowed column counts", () => {
  for (const columns of [1, 2, 3, 4]) {
    const rendered = html(
      n("Grid", { columns }, [md("a"), md("b"), md("c"), md("d")]),
    );
    assert.doesNotMatch(rendered, /col-[14]/);
    assert.match(rendered, /class="gallery-grid/);
    if (columns === 4) assert.match(rendered, /compare-grid/);
  }
});
