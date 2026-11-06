import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { PRESETS, buildAll } from "../build.mjs";
import { resolveDocument } from "../resolver.mjs";
import { lowerReplay } from "../replay.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const run = (script, args) =>
  spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
function temporary(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xsu-independent-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("distributed bundles, examples and shared references match their sources", () => {
  assert.equal(
    buildAll(true),
    true,
    "Run npm run build to regenerate distributions",
  );
});
for (const [preset, skill] of Object.entries(PRESETS)) {
  test(`${preset}: a standalone script renders without this repository or sibling skills`, (t) => {
    const dir = temporary(t);
    const script = path.join(dir, "xsu.mjs");
    const source = path.join(dir, "example.xsu");
    const output = path.join(dir, "example.html");
    fs.copyFileSync(path.join(ROOT, skill, "scripts/xsu.mjs"), script);
    fs.copyFileSync(path.join(ROOT, skill, "examples/example.xsu"), source);
    assert.equal(run(script, ["--version"]).status, 0);
    const catalog = run(script, ["components", "--preset", preset]);
    assert.equal(catalog.status, 0, catalog.stderr);
    assert.equal(JSON.parse(catalog.stdout).preset, preset);
    const valid = run(script, ["validate", source]);
    assert.equal(valid.status, 0, valid.stderr);
    const render = run(script, ["render", source, "--out", output]);
    assert.equal(render.status, 0, render.stderr);
    const html = fs.readFileSync(output, "utf8");
    assert.match(html, /XSU_GENERATED/);
    assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
    assert.doesNotMatch(html, /<!-- SLOT:/);
    assert.equal(
      run(script, ["render", source, "--out", output, "--check"]).status,
      0,
    );
    fs.appendFileSync(output, "\n<!-- edited -->");
    assert.equal(
      run(script, ["render", source, "--out", output, "--check"]).status,
      4,
    );
    assert.equal(run(script, ["render", source, "--out", output]).status, 0);
    assert.equal(
      run(script, ["render", source, "--out", source, "--force"]).status,
      2,
    );
    assert.equal(run(script, ["validate", source, "--unknown"]).status, 1);
    assert.equal(
      run(script, ["validate", source, "--preset", "wrong"]).status,
      1,
    );
    const diagnostics = path.join(dir, "diagnostics.json");
    assert.equal(
      run(script, ["validate", source, "--diagnostics-json", diagnostics])
        .status,
      0,
    );
    const report = JSON.parse(fs.readFileSync(diagnostics, "utf8"));
    assert.ok(Array.isArray(report));
    assert.equal(report.filter((item) => item.severity === "error").length, 0);
    assert.equal(
      run(script, ["validate", source, "--diagnostics-json", diagnostics])
        .status,
      2,
    );
  });
}

test("Replay JSON migration round-trips step titles and questions and rejects malformed JSON as content", (t) => {
  const dir = temporary(t);
  const script = path.join(ROOT, PRESETS["replay-self"], "scripts/xsu.mjs");
  const original = lowerReplay(
    resolveDocument(path.join(ROOT, "scripts/xsu/fixtures/replay-self.xsu"))
      .root,
    { network: "offline", warnings: [] },
  );
  const input = path.join(dir, "legacy.json");
  const output = path.join(dir, "migrated.xsu");
  fs.writeFileSync(input, JSON.stringify(original));
  const migrate = run(script, ["migrate-replay", input, "--out", output]);
  assert.equal(migrate.status, 0, migrate.stderr);
  const checked = run(script, ["validate", output]);
  assert.equal(checked.status, 0, checked.stderr);
  const data = lowerReplay(resolveDocument(output).root, {
    network: "offline",
    warnings: [],
  });
  assert.deepEqual(
    data.steps.map((s) => s.title),
    original.steps.map((s) => s.title),
  );
  assert.deepEqual(data.confusionMatrix, original.confusionMatrix);
  fs.writeFileSync(input, "{invalid");
  assert.equal(
    run(script, ["migrate-replay", input, "--out", path.join(dir, "bad.xsu")])
      .status,
    2,
  );
});

test("legacy navigation helper refuses to mutate XSU-owned HTML", (t) => {
  const dir = temporary(t);
  const script = path.join(ROOT, PRESETS.editorial, "scripts/xsu.mjs");
  const output = path.join(dir, "index.html");
  const source = path.join(ROOT, "scripts/xsu/fixtures/editorial.xsu");
  assert.equal(run(script, ["render", source, "--out", output]).status, 0);
  const before = fs.readFileSync(output, "utf8");
  const nav = path.join(dir, "report-nav.json");
  fs.writeFileSync(
    nav,
    JSON.stringify({
      name: "Sample",
      items: [{ file: "index.html", title: "Sample" }],
    }),
  );
  const result = run(
    path.join(ROOT, PRESETS.editorial, "scripts/sync-nav.mjs"),
    [nav],
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /XSU/);
  assert.equal(fs.readFileSync(output, "utf8"), before);
});
