import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import vm from "node:vm";
import { PRESETS } from "../build.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const baselines = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "scripts/xsu/fixtures/style-baselines.json"),
    "utf8",
  ),
);
for (const [preset, skill] of Object.entries(PRESETS)) {
  const html = fs.readFileSync(
    path.join(ROOT, skill, "references/template.html"),
    "utf8",
  );
  test(`${preset}: style tokens and stylesheet bytes preserve the pre-XSU baseline`, () => {
    const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
      .map((m) => m[1])
      .join("\n");
    assert.equal(
      createHash("sha256").update(styles).digest("hex"),
      baselines[preset],
      "Do not reset baselines automatically: investigate visual changes first",
    );
  });
  test(`${preset}: all trusted inline JavaScript parses`, () => {
    for (const match of html.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/g,
    )) {
      if (/type="application\/json"/.test(match[1]) || !match[2].trim())
        continue;
      assert.doesNotThrow(
        () => new vm.Script(match[2], { filename: `${preset}-template.js` }),
      );
    }
  });
}
