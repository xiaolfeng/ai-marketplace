import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveDocument } from "../resolver.mjs";
import { compileFile, writeHtmlAtomic } from "../compiler.mjs";
import { scriptJson, safeUrl, checkDiagram } from "../contracts.mjs";

function workspace(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xsu-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
    return path.join(dir, file);
  };
  return { dir, write };
}
const report = (body = "", extra = "") =>
  `Report({xsuVersion:1,id:"sample",preset:"editorial",title:"Example",date:"2026-11-06"${extra}},[${body}])`;
const assets = {
  preset: "editorial",
  template:
    "<!doctype html><html><head><title><!-- SLOT:title --></title></head><body><!-- SLOT:sections --></body></html>",
};
const adapter = {
  validate() {},
  render() {
    return { title: "Example", slots: { sections: "<p>Safe</p>" } };
  },
};

test("Include expands locally and retains child source positions", (t) => {
  const { write } = workspace(t);
  write("parts/a.xsu", 'Fragment([Markdown("a")])');
  const { root } = resolveDocument(
    write("report.xsu", report('Include("parts/a.xsu")')),
  );
  assert.equal(root.args[1][0].type, "Markdown");
  assert.match(root.args[1][0].loc.file, /parts\/a.xsu$/);
});

test("Include rejects cycles, incorrect roots, value positions and escapes", (t) => {
  const { dir, write } = workspace(t);
  write("parts/a.xsu", 'Fragment([Include("a.xsu")])');
  assert.throws(
    () =>
      resolveDocument(write("report.xsu", report('Include("parts/a.xsu")'))),
    /cycle/,
  );
  write("parts/a.xsu", 'Markdown("wrong")');
  assert.throws(
    () =>
      resolveDocument(write("report.xsu", report('Include("parts/a.xsu")'))),
    /Fragment/,
  );
  assert.throws(
    () =>
      resolveDocument(
        write("report.xsu", report("", ',custom:Include("parts/a.xsu")')),
      ),
    /children array/,
  );
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "xsu-outside-"));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, "a.xsu"), "Fragment([])");
  fs.symlinkSync(path.join(outside, "a.xsu"), path.join(dir, "escape.xsu"));
  assert.throws(
    () => resolveDocument(write("report.xsu", report('Include("escape.xsu")'))),
    /escapes/,
  );
});

test("resource images embed only supported local image types", (t) => {
  const { write } = workspace(t);
  const file = write("report.xsu", report());
  write("image.png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  write("bad.svg", '<svg onload="alert(1)"></svg>');
  const source = resolveDocument(file);
  assert.match(
    source.readImage("image.png", source.root),
    /^data:image\/png;base64,/,
  );
  assert.throws(() => source.readImage("bad.svg", source.root), /Only PNG/);
  assert.throws(
    () => source.readImage("https://example.com/a.png", source.root),
    /relative local/,
  );
});

test("compilation is deterministic across copied source directories", (t) => {
  const a = workspace(t);
  const b = workspace(t);
  const first = compileFile(a.write("report.xsu", report()), assets, adapter);
  const second = compileFile(b.write("report.xsu", report()), assets, adapter);
  assert.equal(first.html, second.html);
  assert.match(first.html, /XSU_GENERATED/);
  assert.doesNotMatch(first.html, /SLOT:/);
  assert.match(first.html, /"network":"offline"/);
});

test("rejects invalid protocol, preset, date, duplicate and invalid IDs", (t) => {
  const { write } = workspace(t);
  for (const source of [
    report().replace("xsuVersion:1", "xsuVersion:2"),
    report().replace("editorial", "replay-self"),
    report().replace("2026-11-06", "2026-02-30"),
    report('Section({id:"same"},[]),Section({id:"same"},[])'),
    report('Section({id:"1bad"},[])'),
  ])
    assert.throws(() =>
      compileFile(write("report.xsu", source), assets, adapter),
    );
});

test("atomic output protects inputs, non-owned files, symlinks and locks", (t) => {
  const { dir, write } = workspace(t);
  const input = write("report.xsu", report());
  const compiled = compileFile(input, assets, adapter);
  assert.throws(
    () =>
      writeHtmlAtomic(input, compiled.html, { inputs: [input], force: true }),
    /input/,
  );
  const output = write("index.html", "manual");
  assert.throws(() => writeHtmlAtomic(output, "migration", {}), /non-owned/);
  assert.equal(fs.readFileSync(output, "utf8"), "manual");
  assert.throws(
    () => writeHtmlAtomic(output, compiled.html, { marker: compiled.marker }),
    /non-owned/,
  );
  writeHtmlAtomic(output, compiled.html, {
    marker: compiled.marker,
    force: true,
  });
  writeHtmlAtomic(output, compiled.html, { marker: compiled.marker });
  assert.equal(fs.readFileSync(output, "utf8"), compiled.html);
  fs.symlinkSync(output, path.join(dir, "link.html"));
  assert.throws(
    () =>
      writeHtmlAtomic(path.join(dir, "link.html"), compiled.html, {
        force: true,
      }),
    /symbolic/,
  );
  write("index.html.xsu-lock", "locked");
  assert.throws(
    () => writeHtmlAtomic(output, compiled.html, { marker: compiled.marker }),
    /EEXIST/,
  );
  assert.equal(fs.readFileSync(output, "utf8"), compiled.html);
});

test("script JSON cannot close script tags and unsafe URLs are rejected", () => {
  assert.doesNotMatch(
    scriptJson({ text: "</ScRiPt><script>alert(1)</script>\u2028" }),
    /</,
  );
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hi",
    "file:///etc/passwd",
    "https://host/\npath",
    "//example.com",
  ])
    assert.throws(() => safeUrl(url));
  assert.equal(safeUrl("https://example.com/a"), "https://example.com/a");
  assert.equal(safeUrl("#summary"), "#summary");
});

test("diagram networking and syntax gates preserve normal Mermaid arrows", () => {
  assert.throws(
    () => checkDiagram("flowchart LR\n A-->B", null, { network: "offline" }),
    /connected/,
  );
  assert.doesNotThrow(() =>
    checkDiagram("flowchart LR\n A-->B", null, { network: "connected" }),
  );
  assert.throws(
    () =>
      checkDiagram('flowchart LR\n A["<img>"]', null, { network: "connected" }),
    /not supported/,
  );
});

test("navigation safely serializes snapshots and excludes generated current member from existence check", (t) => {
  const { dir, write } = workspace(t);
  const entry = write("report.xsu", report());
  const nav = write(
    "report-nav.json",
    JSON.stringify({
      name: "</script>",
      items: [{ file: "index.html", title: "Example" }],
    }),
  );
  const templ = {
    ...assets,
    template: assets.template.replace(
      "</body>",
      '<script id="report-nav-data" type="application/json">{}</script></body>',
    ),
  };
  const out = path.join(dir, "index.html");
  const result = compileFile(entry, templ, adapter, { out, nav });
  assert.match(result.html, /\\u003c\/script>/);
  write(
    "report-nav.json",
    JSON.stringify({ items: [{ file: "../outside.html", title: "bad" }] }),
  );
  assert.throws(
    () => compileFile(entry, templ, adapter, { out, nav }),
    /escapes/,
  );
});
