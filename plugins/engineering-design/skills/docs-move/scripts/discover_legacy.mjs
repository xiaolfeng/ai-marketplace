#!/usr/bin/env node
/**
 * 盘点仓库中的旧版文档目录、不规范命名、旧状态值与章节骨架偏差（只读）。
 *
 * 为 docs-move 提供结构化迁移候选清单（JSON 输出），不直接修改任何文件。
 *
 * 用法：
 *   node discover_legacy.mjs [项目根目录]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { exit } from "node:process";

const ENG_STAGES = new Set(["research", "design", "spec", "runbook"]);
const ALLOWED_DOCS_DIRS = new Set(["engineering", "plan", "reader", "develop"]);
const LEGACY_STAGE_DIRS = new Set([
  "draft",
  "drafts",
  "rfc",
  "rfcs",
  "adr",
  "adrs",
  "notes",
  "note",
  "ops",
  "runbooks",
  "plans",
  "designs",
  "specs",
]);
const FILE_RE = /^(\d{4})-([a-z][a-z0-9]*)-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const KEBAB_MD_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const KEBAB_READER_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:html|svg)$/;

const GENRE_MARKERS = {
  research: ["发现", "结论"],
  design: ["工作方式", "数据与接口", "异常与兼容", "验证"],
  spec: ["规范条款", "正反例与边界", "合规与后果"],
  runbook: ["触发条件与现象", "执行步骤", "止血与回滚", "恢复验证"],
  plan: ["分阶段计划", "迁移与回滚", "验收与归档标准"],
};

const STATUS_MAP = {
  open: "draft",
  wip: "draft",
  todo: "draft",
  init: "draft",
  proposed: "rfc",
  review: "rfc",
  "in-review": "rfc",
  discussion: "rfc",
  accepted: "adr",
  approved: "adr",
  final: "adr",
  frozen: "adr",
  locked: "adr",
  completed: "done",
  finished: "done",
  closed: "done",
  archived: "done",
};

function toPosix(root, abs) {
  return relative(root, abs).split("\\").join("/");
}

async function walkFiles(dirAbs) {
  const out = [];
  const info = await stat(dirAbs).catch(() => null);
  if (!info?.isDirectory()) return out;
  const entries = await readdir(dirAbs, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name === ".gitkeep" || ent.name.startsWith(".")) continue;
    const abs = join(dirAbs, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walkFiles(abs)));
    } else if (ent.isFile()) {
      out.push(abs);
    }
  }
  return out;
}

function parseStatus(md) {
  const head = md.slice(0, 1000);
  const m =
    head.match(/状态[：:]\s*`?([a-zA-Z-]+)`?/) ||
    head.match(/status[：:]\s*`?([a-zA-Z-]+)`?/i);
  return m ? m[1].toLowerCase() : null;
}

function parseH2(md) {
  return [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}

function inferTargetMode(relPath, md) {
  const ext = extname(relPath).toLowerCase();
  if (ext === ".html" || ext === ".svg") return "reader";
  const lower = relPath.toLowerCase();
  if (
    lower.startsWith("plan/") ||
    lower.includes("/plan/") ||
    lower.includes("/plans/")
  ) {
    return "plan";
  }
  if (
    lower.includes("/runbook/") ||
    lower.includes("/ops/") ||
    lower.includes("/runbooks/")
  ) {
    return "runbook";
  }
  if (lower.includes("/research/")) return "research";
  if (lower.includes("/spec/") || lower.includes("/specs/")) return "spec";
  if (lower.includes("/design/") || lower.includes("/designs/"))
    return "design";
  if (
    lower.includes("/develop/") ||
    lower.includes("/notes/") ||
    lower.includes("/note/")
  ) {
    return "develop";
  }
  if (
    lower.includes("/adr/") ||
    lower.includes("/adrs/") ||
    lower.includes("/rfc/") ||
    lower.includes("/rfcs/")
  ) {
    if (md && /规范|条款|红线|禁止|must|shall/i.test(md.slice(0, 1500))) {
      return "spec";
    }
    return "design";
  }
  return "design";
}

function inferNormalizedStatus(relPath, targetMode, rawStatus) {
  if (
    targetMode === "research" ||
    targetMode === "develop" ||
    targetMode === "reader"
  ) {
    return null;
  }
  const lower = relPath.toLowerCase();
  if (!rawStatus) {
    if (lower.includes("/adr/") || lower.includes("/adrs/")) return "adr";
    if (lower.includes("/rfc/") || lower.includes("/rfcs/")) return "rfc";
    if (lower.includes("/archive/")) return "done";
    return "draft";
  }
  if (STATUS_MAP[rawStatus]) {
    const mapped = STATUS_MAP[rawStatus];
    if (targetMode === "runbook" && mapped === "adr") return "active";
    if (targetMode === "plan" && mapped === "adr") return "ready";
    return mapped;
  }
  return rawStatus;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.error("用法：node discover_legacy.mjs [项目根目录]");
    exit(0);
  }
  if (args.length > 1) {
    console.error("错误：最多接受一个位置参数（项目根目录）");
    exit(1);
  }

  const root = resolve(args[0] ?? ".");
  const rootInfo = await stat(root).catch(() => null);
  if (!rootInfo?.isDirectory()) {
    console.error(`错误：${root} 不是有效目录`);
    exit(1);
  }

  const legacyDirs = [];
  const candidates = [];

  // 1. 检查顶层遗留 plan/ 目录
  const rootPlanAbs = join(root, "plan");
  const rootPlanInfo = await stat(rootPlanAbs).catch(() => null);
  if (rootPlanInfo?.isDirectory()) {
    legacyDirs.push({
      path: "plan/",
      target: "docs/plan/",
      reason:
        "实施计划目录应位于 docs/plan/（与 docs/engineering/ 同级），而非仓库顶层",
    });
    const planFiles = await walkFiles(rootPlanAbs);
    for (const abs of planFiles) {
      const rel = toPosix(root, abs);
      const name = rel.split("/").pop();
      if (name === "README.md") {
        candidates.push({
          path: rel,
          targetDir: "docs/plan/",
          targetMode: "plan-index",
          issues: [
            "顶层 plan/README.md 需迁入 docs/plan/README.md 并修正相对链接",
          ],
        });
        continue;
      }
      const md = await readFile(abs, "utf8").catch(() => "");
      const rawStatus = parseStatus(md);
      const normStatus = inferNormalizedStatus(rel, "plan", rawStatus);
      const shouldArchive = ["done", "cancelled", "superseded"].includes(
        normStatus,
      );
      candidates.push({
        path: rel,
        targetDir: shouldArchive ? "docs/plan/archive/" : "docs/plan/",
        targetMode: "plan",
        rawStatus,
        suggestedStatus: normStatus,
        needsRename: !FILE_RE.test(name),
        issues: [
          "位于旧版顶层 plan/ 目录，应迁入 docs/plan/",
          ...(shouldArchive && !rel.includes("/archive/")
            ? [`状态为终态 ${normStatus}，应归入 docs/plan/archive/`]
            : []),
        ],
      });
    }
  }

  // 2. 检查 docs/ 目录
  const docsAbs = join(root, "docs");
  const docsInfo = await stat(docsAbs).catch(() => null);
  if (docsInfo?.isDirectory()) {
    const docsEntries = await readdir(docsAbs, { withFileTypes: true });
    for (const ent of docsEntries) {
      if (!ent.isDirectory()) continue;
      if (!ALLOWED_DOCS_DIRS.has(ent.name)) {
        legacyDirs.push({
          path: `docs/${ent.name}/`,
          target: LEGACY_STAGE_DIRS.has(ent.name.toLowerCase())
            ? "docs/engineering/{design,spec,research,runbook}/ 或 docs/develop/"
            : "docs/engineering/",
          reason: `docs/ 下未登记或旧版目录 ${ent.name}/`,
        });
      }
    }

    const engAbs = join(docsAbs, "engineering");
    const engInfo = await stat(engAbs).catch(() => null);
    if (engInfo?.isDirectory()) {
      const engEntries = await readdir(engAbs, { withFileTypes: true });
      for (const ent of engEntries) {
        if (ent.isDirectory() && !ENG_STAGES.has(ent.name)) {
          legacyDirs.push({
            path: `docs/engineering/${ent.name}/`,
            target: "docs/engineering/{design,spec}/",
            reason: `engineering/ 下旧版阶段目录 ${ent.name}/（draft/rfc/adr 已改为单文件内部状态）`,
          });
        }
      }
    }

    const allDocFiles = await walkFiles(docsAbs);
    for (const abs of allDocFiles) {
      const rel = toPosix(root, abs);
      const parts = rel.split("/");
      const name = parts[parts.length - 1];
      if (
        name === "README.md" ||
        name === "MAINTENANCE.md" ||
        name === "INITDEEP.md" ||
        name === "scope-manage.md"
      ) {
        continue;
      }

      const ext = extname(name).toLowerCase();
      const md =
        ext === ".md" ? await readFile(abs, "utf8").catch(() => "") : "";
      const rawStatus = md ? parseStatus(md) : null;
      const h2s = md ? parseH2(md) : [];
      const issues = [];

      // 判断是否在合规路径
      const subDir = parts[1];
      if (parts.length === 2) {
        issues.push(`文件直接散落在 docs/ 根目录`);
      } else if (!ALLOWED_DOCS_DIRS.has(subDir)) {
        issues.push(`位于非标准子目录 docs/${subDir}/`);
      } else if (subDir === "engineering") {
        const stageDir = parts[2];
        if (!stageDir || parts.length === 3) {
          issues.push("文件直接落在 docs/engineering/ 根下");
        } else if (!ENG_STAGES.has(stageDir)) {
          issues.push(`位于旧版阶段目录 docs/engineering/${stageDir}/`);
        }
      }

      const mode = inferTargetMode(rel, md);
      const normStatus = inferNormalizedStatus(rel, mode, rawStatus);

      if (mode === "reader") {
        if (subDir !== "reader") {
          issues.push("可视化/直读渲染文件应迁入 docs/reader/");
        } else if (!KEBAB_READER_RE.test(name)) {
          issues.push(`文件名不符合 kebab-case：${name}`);
        }
      } else if (mode === "develop") {
        if (subDir !== "develop") {
          issues.push("无状态工程备忘应迁入 docs/develop/");
        } else if (!KEBAB_MD_RE.test(name)) {
          issues.push(`文件名不符合 kebab-case.md：${name}`);
        }
        if (rawStatus) {
          issues.push(
            `develop 文档不保留记录状态，需移除文首状态「${rawStatus}」`,
          );
        }
      } else {
        if (!FILE_RE.test(name)) {
          issues.push(`受控文档文件名不符合 NNNN-<scope>-<title>.md：${name}`);
        }
        if (mode === "research" && rawStatus) {
          issues.push(
            `research 文档无过程状态，需移除「${rawStatus}」并只留调研日期`,
          );
        } else if (mode !== "research" && !rawStatus) {
          issues.push(`缺少文首状态字段（建议补「状态：${normStatus}」）`);
        } else if (rawStatus && rawStatus !== normStatus) {
          issues.push(`旧版状态值「${rawStatus}」需归一化为「${normStatus}」`);
        }
        if (
          mode === "plan" &&
          ["done", "cancelled", "superseded"].includes(normStatus) &&
          !rel.startsWith("docs/plan/archive/")
        ) {
          issues.push(`终态计划（${normStatus}）需移入 docs/plan/archive/`);
        }
        const expectedMarkers = GENRE_MARKERS[mode] ?? [];
        const missingMarkers = expectedMarkers.filter(
          (m) => !h2s.some((h) => h.includes(m)),
        );
        if (
          expectedMarkers.length > 0 &&
          missingMarkers.length === expectedMarkers.length
        ) {
          issues.push(
            `正文二级标题尚未对齐 ${mode} 标准骨架（缺少：${expectedMarkers.join(" / ")}）`,
          );
        }
      }

      if (issues.length > 0) {
        const targetDir =
          mode === "reader"
            ? "docs/reader/"
            : mode === "develop"
              ? "docs/develop/"
              : mode === "plan"
                ? ["done", "cancelled", "superseded"].includes(normStatus)
                  ? "docs/plan/archive/"
                  : "docs/plan/"
                : `docs/engineering/${mode}/`;
        candidates.push({
          path: rel,
          targetDir,
          targetMode: mode,
          rawStatus,
          suggestedStatus: normStatus,
          needsRename:
            mode === "reader"
              ? !KEBAB_READER_RE.test(name)
              : mode === "develop"
                ? !KEBAB_MD_RE.test(name)
                : !FILE_RE.test(name),
          issues,
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        root,
        legacyDirs,
        candidates,
        summary: {
          legacyDirCount: legacyDirs.length,
          candidateCount: candidates.length,
        },
      },
      null,
      2,
    ),
  );
}

await main();
