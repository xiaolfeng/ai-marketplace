#!/usr/bin/env node

/**
 * report-nav.json 同步工具
 *
 * 把合集导航 report-nav.json 的全文作为快照注入所有成员页面的 #report-nav-data 槽位，
 * 并按页面位置回填 data-src（相对 JSON 的路径）。JSON 是唯一编辑源，页面快照由本脚本生成，
 * 避免每篇报告手抄一份导航导致的漂移。
 *
 * 用法:
 *     node sync-nav.mjs <report-nav.json> [--check]
 *
 * 选项:
 *     --check    只校验不写入：JSON 结构、层级、成员文件存在性、快照是否与 JSON 一致
 *
 * 示例:
 *     node sync-nav.mjs reports/report-nav.json
 *     node sync-nav.mjs reports/report-nav.json --check
 */

import fs from "node:fs";
import path from "node:path";

function parseArgs(args) {
  const result = { navPath: "", check: false, help: false };
  for (const arg of args) {
    if (arg === "--check") result.check = true;
    else if (arg === "-h" || arg === "--help") result.help = true;
    else if (!arg.startsWith("--")) result.navPath = arg;
    else {
      console.error(`未知选项: ${arg}`);
      process.exit(1);
    }
  }
  return result;
}

function help() {
  console.log(
    [
      "用法: node sync-nav.mjs <report-nav.json> [--check]",
      "",
      "  <report-nav.json>  合集导航 JSON 路径（结构见 references/report-nav.md）",
      "  --check            只校验不写入，发现漂移以退出码 1 结束",
      "",
      "示例:",
      "  node sync-nav.mjs reports/report-nav.json",
      "  node sync-nav.mjs reports/report-nav.json --check",
    ].join("\n"),
  );
}

/** 结构校验：顶层字段 + 最高两级层级，返回按文档顺序展开的成员条目 */
function validateNav(data, navDir) {
  const errors = [];
  const entries = [];
  const seen = new Map();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { errors: ["顶层必须是 JSON 对象"], entries };
  }
  if ("name" in data && typeof data.name !== "string")
    errors.push("顶层 name 必须是字符串");
  if ("updated" in data && typeof data.updated !== "string")
    errors.push("顶层 updated 必须是字符串");

  const collectItems = (items, where) => {
    if (!Array.isArray(items)) {
      errors.push(`${where}: items 必须是数组`);
      return;
    }
    for (const [index, item] of items.entries()) {
      const at = `${where} 的第 ${index + 1} 个条目`;
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`${at}: 必须是对象`);
        continue;
      }
      if ("items" in item) {
        errors.push(`${at}: 层级超过两级，条目内不允许再嵌套 items`);
        continue;
      }
      if (typeof item.file !== "string" || !item.file.trim()) {
        errors.push(`${at}: 缺少必填 file`);
        continue;
      }
      if (typeof item.title !== "string" || !item.title.trim()) {
        errors.push(`${at}: 缺少必填 title`);
        continue;
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(item.file) || item.file.startsWith("/")) {
        errors.push(`${at}: file 只能写相对路径（${item.file}）`);
        continue;
      }
      const file = item.file.replace(/\\/g, "/").replace(/^\.\//, "");
      if (seen.has(file)) errors.push(`${at}: file 重复出现（${file}）`);
      else seen.set(file, at);
      entries.push({ ...item, file });
    }
  };

  if ("groups" in data) {
    if (!Array.isArray(data.groups)) {
      errors.push("顶层 groups 必须是数组");
    } else {
      for (const [index, group] of data.groups.entries()) {
        const where = `groups 第 ${index + 1} 组`;
        if (!group || typeof group !== "object" || Array.isArray(group)) {
          errors.push(`${where}: 必须是对象`);
          continue;
        }
        if ("label" in group && typeof group.label !== "string")
          errors.push(`${where}: label 必须是字符串`);
        collectItems(group.items, where);
      }
    }
  } else if ("items" in data) {
    collectItems(data.items, "顶层 items");
  } else {
    errors.push("顶层必须有 groups（分组）或 items（平铺）之一");
  }

  for (const entry of entries) {
    const target = path.resolve(navDir, entry.file);
    if (!fs.existsSync(target))
      errors.push(
        `成员文件不存在: ${entry.file}（${path.relative(process.cwd(), target)}）`,
      );
    else if (!/\.html?$/i.test(entry.file))
      console.warn(`提示: ${entry.file} 不是 HTML 文件，仍会照常写入导航`);
  }

  return { errors, entries };
}

