#!/usr/bin/env node
/**
 * deep-init · 产物校验器。
 *
 * 用法：
 *   node validate.mjs [目标目录]    # 缺省为当前目录
 *
 * 检查所有 AGENTS.md：同步标记、必备段落、相对链接可达性、编码与换行符；
 * 并核对根 CLAUDE.md 与 @AGENTS.md 引用。无标记的文件视为人工维护，跳过不判失败。
 *
 * 退出码：0 = 通过；1 = 存在 ERROR；2 = 用法错误
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const MARKER_RE = /^<!--\s*deep-init:synced@([0-9a-f]+)\s*-->/;
const NOISE_DIRS = new Set([".git", "node_modules", "vendor", "dist", "build", "__pycache__"]);
/** 缺失即 ERROR 的核心段落；其余段落缺失降级为 WARN */
const REQUIRED_SECTIONS = ["概述", "目录结构", "导航指南", "约定"];
const RECOMMENDED_SECTIONS = ["反模式", "调试路径"];

const problems = [];
const notes = [];
const display = (root, file) => relative(root, file).split(sep).join("/");

function findAgentsFiles(root) {
  const found = [];
  const visit = (dir, depth) => {
    if (depth > 12) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!NOISE_DIRS.has(entry.name)) visit(full, depth + 1);
      } else if (entry.name === "AGENTS.md") {
        found.push(full);
      }
    }
  };
  visit(root, 0);
  return found.sort();
}

function checkLinks(content, file, root) {
  const linkRe = /\[[^\]]*\]\(([^)\s]+)[^)]*\)/g;
  for (const match of content.matchAll(linkRe)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const line = content.slice(0, match.index).split("\n").length;
    const resolved = resolve(dirname(file), target.split("#")[0]);
    if (!existsSync(resolved)) {
      problems.push(`ERROR ${display(root, file)}:${line} 链接目标不存在：${target}`);
    }
  }
}

function checkAgentsFile(file, root) {
  const rel = display(root, file);
  let raw;
  try {
    raw = readFileSync(file);
  } catch (error) {
    problems.push(`ERROR ${rel} 读取失败：${error.message}`);
    return;
  }

  let content;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch {
    problems.push(`ERROR ${rel} 不是合法的 UTF-8 编码`);
    return;
  }
  if (content.includes("\r\n")) problems.push(`ERROR ${rel} 含 CRLF 换行，应为 LF`);

  const lines = content.split("\n");
  const markerLine = lines.slice(0, 3).find((line) => MARKER_RE.test(line));
  if (!markerLine) {
    notes.push(`INFO ${rel} 无同步标记，视为人工维护，已跳过内容检查`);
    return;
  }
  if (!/^<!--\s*deep-init:synced@[0-9a-f]{7,40}\s*-->$/.test(markerLine.trim())) {
    problems.push(`ERROR ${rel}:1 同步标记格式不合法：${markerLine.trim()}`);
  }

  const headings = lines
    .map((line, index) => ({ text: line.trim(), no: index + 1 }))
    .filter((item) => item.text.startsWith("## "));
  const names = headings.map((h) => h.text.replace(/^##\s*/, "").trim());
  for (const section of REQUIRED_SECTIONS) {
    if (!names.includes(section)) problems.push(`ERROR ${rel} 缺少必备段落「${section}」`);
  }
  for (const section of RECOMMENDED_SECTIONS) {
    if (!names.includes(section)) {
      problems.push(`WARN ${rel} 缺少建议段落「${section}」（确属不需要可忽略）`);
    }
  }
  // 空段落：标题之后（允许空行）紧跟下一个标题
  for (let i = 0; i < headings.length - 1; i++) {
    const between = lines.slice(headings[i].no, headings[i + 1].no - 1).join("").trim();
    if (between === "") problems.push(`WARN ${rel}:${headings[i].no} 段落「${names[i]}」内容为空`);
  }

  checkLinks(content, file, root);
}

function checkClaudeMd(root) {
  const claudeMd = join(root, "CLAUDE.md");
  if (!existsSync(claudeMd)) {
    problems.push(`WARN ${display(root, claudeMd)} 不存在：完成第 5 步生成或按 Q1 问询`);
    return;
  }
  const body = readFileSync(claudeMd, "utf8").trim();
  if (body !== "@AGENTS.md") {
    notes.push(`INFO CLAUDE.md 含人工内容，未做改动（如需接入知识库走问询协议 Q1）`);
  }
}

const root = resolve(process.argv[2] ?? process.cwd());
if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`目标目录不存在或不是目录：${root}`);
  process.exit(2);
}

const agentsFiles = findAgentsFiles(root);
if (agentsFiles.length === 0) {
  console.error(`未在任何目录找到 AGENTS.md：${root}`);
  process.exit(2);
}
for (const file of agentsFiles) checkAgentsFile(file, root);
checkClaudeMd(root);

for (const note of notes) console.log(note);
for (const problem of problems) console.log(problem);
const errors = problems.filter((p) => p.startsWith("ERROR")).length;
const warns = problems.length - errors;
console.log(
  `\n校验完成：${agentsFiles.length} 份 AGENTS.md，ERROR × ${errors}，WARN × ${warns}` +
    (errors === 0 ? " —— 通过" : " —— 存在错误，修复后重跑"),
);
process.exit(errors === 0 ? 0 : 1);
