#!/usr/bin/env node
/**
 * deep-init · 结构扫描器（只读，不写入任何文件）。
 *
 * 用法：
 *   node scan.mjs [目标目录]    # 缺省为当前目录
 *
 * 输出：stdout 上的 JSON——git 状态、存量 AGENTS.md 盘点（含同步标记与增量 diff 摘要）、
 * 顶层结构摘要与语言分布。供 SKILL.md 第 1 步调用，是分层判定与增量更新的事实依据。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/** 存量文件头部的同步标记，解析增量范围的唯一依据；无标记 = 人工维护 */
const MARKER_RE = /^<!--\s*deep-init:synced@([0-9a-f]+)\s*-->/;
/** 遍历时跳过的噪音目录（构建产物、依赖、编辑器配置等） */
const NOISE_DIRS = new Set([
  ".git", "node_modules", "vendor", "dist", "build", "out",
  "__pycache__", ".next", ".nuxt", ".venv", "venv", "target",
  ".idea", ".vscode", ".gradle", "Pods",
]);
/** 防失控上限：文件数超过即停止遍历并标记 truncated */
const MAX_FILES = 5000;

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/** 无 git 可用时的兜底遍历（尊重噪音目录清单） */
function walkFiles(root) {
  const files = [];
  let truncated = false;
  const visit = (dir, depth) => {
    if (truncated || depth > 12) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // 无权限等读取失败：跳过该目录
    }
    for (const entry of entries) {
      if (truncated) return;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!NOISE_DIRS.has(entry.name)) visit(full, depth + 1);
      } else if (entry.isFile() && files.length < MAX_FILES) {
        files.push(relative(root, full).split(sep).join("/"));
      }
      if (files.length >= MAX_FILES) truncated = true;
    }
  };
  visit(root, 0);
  return { files, truncated };
}

function listFiles(root, isRepo) {
  if (isRepo) {
    // -co = 已跟踪 + 未跟踪非忽略文件，天然尊重 .gitignore
    const out = git(["ls-files", "-co", "--exclude-standard"], root);
    if (out !== null) {
      const all = out.split("\n").filter(Boolean);
      return { files: all.slice(0, MAX_FILES), truncated: all.length > MAX_FILES };
    }
  }
  return walkFiles(root);
}

/** 语言分布：按扩展名计数，取前 8 名 */
function languageStats(files) {
  const counts = new Map();
  for (const file of files) {
    const dot = file.lastIndexOf(".");
    if (dot <= file.lastIndexOf("/")) continue; // 无扩展名或纯点文件
    const ext = file.slice(dot).toLowerCase();
    counts.set(ext, (counts.get(ext) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ext, count]) => ({ ext, count }));
}

/** 顶层结构摘要：每个条目附直接/间接文件数，辅助判定分层节点 */
function treeSummary(root, files) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => !NOISE_DIRS.has(entry.name))
    .map((entry) => {
      if (entry.isFile()) return { name: entry.name, type: "file" };
      const prefix = `${entry.name}/`;
      return {
        name: entry.name,
        type: "dir",
        fileCount: files.filter((f) => f.startsWith(prefix)).length,
      };
    })
    .sort((a, b) => (b.fileCount ?? 0) - (a.fileCount ?? 0));
}

/** 盘点存量 AGENTS.md：解析同步标记；有标记且 git 可用时给出增量 diff 摘要 */
function inventory(files, root, isRepo) {
  return files
    .filter((path) => path === "AGENTS.md" || path.endsWith("/AGENTS.md"))
    .map((path) => {
      const head = readFileSync(join(root, path), "utf8")
        .split("\n")
        .slice(0, 3)
        .find((line) => MARKER_RE.test(line));
      const match = head?.match(MARKER_RE);
      const entry = {
        path,
        scope: path === "AGENTS.md" ? "." : path.replace(/\/AGENTS\.md$/, ""),
        marked: Boolean(match),
        markerCommit: match ? match[1] : null,
        diffSinceMarker: null,
      };
      if (match && isRepo) {
        // 哈希不在当前历史（如 rebase 过）时 diff 报错 → 保持 null，由 edge-cases E3 处置
        entry.diffSinceMarker =
          git(["diff", "--shortstat", `${match[1]}..HEAD`, "--", entry.scope], root) || "";
      }
      return entry;
    });
}

const root = resolve(process.argv[2] ?? process.cwd());
if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`目标目录不存在或不是目录：${root}`);
  process.exit(2);
}

const isRepo = existsSync(join(root, ".git")) && git(["rev-parse", "--git-dir"], root) !== null;
const { files, truncated } = listFiles(root, isRepo);

const result = {
  root,
  generatedAt: new Date().toISOString(),
  warnings: [],
  git: {
    isRepo,
    branch: isRepo ? git(["branch", "--show-current"], root) : null,
    head: isRepo ? git(["rev-parse", "--short", "HEAD"], root) : null,
  },
  stats: { totalFiles: files.length, truncated, languages: languageStats(files) },
  tree: treeSummary(root, files),
  knowledgeBase: inventory(files, root, isRepo),
};
if (!isRepo) result.warnings.push("不是 git 仓库：无法生成同步标记与增量 diff（见问询协议 Q3）");
if (truncated) result.warnings.push(`文件数超过 ${MAX_FILES} 上限，统计已截断`);

console.log(JSON.stringify(result, null, 2));
