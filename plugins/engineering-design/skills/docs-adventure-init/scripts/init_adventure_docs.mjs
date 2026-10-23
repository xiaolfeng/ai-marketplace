#!/usr/bin/env node
/**
 * 高级增量初始化：在 docs-init 基础结构之上扩展 docs/reader/ 与 docs/develop/。
 *
 * 执行逻辑：
 *   1. 检查目标项目是否已具备基础结构（docs/engineering/*、docs/plan/*、docs/README.md、MAINTENANCE.md）；
 *      若为空或有缺失，先调用 docs-init 的 ensureDocsTree 完成基础初始化；
 *   2. 增量创建 docs/reader/.gitkeep、docs/reader/README.md；
 *   3. 增量创建 docs/develop/.gitkeep、docs/develop/README.md；
 *   4. 幂等更新 docs/README.md 与 docs/engineering/MAINTENANCE.md，挂入 reader/ 与 develop/ 说明。
 *
 * 用法：
 *   node init_adventure_docs.mjs [项目根目录]
 */
import { readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { exit } from "node:process";
import { pathToFileURL } from "node:url";
import {
  ENG_SUBDIRS,
  ensureDirWithKeep,
  ensureDocsTree,
  ensureFileIfMissing,
} from "../../docs-init/scripts/init_docs.mjs";

export const READER_README_TEMPLATE = `# 直读视图与渲染中心（Reader）

本目录专门存放面向用户直接打开浏览的 \`.html\` 界面、报告特刊、交互复盘页与高级渲染图（如系统架构全景图、手绘白板流转图等）。

- **命名约定**：使用语义化 \`<kebab-case>.html\`（或 \`.svg\`），不设四位数字编号，不设过程状态；
- **维护要求**：新增或更新可视化文件后，在下方台账登记文件名、展示内容与关联的工程文档。

## 视图台账

| 文件 | 类型 | 说明 | 关联文档 / 来源 |
| --- | --- | --- | --- |
`;

export const DEVELOP_README_TEMPLATE = `# 工程备忘录（Develop）

本目录属于工程文档扩展区，专门用于 AI 保留有价值的工程信息记录（如模块内部机制脉络、深水区踩坑笔记、复杂调试链路、实现细节备忘等——即有长期参考价值、但不宜归入 \`docs/engineering/{research,design,spec,runbook}\` 四大受控模式的内容）。

- **无状态记录**：本目录文档**不需要保留记录状态**（严禁在文首写 \`状态：draft/rfc/adr\` 等过程状态字段），仅需在文首注明更新日期与涉及范围；
- **命名约定**：使用语义化 \`<kebab-case>.md\`，不强制四位数字编号，不纳入编号连续性检查。

## 备忘台账

| 文档 | 涉及模块 / Scope | 内容提要 | 更新日期 |
| --- | --- | --- | --- |
`;

const DOCS_README_NAV_ROWS = [
  `| **高级扩展模式**（\`docs/reader/\`） | [直读视图 \`./reader/README.md\`](./reader/README.md) | 面向用户直接浏览的 \`.html\` 界面、架构渲染图与交互报告 | 无状态（自由命名） |`,
  `| **高级扩展模式**（\`docs/develop/\`） | [工程备忘 \`./develop/README.md\`](./develop/README.md) | AI 留存的高价值工程脉络与机制记录（不便归入 \`engineering\` 的部分） | 无状态（不保留记录状态） |`,
];

const MAINTENANCE_ADVENTURE_SECTION = `
## 4. 高级扩展目录（\`docs/reader/\` 与 \`docs/develop/\`）

通过 \`docs-adventure-init\` 启用的两个高级目录遵循轻量自治规则：

1. **\`docs/reader/\`（直读视图）**：专门放置面向用户直接查看的 \`.html\` 页面或高级渲染图，采用 \`<kebab-case>.html\` 命名，不设四位编号与状态字段，在 [\`../reader/README.md\`](../reader/README.md) 登记；
2. **\`docs/develop/\`（工程备忘）**：属于工程文档，用于 AI 记录有留存价值但不宜放入 \`engineering\` 四模式的工程信息，**不需要保留记录状态**（禁止写 \`状态：...\`），采用 \`<kebab-case>.md\` 命名，在 [\`../develop/README.md\`](../develop/README.md) 登记。
`;

async function isBaseInitialized(root) {
  const requiredDirs = [
    ...ENG_SUBDIRS.map((d) => join(root, "docs", "engineering", d)),
    join(root, "docs", "plan", "archive"),
  ];
  const requiredFiles = [
    join(root, "docs", "README.md"),
    join(root, "docs", "engineering", "MAINTENANCE.md"),
    join(root, "docs", "plan", "README.md"),
  ];
  for (const d of requiredDirs) {
    const info = await stat(d).catch(() => null);
    if (!info?.isDirectory()) return false;
  }
  for (const f of requiredFiles) {
    const info = await stat(f).catch(() => null);
    if (!info?.isFile()) return false;
  }
  return true;
}

async function patchDocsReadme(readmePath, updated) {
  const content = await readFile(readmePath, "utf8").catch(() => null);
  if (!content) return;
  const missingRows = DOCS_README_NAV_ROWS.filter((row) => {
    const key = row.includes("./reader/README.md")
      ? "reader/README.md"
      : "develop/README.md";
    return !content.includes(key);
  });
  if (missingRows.length === 0) return;

  const lines = content.split("\n");
  let insertIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].startsWith("|") &&
      (lines[i].includes("engineering/") ||
        lines[i].includes("plan/README.md") ||
        lines[i].includes("scope-manage.md"))
    ) {
      insertIdx = i + 1;
    }
  }

  let nextContent;
  if (insertIdx !== -1) {
    lines.splice(insertIdx, 0, ...missingRows);
    nextContent = lines.join("\n");
  } else {
    nextContent =
      content.trimEnd() +
      "\n\n## 高级扩展入口\n\n" +
      "- [直读视图（`docs/reader/`）](./reader/README.md)\n" +
      "- [工程备忘（`docs/develop/`）](./develop/README.md)\n";
  }

  await writeFile(readmePath, nextContent, "utf8");
  updated.push(readmePath);
}

