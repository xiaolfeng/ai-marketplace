#!/usr/bin/env node
/**
 * 扫描 docs/engineering/ 与 docs/README.md 的文档卫生问题（只读）。
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

const STAGES = ["draft", "research", "rfc", "design", "adr"];
const FILE_RE = /^(\d{4})-([a-z][a-z0-9]*)-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const SKIP_HTTP_HOSTS = new Set(["localhost", "127.0.0.1", "example.com", "example.org"]);
const GENRE_MARKERS = {
  draft: ["初步想法", "缺什么"],
  research: ["发现", "结论"],
  rfc: ["不做什么", "备选", "待定"],
  adr: ["决定", "否决项"],
};
const STATUS_CROSS_DEFAULT = {
  open: "draft",
  draft: "rfc",
  proposed: "adr",
};

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
  if (positionals.length > 1) return { error: "最多接受一个位置参数（项目根目录）" };
  return { root: positionals[0] ?? ".", skipHttp: flags.has("skipHttp"), help: flags.has("help") };
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
    const m = line.match(/\| `([a-z][a-z0-9-]*)` \|/);
    if (m) vocab.add(m[1]);
  }
  return vocab;
}

function parseAllowedStatus(md) {
  const allowed = {};
  if (!md) return allowed;
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*(draft|research|rfc|adr)\s*\|([^|]+)\|/);
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

async function walkUnknown(root, engAbs, findings) {
  const info = await stat(engAbs).catch(() => null);
  if (!info?.isDirectory()) return;
  const entries = await readdir(engAbs, { withFileTypes: true });
  for (const ent of entries) {
    const abs = join(engAbs, ent.name);
    const path = toPosix(root, abs);
    if (ent.isFile() && extname(ent.name) === ".md") {
      findings.push(
        finding("LOC-WRONG", "ask", {
          path,
          message: `工程文档落在 engineering/ 根下，应进入 ${STAGES.join("/")} 之一`,
          suggest: "搬进对应阶段目录并按该目录序列取号",
        }),
      );
    } else if (ent.isDirectory() && !STAGES.includes(ent.name) && ent.name !== ".gitkeep") {
      findings.push(
        finding("LOC-WRONG", "ask", {
          path,
          message: `engineering/ 下出现未登记的阶段目录 ${ent.name}/`,
          suggest: `只允许 ${STAGES.join("、")}`,
        }),
      );
    }
  }
}

async function collectStageFiles(root, docsAbs, vocab, findings) {
  const files = [];
  for (const stage of STAGES) {
    const dir = join(docsAbs, "engineering", stage);
    const entries = await listFiles(dir);
    for (const { name, abs } of entries) {
      const path = toPosix(root, abs);
      if (extname(name) !== ".md") {
        findings.push(
          finding("LOC-WRONG", "ask", {
            path,
            stage,
            message: `${stage}/ 里出现非 Markdown 文件`,
            suggest: "工程文档只放 .md；其它文件移出",
          }),
        );
        continue;
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
        files.push({ stage, abs, path, name, number: null, scope: null, title: null });
        continue;
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
      files.push({
        stage,
        abs,
        path,
        name,
        number,
        n: Number(number),
        scope,
        title,
      });
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
        suggest: "搬进 docs/engineering/<阶段>/，根目录只留 README / 词表 / 上架规范",
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
          path: `docs/engineering/${stage}/`,
          message: `${stage}/ 编号 ${pad4(n)} 重复：${group.map((g) => g.name).join("、")}`,
          suggest: "同目录不复用旧号；留下一篇，其余在该目录内另取新号并改承接链接",
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
        path: `docs/engineering/${stage}/`,
        message: looksLikeCross
          ? `${stage}/ 现有最小号 ${pad4(min)}，缺 ${missing.map(pad4).join("、")}。空目录应从 0001 起；从 ${pad4(min)} 起通常是误把其它阶段的序列续过来了`
          : `${stage}/ 编号空洞：缺 ${missing.map(pad4).join("、")}`,
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

    const bare = [...body.matchAll(/承接\s+(?:\[(\d{4})\](?!\()|(\d{4})(?![\d\]]))/g)];
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

function parseIndexLinks(root, docsAbs, readmeMd) {
  const readmeAbs = join(docsAbs, "README.md");
  const entries = [];
  if (!readmeMd) return entries;
  for (const link of extractLinks(stripIgnored(readmeMd))) {
    if (!link.href || isHttp(link.href)) continue;
    if (!/engineering\//.test(link.href)) continue;
    if (!/\.md(?:$|#)/i.test(link.href)) continue;
    const abs = resolveLocal(readmeAbs, link.href);
    if (!abs) continue;
    entries.push({ text: link.text, href: link.href, abs, path: toPosix(root, abs) });
  }
  return entries;
}

async function checkIndex(root, docsAbs, files, readmeMd, findings) {
  const readmePath = "docs/README.md";
  if (readmeMd == null) {
    findings.push(
      finding("INDEX-MISSING", "safe", {
        path: readmePath,
        severity: "warning",
        message: "没有 docs/README.md，工程文档未登记",
        suggest: "先跑 docs-init 生成最小索引，再补内容清单",
      }),
    );
    return;
  }
  const indexed = parseIndexLinks(root, docsAbs, readmeMd);
  const indexedAbs = new Set();

  for (const entry of indexed) {
    indexedAbs.add(entry.abs);
    const st = await stat(entry.abs).catch(() => null);
    if (st?.isFile()) continue;
    const base = entry.abs.split("/").pop();
    const candidates = files.filter((f) => f.name === base);
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

  for (const f of files) {
    if (indexedAbs.has(f.abs)) continue;
    findings.push(
      finding("INDEX-MISSING", "safe", {
        path: f.path,
        stage: f.stage,
        message: `${f.path} 未在 docs/README.md 登记`,
        suggest: `在 README 的 ### ${f.stage}/ 下补一行链接`,
      }),
    );
  }
}

function defaultStatusFor(stage, allowed) {
  const list = allowed[stage];
  if (!list || list.length === 0) return null;
  return list[0];
}

function checkStatus(files, allowed, findings) {
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
            suggest: "research 只记调研日期；删掉状态字段",
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
    if (legal.includes(status)) continue;
    const home = STATUS_CROSS_DEFAULT[status];
    const mapped = defaultStatusFor(f.stage, allowed);
    const canMap = Boolean(home && home !== f.stage && mapped);
    findings.push(
      finding("STATUS-ILLEGAL", canMap ? "safe" : "report", {
        path: f.path,
        stage: f.stage,
        message: `${f.stage} 的状态「${status}」不在合法集（${legal.join(" / ")}）`,
        suggest: canMap ? `改成本阶段默认值 ${mapped}` : "按 lifecycle.md 改成合法值，不要擅自写成 accepted",
        target: canMap ? mapped : undefined,
      }),
    );
  }
}

function checkGenre(files, findings) {
  for (const f of files) {
    if (!f.md || f.stage === "design") continue;
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
        message: `文件在 ${f.stage}/，但二级标题更像 ${best}（命中 ${bestScore} 个 ${best} 骨架标题）`,
        suggest: "只报不搬；确认后由人决定是改正文还是搬目录",
      }),
    );
  }
}

function checkSupersede(files, findings) {
  const byAbs = new Map(files.filter((f) => f.md).map((f) => [f.abs, f]));
  for (const f of files) {
    if (!f.md) continue;
    const status = parseStatus(f.md);
    if (status !== "superseded" && status !== "resolved") continue;
    const header = stripIgnored(f.md.slice(0, 1200));
    const locals = extractLinks(header).filter((l) => l.href && !isHttp(l.href) && l.href !== "#");
    if (locals.length === 0) {
      findings.push(
        finding("SUPERSEDE-ONEWAY", "report", {
          path: f.path,
          stage: f.stage,
          message: `状态 ${status} 但文首没有指向后继文档的链接`,
          suggest: status === "resolved"
            ? "draft 的 resolved 必须链接接手的 research / rfc"
            : "superseded 必须链接取代它的新文",
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
          message: `${f.path} 标了 ${status} 并指向 ${target.path}，但对方没有回指`,
          suggest: hasQuote
            ? `在 ${target.path} 文首 blockquote 补上承接链接`
            : `在 ${target.path} 文首注明承接 ${f.number ?? f.name}`,
          target: target.path,
        }),
      );
    }
  }
}

async function checkHttpLinks(files, readmeMd, findings) {
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
  if (head === 405 || head === 501 || head === "timeout" || head === "network") {
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
  await walkUnknown(root, join(docsAbs, "engineering"), findings);
  await collectMisplaced(root, docsAbs, findings);
  const files = await collectStageFiles(root, docsAbs, vocab, findings);
  checkNumbers(files, findings);
  await checkLinks(root, files, findings);
  const readmeMd = await loadText(join(docsAbs, "README.md"));
  await checkIndex(root, docsAbs, files, readmeMd, findings);
  checkStatus(files, allowed, findings);
  checkGenre(files, findings);
  checkSupersede(files, findings);
  if (!args.skipHttp) await checkHttpLinks(files, readmeMd, findings);

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
