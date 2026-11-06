import test from "node:test";
import assert from "node:assert/strict";
import { parseXsu } from "../parser.mjs";

const parse = (text) => parseXsu(text, "document.xsu");

test("component calls, JSON values, comments, escapes and trailing commas", () => {
  const root = parse(
    '/* hi */ Report({xsuVersion:1, title:"中文\\nquote \\\"", enabled:true, missing:null, weights:[-1,2e2,],}, [Markdown("ok"),]) // end',
  );
  assert.equal(root.type, "Report");
  assert.equal(root.args[0].weights[1], 200);
  assert.equal(root.args[1][0].args[0], "ok");
  assert.equal(root.loc.file, "document.xsu");
});

test("raw multiline strings preserve content without executing interpolation", () => {
  const root = parse(
    'Markdown(\n"""\n  中文 ${process.exit()}\\n\n  code\n"""\n)',
  );
  assert.equal(root.args[0], "  中文 ${process.exit()}\\n\n  code");
});

test("normalizes BOM and CRLF", () => {
  assert.equal(parse('\uFEFFMarkdown(\r\n"ok"\r\n)').args[0], "ok");
});

for (const source of [
  "Report({__proto__: {}}, [])",
  'Report({"constructor": {}}, [])',
  "Report({prototype: 1}, [])",
  'Report({title:"a",title:"b"}, [])',
  "Report({value:1e999}, [])",
  "Report({value:NaN}, [])",
  "Report({value:Infinity}, [])",
  "Report({value:0x10}, [])",
  "Report({value:1 + 2}, [])",
  "Markdown(`template`)",
  'Markdown("x"); process.exit()',
  'Markdown("x") Markdown("y")',
  'import("node:fs")',
  "$x = 1",
  "Report({fn: () => 2}, [])",
  "Report({x:process.env}, [])",
  "Report({...x},[])",
  'Markdown("unterminated)',
  "/* unterminated",
  'Markdown("bad\\q")',
  'Markdown("""\nnot-own-line\n""")',
  '[Markdown("x")]',
]) {
  test(`rejects unsupported syntax: ${source.slice(0, 70)}`, () =>
    assert.throws(
      () => parse(source),
      (error) => error.diagnostic?.code === "XSU_SYNTAX",
    ));
}

test("errors include source line and column", () => {
  assert.throws(
    () => parse('Report({\n  title: "a",\n  title: "b"\n}, [])'),
    (error) =>
      error.diagnostic.file === "document.xsu" &&
      error.diagnostic.line >= 1 &&
      error.diagnostic.column >= 1,
  );
});

test("deep nesting is rejected rather than overflowing the stack", () => {
  assert.throws(
    () => parse("Report({x:" + "[".repeat(70) + "1" + "]".repeat(70) + "},[])"),
    /Maximum syntax depth/,
  );
});
