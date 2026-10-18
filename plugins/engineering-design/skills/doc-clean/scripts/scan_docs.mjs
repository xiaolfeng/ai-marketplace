#!/usr/bin/env node
/**
 * 扫描 docs/engineering/、docs/README.md 与顶层 plan/ 的文档卫生问题（只读）。
 *
 * 检查项与 fix 分级以 ../references/checks.md 为准，编号/状态规则
 * 分别读目标仓 docs/scope-manage.md 与本插件 _shared/lifecycle.md。
 *
 * 用法：
 *   node scan_docs.mjs [项目根目录] [--skip-http]
 *
 * 不传根目录时默认当前目录。stdout 打 JSON；退出码 0 表示扫描完成
 * （有 findings 也是 0），1 表示参数无效或根目录不存在。
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { exit } from "node:process";
import { fileURLToPath } from "node:url";

const ENG_STAGES = ["research", "design", "spec", "runbook"];
const ALL_STAGES = ["research", "design", "spec", "runbook", "plan"];
const FILE_RE = /^(\d{4})-([a-z][a-z0-9]*)-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const SKIP_HTTP_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "example.com",
  "example.org",
]);

const GENRE_MARKERS = {
  research: ["发现", "结论"],
  design: ["工作方式", "数据与接口", "异常与兼容", "验证"],
  spec: ["规范条款", "正反例与边界", "合规与后果"],
  runbook: ["触发条件与现象", "执行步骤", "止血与回滚", "恢复验证"],
  plan: ["分阶段计划", "迁移与回滚", "验收与归档标准"],
};

const LEGACY_INITIAL_STATUS = new Set(["open", "proposed"]);
const PLAN_ACTIVE_STATUS = new Set(["draft", "ready", "in-progress"]);
const PLAN_ARCHIVE_STATUS = new Set(["done", "cancelled", "superseded"]);

const skillDir = dirname(fileURLToPath(import.meta.url));
const lifecyclePath = join(skillDir, "..", "..", "_shared", "lifecycle.md");

function toPosix(root, abs) {
  return relative(root, abs).split("\\").join("/");
}

function parseArgs(argv) {
  const flags = new Set();
  const positionals = [];
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") flags.add("help");
    else if (arg === "--skip-http") flags.add("skipHttp");
    else if (arg.startsWith("-")) {
      return { error: `未知参数：${arg}` };
    } else positionals.push(arg);
  }
  if (positionals.length > 1)
    return { error: "最多接受一个位置参数（项目根目录）" };
  return {
    root: positionals[0] ?? ".",
    skipHttp: flags.has("skipHttp"),
    help: flags.has("help"),
  };
}

async function loadText(path) {
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) return null;
  return readFile(path, "utf8");
}

function parseVocab(md) {
  const vocab = new Set();
  if (!md) return vocab;
  for (const line of md.split("\n")) {
    const m = line.match(/\|\s*`([a-z][a-z0-9-]*)`\s*\|/);
    if (m) vocab.add(m[1]);
  }
  return vocab;
}

function parseAllowedStatus(md) {
  const allowed = {};
  if (!md) return allowed;
  for (const line of md.split("\n")) {
    const m = line.match(
      /^\|\s*(research|design|spec|runbook|plan)\s*\|([^|]+)\|/,
    );
    if (!m) continue;
    const stage = m[1];
    const cell = m[2];
    if (/无状态/.test(cell)) {
      allowed[stage] = [];
      continue;
    }
    allowed[stage] = [...cell.matchAll(/`([a-z-]+)`/g)].map((x) => x[1]);
  }
  return allowed;
}

function stripIgnored(md) {
  return md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
}

function extractLinks(md) {
  const links = [];
  const re = /!?\[([^\]]*)\]\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(md))) {
    const raw = m[2].trim();
    const href = raw.replace(/\s+"[^"]*"$/, "").trim();
    links.push({ text: m[1], href, image: m[0].startsWith("!") });
  }
  return links;
}

function parseStatus(md) {
  const head = md.slice(0, 1000);
  const m = head.match(/状态[：:]\s*`?([a-z-]+)`?/);
  return m ? m[1] : null;
}

function h2Exact(md) {
  return [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}

function scoreGenre(heads) {
  const scores = {};
  for (const [stage, keys] of Object.entries(GENRE_MARKERS)) {
    scores[stage] = keys.filter((k) => heads.includes(k)).length;
  }
  return scores;
}

function pad4(n) {
  return String(n).padStart(4, "0");
}

function gapsIn(numbers) {
  if (numbers.length === 0) return [];
  const have = new Set(numbers);
  const max = Math.max(...numbers);
  const missing = [];
  for (let i = 1; i <= max; i++) {
    if (!have.has(i)) missing.push(i);
  }
  return missing;
}

async function listFiles(dir) {
  const info = await stat(dir).catch(() => null);
  if (!info?.isDirectory()) return [];
  const names = await readdir(dir);
  const out = [];
  for (const name of names) {
    if (name === ".gitkeep") continue;
    const abs = join(dir, name);
    const st = await stat(abs).catch(() => null);
    if (st?.isFile()) out.push({ name, abs });
  }
  return out;
}

function finding(code, fix, fields) {
  return { code, fix, severity: fields.severity ?? "error", ...fields };
}

function resolveLocal(fromFile, href) {
  const trimmed = href.split("#")[0].split("?")[0];
  if (!trimmed) return null;
  return resolve(dirname(fromFile), decodeURIComponent(trimmed));
}

function isHttp(href) {
  return /^https?:\/\//i.test(href) || href.startsWith("//");
}

function httpUrl(href) {
  return href.startsWith("//") ? `https:${href}` : href;
}

function skipHttpUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SKIP_HTTP_HOSTS.has(host);
  } catch {
    return true;
  }
}

async function checkEngineeringStructure(root, engAbs, findings) {
  const info = await stat(engAbs).catch(() => null);
  if (!info?.isDirectory()) return;

  const maintAbs = join(engAbs, "MAINTENANCE.md");
  const maintInfo = await stat(maintAbs).catch(() => null);
  if (!maintInfo?.isFile()) {
    findings.push(
      finding("MAINT-MISSING", "safe", {
        path: "docs/engineering/MAINTENANCE.md",
        severity: "warning",
        message: "缺少 docs/engineering/MAINTENANCE.md 工程文档维护器公约",
        suggest: "运行 docs-init 自动补齐 MAINTENANCE.md",
      }),
    );
  }

  const entries = await readdir(engAbs, { withFileTypes: true });
  for (const ent of entries) {
    const abs = join(engAbs, ent.name);
    const path = toPosix(root, abs);
    if (ent.isFile()) {
      if (ent.name === "MAINTENANCE.md" || ent.name === ".gitkeep") continue;
      findings.push(
        finding("LOC-WRONG", "ask", {
          path,
          message: `工程文档落在 engineering/ 根下，应进入 ${ENG_STAGES.join("/")} 之一`,
          suggest: "搬进对应模式目录并按该目录序列取号",
        }),
      );
    } else if (ent.isDirectory() && !ENG_STAGES.includes(ent.name)) {
      findings.push(
        finding("LOC-WRONG", "ask", {
          path,
          message: `engineering/ 下出现未登记或已废弃的目录 ${ent.name}/`,
          suggest: `只允许 ${ENG_STAGES.join("、")}（draft/rfc/adr 已收敛为内部阶段状态，计划请放顶层 plan/）`,
        }),
      );
    }
  }
}

async function checkPlanStructure(root, planAbs, findings) {
  const info = await stat(planAbs).catch(() => null);
  if (!info?.isDirectory()) return;
  const entries = await readdir(planAbs, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (ent.name === "archive") continue;
    const abs = join(planAbs, ent.name);
    findings.push(
      finding("LOC-WRONG", "ask", {
        path: toPosix(root, abs),
        stage: "plan",
        message: `plan/ 下出现未登记子目录 ${ent.name}/（活动计划应直接平铺在 plan/ 根下）`,
        suggest: "活动计划平铺于 plan/，已完结计划放入 plan/archive/",
      }),
    );
  }
}

function registerDocFile(root, stage, name, abs, vocab, findings, extra = {}) {
  const path = toPosix(root, abs);
  if (extname(name) !== ".md") {
    findings.push(
      finding("LOC-WRONG", "ask", {
        path,
        stage,
        message: `${stage} 目录里出现非 Markdown 文件`,
        suggest: "受控文档只放 .md；其它文件移出",
      }),
    );
    return null;
  }
  const parsed = name.match(FILE_RE);
  if (!parsed) {
    findings.push(
      finding("NAME-FORMAT", "ask", {
        path,
        stage,
        message: `文件名不符合 NNNN-<scope>-<title>.md：${name}`,
        suggest: "scope 取词表英文单词，title 为 kebab-case",
      }),
    );
    return {
      stage,
      abs,
      path,
      name,
      number: null,
      scope: null,
      title: null,
      ...extra,
    };
  }
  const number = parsed[1];
  const scope = parsed[2];
  const title = parsed[3];
  if (vocab.size > 0 && !vocab.has(scope)) {
    findings.push(
      finding("SCOPE-UNKNOWN", "ask", {
        path,
        stage,
        message: `scope「${scope}」不在 docs/scope-manage.md 词表`,
        suggest: "改用词表英文列，或先登记新业务域再改名",
      }),
    );
  }
  return {
    stage,
    abs,
    path,
    name,
    number,
    n: Number(number),
    scope,
    title,
    ...extra,
  };
}

async function collectStageFiles(root, docsAbs, planAbs, vocab, findings) {
  const files = [];
  for (const stage of ENG_STAGES) {
    const dir = join(docsAbs, "engineering", stage);
    const entries = await listFiles(dir);
    for (const { name, abs } of entries) {
      const item = registerDocFile(root, stage, name, abs, vocab, findings, {
        archived: false,
      });
      if (item) files.push(item);
    }
  }

  const planInfo = await stat(planAbs).catch(() => null);
  if (planInfo?.isDirectory()) {
    const activeEntries = await listFiles(planAbs);
    for (const { name, abs } of activeEntries) {
      if (name === "README.md") continue;
      const item = registerDocFile(root, "plan", name, abs, vocab, findings, {
        archived: false,
      });
      if (item) files.push(item);
    }
    const archiveEntries = await listFiles(join(planAbs, "archive"));
    for (const { name, abs } of archiveEntries) {
      const item = registerDocFile(root, "plan", name, abs, vocab, findings, {
        archived: true,
      });
      if (item) files.push(item);
    }
  }

  return files;
}

async function collectMisplaced(root, docsAbs, findings) {
  const top = await listFiles(docsAbs);
  for (const { name, abs } of top) {
    if (!/^\d{4}-/.test(name) || extname(name) !== ".md") continue;
    findings.push(
      finding("LOC-WRONG", "ask", {
        path: toPosix(root, abs),
        message: `编号文档落在 docs/ 根：${name}`,
        suggest:
          "搬进 docs/engineering/<模式>/ 或顶层 plan/，docs/ 根只留 README 与词表",
      }),
    );
  }
}

function checkNumbers(files, findings) {
  const byStage = new Map();
  for (const f of files) {
    if (f.n == null) continue;
    if (!byStage.has(f.stage)) byStage.set(f.stage, []);
    byStage.get(f.stage).push(f);
  }
  for (const [stage, list] of byStage) {
    const stagePath = stage === "plan" ? "plan/" : `docs/engineering/${stage}/`;
    const byNum = new Map();
    for (const f of list) {
      if (!byNum.has(f.n)) byNum.set(f.n, []);
      byNum.get(f.n).push(f);
    }
    for (const [n, group] of byNum) {
      if (group.length < 2) continue;
      findings.push(
        finding("NUM-DUP", "ask", {
          stage,
          path: stagePath,
          message: `${stage} 模式编号 ${pad4(n)} 重复：${group.map((g) => g.path).join("、")}`,
          suggest:
            "同模式（含 plan/ 与 plan/archive/）不复用旧号；留下一篇，其余另取新号并改承接链接",
        }),
      );
    }
    const nums = [...byNum.keys()].sort((a, b) => a - b);
    const missing = gapsIn(nums);
    if (missing.length === 0) continue;
    const min = nums[0];
    const looksLikeCross = min > 1 && list.length === nums.length;
    findings.push(
      finding("NUM-GAP", "ask", {
        stage,
        path: stagePath,
        message: looksLikeCross
          ? `${stagePath} 现有最小号 ${pad4(min)}，缺 ${missing.map(pad4).join("、")}。序列应从 0001 起；从 ${pad4(min)} 起通常是误把其它模式的序列续过来了`
          : `${stagePath} 编号空洞：缺 ${missing.map(pad4).join("、")}`,
        suggest: "重编号是危险修复，列出对照表等确认后再改文件名和全仓链接",
      }),
    );
  }
}

async function checkLinks(root, files, findings) {
  const byBase = new Map();
  for (const f of files) {
    if (!byBase.has(f.name)) byBase.set(f.name, []);
    byBase.get(f.name).push(f);
  }

  for (const f of files) {
    const md = await loadText(f.abs);
    if (md == null) continue;
    f.md = md;
    const body = stripIgnored(md);
    for (const link of extractLinks(body)) {
      if (!link.href || link.href === "#" || /^\s*$/.test(link.href)) {
        findings.push(
          finding("LINK-EMPTY", "report", {
            path: f.path,
            stage: f.stage,
            message: `空引用：[${link.text}](${link.href})`,
            suggest: "补上目标路径，或删掉这条链接",
          }),
        );
        continue;
      }
      if (/^(mailto:|data:)/i.test(link.href)) continue;
      if (isHttp(link.href)) continue;
      const resolved = resolveLocal(f.abs, link.href);
      if (!resolved) continue;
      const st = await stat(resolved).catch(() => null);
      if (st?.isFile() || st?.isDirectory()) continue;
      const base = resolved.split("/").pop();
      const candidates = byBase.get(base) ?? [];
      const unique = candidates.length === 1;
      findings.push(
        finding("LINK-BROKEN", unique ? "safe" : "report", {
          path: f.path,
          stage: f.stage,
          message: `相对链接打空：[${link.text}](${link.href})`,
          suggest: unique
            ? `改成指向 ${candidates[0].path}`
            : "目标文件不存在，也没有唯一同名文件可改",
          target: unique ? candidates[0].path : undefined,
          href: link.href,
        }),
      );
    }

    const bare = [
      ...body.matchAll(/承接[：:]?\s+(?:\[(\d{4})\](?!\()|(\d{4})(?![\d\]]))/g),
    ];
    for (const m of bare) {
      const num = m[1] ?? m[2];
      findings.push(
        finding("LINK-EMPTY", "report", {
          path: f.path,
          stage: f.stage,
          message: `承接 ${num} 不是可点击链接`,
          suggest: "写成 承接 [NNNN](相对路径)",
        }),
      );
    }
  }
}

function parseDocIndexLinks(root, indexAbs, indexMd, filterRe) {
  const entries = [];
  if (!indexMd) return entries;
  for (const link of extractLinks(stripIgnored(indexMd))) {
    if (!link.href || isHttp(link.href)) continue;
    if (!filterRe.test(link.href)) continue;
    if (!/\.md(?:$|#)/i.test(link.href)) continue;
    const abs = resolveLocal(indexAbs, link.href);
    if (!abs) continue;
    if (abs.endsWith("/MAINTENANCE.md") || abs.endsWith("/README.md")) continue;
    entries.push({
      text: link.text,
      href: link.href,
      abs,
      path: toPosix(root, abs),
    });
  }
  return entries;
}

async function checkIndex(
  root,
  docsAbs,
  planAbs,
  files,
  readmeMd,
  planReadmeMd,
  findings,
) {
  const readmePath = "docs/README.md";
  const engFiles = files.filter((f) => f.stage !== "plan");
  if (readmeMd == null) {
    findings.push(
      finding("INDEX-MISSING", "safe", {
        path: readmePath,
        severity: "warning",
        message: "没有 docs/README.md，工程文档未登记",
        suggest: "先跑 docs-init 生成最小索引，再补各模式台账",
      }),
    );
  } else {
    const readmeAbs = join(docsAbs, "README.md");
    const indexed = parseDocIndexLinks(
      root,
      readmeAbs,
      readmeMd,
      /engineering\//,
    );
    const indexedAbs = new Set();

    for (const entry of indexed) {
      indexedAbs.add(entry.abs);
      const st = await stat(entry.abs).catch(() => null);
      if (st?.isFile()) continue;
      const base = entry.abs.split("/").pop();
      const candidates = engFiles.filter((f) => f.name === base);
      const unique = candidates.length === 1;
      findings.push(
        finding("INDEX-STALE", "safe", {
          path: readmePath,
          message: `索引指向不存在的文件：${entry.href}`,
          suggest: unique ? `改成 ${candidates[0].path}` : "删掉这一行",
          target: unique ? candidates[0].path : undefined,
          href: entry.href,
        }),
      );
    }

    for (const f of engFiles) {
      if (indexedAbs.has(f.abs)) continue;
      findings.push(
        finding("INDEX-MISSING", "safe", {
          path: f.path,
          stage: f.stage,
          message: `${f.path} 未在 docs/README.md 登记`,
          suggest: `在 docs/README.md 的「${f.stage}」模式分表下补一行链接`,
        }),
      );
    }
  }

  const planFiles = files.filter((f) => f.stage === "plan");
  const planDirInfo = await stat(planAbs).catch(() => null);
  if (!planDirInfo?.isDirectory()) return;

  const planReadmePath = "plan/README.md";
  if (planReadmeMd == null) {
    if (planFiles.length > 0) {
      findings.push(
        finding("INDEX-MISSING", "safe", {
          path: planReadmePath,
          severity: "warning",
          message: "没有 plan/README.md，实施计划未登记",
          suggest: "运行 docs-init 生成 plan/README.md 并登记计划",
        }),
      );
    }
    return;
  }

  const planReadmeAbs = join(planAbs, "README.md");
  const planIndexed = parseDocIndexLinks(
    root,
    planReadmeAbs,
    planReadmeMd,
    /(?:^|\/|\.)\d{4}-/,
  );
  const planIndexedAbs = new Set();

  for (const entry of planIndexed) {
    planIndexedAbs.add(entry.abs);
    const st = await stat(entry.abs).catch(() => null);
    if (st?.isFile()) continue;
    const base = entry.abs.split("/").pop();
    const candidates = planFiles.filter((f) => f.name === base);
    const unique = candidates.length === 1;
    findings.push(
      finding("INDEX-STALE", "safe", {
        path: planReadmePath,
        stage: "plan",
        message: `plan/README.md 索引指向不存在的文件：${entry.href}`,
        suggest: unique ? `改成指向 ${candidates[0].path}` : "删掉这一行",
        target: unique ? candidates[0].path : undefined,
        href: entry.href,
      }),
    );
  }

  for (const f of planFiles) {
    if (planIndexedAbs.has(f.abs)) continue;
    findings.push(
      finding("INDEX-MISSING", "safe", {
        path: f.path,
        stage: "plan",
        message: `${f.path} 未在 plan/README.md 登记`,
        suggest: f.archived
          ? "在 plan/README.md 的「已归档计划」表补一行链接"
          : "在 plan/README.md 的「进行中计划」表补一行链接",
      }),
    );
  }
}

function defaultStatusFor(stage, allowed) {
  const list = allowed[stage];
  if (!list || list.length === 0) return null;
  return list[0];
}

function checkStatusAndLocation(files, allowed, findings) {
  for (const f of files) {
    if (!f.md) continue;
    const status = parseStatus(f.md);
    const legal = allowed[f.stage];
    if (legal == null) continue;
    if (legal.length === 0) {
      if (status) {
        findings.push(
          finding("STATUS-ILLEGAL", "report", {
            path: f.path,
            stage: f.stage,
            message: `${f.stage} 不应有状态字段，文首却写了「${status}」`,
            suggest: "research 是直接结果，只记调研日期；删掉状态字段",
          }),
        );
      }
      continue;
    }
    if (!status) {
      findings.push(
        finding("STATUS-ILLEGAL", "safe", {
          path: f.path,
          stage: f.stage,
          message: `${f.stage} 文首缺少状态字段`,
          suggest: `补「状态：${defaultStatusFor(f.stage, allowed)}」`,
          target: defaultStatusFor(f.stage, allowed),
        }),
      );
      continue;
    }
    if (!legal.includes(status)) {
      const mapped = defaultStatusFor(f.stage, allowed);
      const canMap = Boolean(LEGACY_INITIAL_STATUS.has(status) && mapped);
      findings.push(
        finding("STATUS-ILLEGAL", canMap ? "safe" : "report", {
          path: f.path,
          stage: f.stage,
          message: `${f.stage} 的状态「${status}」不在合法集（${legal.join(" / ")}）`,
          suggest: canMap
            ? `改成本模式默认初始态 ${mapped}`
            : "按 lifecycle.md 改成合法阶段值，不要擅自升为 adr / active / done",
          target: canMap ? mapped : undefined,
        }),
      );
      continue;
    }

    if (f.stage === "plan") {
      if (!f.archived && PLAN_ARCHIVE_STATUS.has(status)) {
        findings.push(
          finding("LOC-WRONG", "ask", {
            path: f.path,
            stage: "plan",
            message: `计划状态已为终态「${status}」，但文件仍平铺在 plan/ 根下`,
            suggest: `移入 plan/archive/${f.name} 并更新 plan/README.md`,
            target: `plan/archive/${f.name}`,
          }),
        );
      } else if (f.archived && PLAN_ACTIVE_STATUS.has(status)) {
        findings.push(
          finding("LOC-WRONG", "ask", {
            path: f.path,
            stage: "plan",
            message: `计划状态为活动态「${status}」，却放在归档目录 plan/archive/ 中`,
            suggest: `移回 plan/${f.name} 或将状态更新为终态（done / cancelled / superseded）`,
            target: `plan/${f.name}`,
          }),
        );
      }
    }
  }
}

function checkGenre(files, findings) {
  for (const f of files) {
    if (!f.md) continue;
    const scores = scoreGenre(h2Exact(f.md));
    const own = scores[f.stage] ?? 0;
    let best = f.stage;
    let bestScore = own;
    for (const [stage, score] of Object.entries(scores)) {
      if (score > bestScore) {
        best = stage;
        bestScore = score;
      }
    }
    const needed = GENRE_MARKERS[best]?.length ?? 0;
    if (best === f.stage) continue;
    if (bestScore < 2 || bestScore < needed) continue;
    if (bestScore <= own) continue;
    findings.push(
      finding("STAGE-MISMATCH", "report", {
        path: f.path,
        stage: f.stage,
        message: `文件在 ${f.stage} 模式，但二级标题更像 ${best}（命中 ${bestScore} 个 ${best} 骨架标题）`,
        suggest: "只报不搬；确认后由人决定是改正文骨架还是搬移模式目录",
      }),
    );
  }
}

function checkSupersede(files, findings) {
  const byAbs = new Map(files.filter((f) => f.md).map((f) => [f.abs, f]));
  for (const f of files) {
    if (!f.md) continue;
    const status = parseStatus(f.md);
    if (status !== "superseded") continue;
    const header = stripIgnored(f.md.slice(0, 1200));
    const locals = extractLinks(header).filter(
      (l) => l.href && !isHttp(l.href) && l.href !== "#",
    );
    if (locals.length === 0) {
      findings.push(
        finding("SUPERSEDE-ONEWAY", "report", {
          path: f.path,
          stage: f.stage,
          message: "状态为 superseded 但文首没有指向后继文档的链接",
          suggest: "superseded 必须在文首链接取代它的新文档",
        }),
      );
      continue;
    }
    for (const link of locals) {
      const abs = resolveLocal(f.abs, link.href);
      const target = abs ? byAbs.get(abs) : null;
      if (!target?.md) continue;
      const mentioned =
        target.md.includes(f.name) ||
        (f.number != null && target.md.includes(f.number));
      if (mentioned) continue;
      const hasQuote = /^>/m.test(target.md.slice(0, 400));
      findings.push(
        finding("SUPERSEDE-ONEWAY", hasQuote ? "safe" : "report", {
          path: f.path,
          stage: f.stage,
          message: `${f.path} 标了 superseded 并指向 ${target.path}，但对方没有回指`,
          suggest: hasQuote
            ? `在 ${target.path} 文首 blockquote 补上承接链接`
            : `在 ${target.path} 文首注明承接 ${f.number ?? f.name}`,
          target: target.path,
        }),
      );
    }
  }
}

async function checkHttpLinks(files, readmeMd, planReadmeMd, findings) {
  const seen = new Map();
  const addUrl = (url, path) => {
    if (skipHttpUrl(url)) return;
    if (!seen.has(url)) seen.set(url, []);
    seen.get(url).push(path);
  };

  for (const f of files) {
    if (!f.md) continue;
    for (const link of extractLinks(stripIgnored(f.md))) {
      if (isHttp(link.href)) addUrl(httpUrl(link.href), f.path);
    }
  }
  if (readmeMd) {
    for (const link of extractLinks(stripIgnored(readmeMd))) {
      if (isHttp(link.href)) addUrl(httpUrl(link.href), "docs/README.md");
    }
  }
  if (planReadmeMd) {
    for (const link of extractLinks(stripIgnored(planReadmeMd))) {
      if (isHttp(link.href)) addUrl(httpUrl(link.href), "plan/README.md");
    }
  }

  const urls = [...seen.keys()];
  let i = 0;
  const workers = Array.from({ length: Math.min(5, urls.length) }, async () => {
    while (i < urls.length) {
      const url = urls[i++];
      const status = await ping(url);
      const paths = seen.get(url);
      if (status === 404 || status === 410) {
        findings.push(
          finding("LINK-HTTP-404", "report", {
            path: paths[0],
            message: `外链 ${status}：${url}`,
            suggest: "换新地址或改成仓库内相对路径",
            href: url,
          }),
        );
      } else if (typeof status === "string") {
        findings.push(
          finding("LINK-HTTP-404", "report", {
            severity: "warning",
            path: paths[0],
            message: `外链未能确认（${status}）：${url}`,
            suggest: "网络失败不代表链接已死，复查后再改",
            href: url,
          }),
        );
      }
    }
  });
  await Promise.all(workers);
}

async function pingOnce(url, method) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": "doc-clean (engineering-design)" },
    });
    return res.status;
  } catch (err) {
    return err?.name === "AbortError" ? "timeout" : "network";
  } finally {
    clearTimeout(timer);
  }
}

async function ping(url) {
  const head = await pingOnce(url, "HEAD");
  if (
    head === 405 ||
    head === 501 ||
    head === "timeout" ||
    head === "network"
  ) {
    return pingOnce(url, "GET");
  }
  return head;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    console.error(`错误：${args.error}`);
    exit(1);
  }
  if (args.help) {
    console.error("用法：node scan_docs.mjs [项目根目录] [--skip-http]");
    exit(0);
  }

  const root = resolve(args.root);
  const rootInfo = await stat(root).catch(() => null);
  if (!rootInfo?.isDirectory()) {
    console.error(`错误：${root} 不是有效目录`);
    exit(1);
  }

  const docsAbs = join(root, "docs");
  const planAbs = join(root, "plan");
  const findings = [];
  const docsInfo = await stat(docsAbs).catch(() => null);
  if (!docsInfo?.isDirectory()) {
    const report = {
      root,
      skipHttp: args.skipHttp,
      files: [],
      findings: [
        finding("LOC-WRONG", "ask", {
          path: "docs/",
          message: "没有 docs/ 目录",
          suggest: "先跑 docs-init",
        }),
      ],
      summary: { error: 1, warning: 0, safe: 0, ask: 1, report: 0 },
    };
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const vocab = parseVocab(await loadText(join(docsAbs, "scope-manage.md")));
  if (vocab.size === 0) {
    findings.push(
      finding("SCOPE-UNKNOWN", "report", {
        severity: "warning",
        path: "docs/scope-manage.md",
        message: "没有词表或未能解析英文单词列，跳过 scope 校验",
        suggest: "用 docs-init 补骨架并登记词表后再扫",
      }),
    );
  }

  const allowed = parseAllowedStatus(await loadText(lifecyclePath));
  await checkEngineeringStructure(root, join(docsAbs, "engineering"), findings);
  await checkPlanStructure(root, planAbs, findings);
  await collectMisplaced(root, docsAbs, findings);
  const files = await collectStageFiles(
    root,
    docsAbs,
    planAbs,
    vocab,
    findings,
  );
  checkNumbers(files, findings);
  await checkLinks(root, files, findings);
  const readmeMd = await loadText(join(docsAbs, "README.md"));
  const planReadmeMd = await loadText(join(planAbs, "README.md"));
  await checkIndex(
    root,
    docsAbs,
    planAbs,
    files,
    readmeMd,
    planReadmeMd,
    findings,
  );
  checkStatusAndLocation(files, allowed, findings);
  checkGenre(files, findings);
  checkSupersede(files, findings);
  if (!args.skipHttp)
    await checkHttpLinks(files, readmeMd, planReadmeMd, findings);

  const summary = { error: 0, warning: 0, safe: 0, ask: 0, report: 0 };
  for (const item of findings) {
    summary[item.severity] = (summary[item.severity] ?? 0) + 1;
    summary[item.fix] = (summary[item.fix] ?? 0) + 1;
  }

  const report = {
    root,
    skipHttp: args.skipHttp,
    files: files.map((f) => ({
      path: f.path,
      stage: f.stage,
      archived: f.archived ?? false,
      number: f.number,
      scope: f.scope,
      title: f.title,
    })),
    findings,
    summary,
  };
  console.log(JSON.stringify(report, null, 2));
}

await main();
