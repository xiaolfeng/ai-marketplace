import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveDocument } from "../resolver.mjs";
import { parseXsu } from "../parser.mjs";
import { validateEditorial } from "../editorial.mjs";
import { writeHtmlAtomic } from "../compiler.mjs";
const temporary = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xsu-budget-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};
test("repeated Includes count expanded source bytes, even when unique-file bytes are small", (t) => {
  const dir = temporary(t);
  fs.writeFileSync(
    path.join(dir, "part.xsu"),
    `Fragment([Markdown(${JSON.stringify("x".repeat(2 * 1024 * 1024 - 200))})])`,
  );
  const input = path.join(dir, "root.xsu");
  fs.writeFileSync(
    input,
    `Report({},[${Array(11).fill('Include("part.xsu")').join(",")}])`,
  );
  assert.throws(
    () => resolveDocument(input),
    (error) =>
      error.diagnostic?.code === "XSU_LIMIT" &&
      /Expanded source/.test(error.message),
  );
});
test("repeated embedded image references fail before assembling an oversized HTML string", () => {
  const root = parseXsu(
    `Report({xsuVersion:1,preset:"editorial",id:"images",title:"Image budget",date:"2026-11-06"},[${Array(13).fill('Image({src:"image.png",alt:"budget fixture"})').join(",")}])`,
  );
  const uri = "data:image/png;base64," + "A".repeat(2 * 1024 * 1024);
  assert.throws(
    () => validateEditorial(root, { readImage: () => uri }),
    (error) =>
      error.diagnostic?.code === "XSU_LIMIT" &&
      /image references/.test(error.message),
  );
});
test("dangling output symlinks are rejected even with force", (t) => {
  const dir = temporary(t);
  const output = path.join(dir, "output.html");
  fs.symlinkSync(path.join(dir, "missing.html"), output);
  assert.throws(
    () => writeHtmlAtomic(output, "data", { force: true }),
    /symbolic link/,
  );
  assert.ok(fs.lstatSync(output).isSymbolicLink());
});
test("unmarked migration outputs never acquire ownership from missing marker fields", (t) => {
  const dir = temporary(t);
  const output = path.join(dir, "manual.xsu");
  fs.writeFileSync(output, "manual author data");
  assert.throws(() => writeHtmlAtomic(output, "replacement"), /non-owned/);
  assert.equal(fs.readFileSync(output, "utf8"), "manual author data");
  writeHtmlAtomic(output, "explicit replacement", { force: true });
  assert.equal(fs.readFileSync(output, "utf8"), "explicit replacement");
});