/** 稳定序列化（键排序）用于快照一致性比较，避免纯格式差异误报漂移 */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** 生成与模板格式一致的快照块（属性逐行、正文按 JSON 缩进两格） */
function buildSlotBlock(data, dataSrc) {
  const json = JSON.stringify(data, null, 2)
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");
  return [
    "    <script",
    '      type="application/json"',
    '      id="report-nav-data"',
    `      data-src="${dataSrc}"`,
    "    >",
    json,
    "    </script>",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.navPath) {
    help();
    process.exit(args.help ? 0 : 1);
  }

  const navPath = path.resolve(process.cwd(), args.navPath);
  if (!fs.existsSync(navPath)) {
    console.error(`导航文件不存在: ${navPath}`);
    process.exit(1);
  }
  const navDir = path.dirname(navPath);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(navPath, "utf8"));
  } catch (error) {
    console.error(`report-nav.json 解析失败: ${error.message}`);
    process.exit(1);
  }

  const { errors, entries } = validateNav(data, navDir);
  if (errors.length) {
    for (const error of errors) console.error(`校验失败: ${error}`);
    console.error(
      `共 ${errors.length} 处问题，未${args.check ? "校验通过" : "写入"}任何页面`,
    );
    process.exit(1);
  }

  console.log(
    `导航 «${data.name || path.basename(navPath)}» 共 ${entries.length} 篇，${args.check ? "校验模式" : "同步模式"}`,
  );

  const slotPattern =
    /[ \t]*<script\b[^>]*\bid="report-nav-data"[^>]*>[\s\S]*?<\/script>/;
  let failures = 0;
  let synced = 0;
  let drifted = 0;

  for (const entry of entries) {
    const htmlPath = path.resolve(navDir, entry.file);
    const html = fs.readFileSync(htmlPath, "utf8");
    const match = html.match(slotPattern);
    if (!match) {
      console.error(
        `✗ ${entry.file}: 找不到 #report-nav-data 槽位，页面需来自 template.html`,
      );
      failures += 1;
      continue;
    }

    let slotData = null;
    try {
      slotData = JSON.parse(
        match[0]
          .replace(/^[^>]*>/, "")
          .replace(/<\/script>[\s\S]*$/, "")
          .trim() || "{}",
      );
    } catch {
      slotData = null;
    }
    const dataSrc = path
      .relative(path.dirname(htmlPath), navPath)
      .split(path.sep)
      .join("/");
    const inSync =
      slotData !== null &&
      stableStringify(slotData) === stableStringify(data) &&
      new RegExp(
        `data-src="${dataSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      ).test(match[0]);

    if (inSync) {
      console.log(`= ${entry.file}: 快照一致`);
      continue;
    }

    drifted += 1;
    if (args.check) {
      console.error(
        `✗ ${entry.file}: 快照与 report-nav.json 不一致（或 data-src 落后）`,
      );
      continue;
    }

    fs.writeFileSync(
      htmlPath,
      html.replace(slotPattern, buildSlotBlock(data, dataSrc)),
    );
    synced += 1;
    console.log(`✓ ${entry.file}: 已注入快照，data-src="${dataSrc}"`);
  }

  if (args.check) {
    if (drifted > 0 || failures > 0) {
      console.error(
        `\n校验未通过：${failures} 处缺槽位，${drifted} 处快照漂移`,
      );
      process.exit(1);
    }
    console.log("\n校验通过：所有成员页快照与 report-nav.json 一致");
    return;
  }

  if (failures > 0) {
    console.error(
      `\n同步未完成：${failures} 个页面缺少槽位，其余 ${synced} 个已写入`,
    );
    process.exit(1);
  }
  console.log(`\n同步完成：${synced} 个页面已更新`);
}

main();