async function patchMaintenance(maintPath, updated) {
  const content = await readFile(maintPath, "utf8").catch(() => null);
  if (!content) return;
  if (content.includes("docs/reader/") && content.includes("docs/develop/")) {
    return;
  }
  const nextContent =
    content.trimEnd() + "\n" + MAINTENANCE_ADVENTURE_SECTION.trimStart();
  await writeFile(maintPath, nextContent, "utf8");
  updated.push(maintPath);
}

export async function ensureAdventureDocsTree(root) {
  const baseReady = await isBaseInitialized(root);
  const baseCreated = baseReady ? [] : await ensureDocsTree(root);

  const adventureCreated = [];
  const updated = [];

  await ensureDirWithKeep(join(root, "docs", "reader"), adventureCreated);
  await ensureFileIfMissing(
    join(root, "docs", "reader", "README.md"),
    READER_README_TEMPLATE,
    adventureCreated,
  );

  await ensureDirWithKeep(join(root, "docs", "develop"), adventureCreated);
  await ensureFileIfMissing(
    join(root, "docs", "develop", "README.md"),
    DEVELOP_README_TEMPLATE,
    adventureCreated,
  );

  await patchDocsReadme(join(root, "docs", "README.md"), updated);
  await patchMaintenance(
    join(root, "docs", "engineering", "MAINTENANCE.md"),
    updated,
  );

  return { baseReady, baseCreated, adventureCreated, updated };
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    console.error("错误：最多接受一个参数（项目根目录）");
    exit(1);
  }

  const root = args[0] ?? ".";
  const rootInfo = await stat(root).catch(() => null);
  if (!rootInfo?.isDirectory()) {
    console.error(`错误：${root} 不是有效目录`);
    exit(1);
  }

  const { baseReady, baseCreated, adventureCreated, updated } =
    await ensureAdventureDocsTree(root);

  if (!baseReady && baseCreated.length > 0) {
    console.log(
      "检测到基础文档结构未就绪，已先调用 docs-init 完成基础初始化：",
    );
    for (const item of baseCreated) console.log(`  + [base] ${item}`);
  }
  if (adventureCreated.length > 0) {
    console.log("已创建高级扩展目录与索引：");
    for (const item of adventureCreated) console.log(`  + [adventure] ${item}`);
  }
  if (updated.length > 0) {
    console.log("已增量更新索引与维护公约：");
    for (const item of updated) console.log(`  ~ ${item}`);
  }
  if (
    baseCreated.length === 0 &&
    adventureCreated.length === 0 &&
    updated.length === 0
  ) {
    console.log(
      "基础与高级文档目录结构（含 reader/ 与 develop/）均已就绪，无需创建",
    );
  }
}
