#!/usr/bin/env node
/**
 * 初始化工程文档与实施计划目录结构（幂等）。
 *
 * 在目标项目根下创建：
 *   - docs/engineering/{research,design,spec,runbook}/.gitkeep
 *   - docs/engineering/MAINTENANCE.md（工程文档维护器公约）
 *   - docs/README.md（按模式分区的文档中心最小索引）
 *   - plan/archive/.gitkeep
 *   - plan/README.md（实施计划看板最小索引）
 *
 * 已存在的目录与文件一律跳过，绝不覆盖。
 *
 * 用法：
 *   node init_docs.mjs [项目根目录]
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { exit } from "node:process";

const ENG_SUBDIRS = ["research", "design", "spec", "runbook"];

const DOCS_README_TEMPLATE = `# 文档中心

本项目文档按模式分区管理，不同模式的文档独立建表、互不混排。工程文档的命名、取号与状态流转规则由 [\`engineering/MAINTENANCE.md\`](./engineering/MAINTENANCE.md) 统一约束。

## 模式导航

| 顶层模式 | 子模式 / 入口 | 定位与职责 | 状态流转 |
| --- | --- | --- | --- |
| **工程研发模式**（\`docs/engineering/\`） | [调研模式 \`research/\`](./engineering/research/) | 客观现状、外部机制与实测证据 | 无状态（仅记日期） |
| **工程研发模式**（\`docs/engineering/\`） | [设计模式 \`design/\`](./engineering/design/) | 模块职责、数据接口、异常处理与验证方式 | \`draft → rfc → adr\` |
| **工程研发模式**（\`docs/engineering/\`） | [规范模式 \`spec/\`](./engineering/spec/) | 跨模块标准、协议格式与长期架构红线 | \`draft → rfc → adr\` |
| **工程研发模式**（\`docs/engineering/\`） | [手册模式 \`runbook/\`](./engineering/runbook/) | 部署发布、告警排查与故障止血恢复 SOP | \`draft → active → deprecated\` |
| **实施计划模式**（\`../plan/\`） | [计划看板 \`../plan/README.md\`](../plan/README.md) | 分阶段改造路线、兼容迁移与切流回滚（完结归入 \`archive/\`） | \`draft → ready → in-progress → done\` |
| **项目基建模式**（\`docs/\` 根级） | [\`scope-manage.md\`](./scope-manage.md) · [\`MAINTENANCE.md\`](./engineering/MAINTENANCE.md) | 业务域词表总账与工程文档维护器公约 | 持续维护 |

## 工程文档台账（按模式分表）

### 调研模式（\`research/\`）

| 编号 | 文档 | Scope | 调研日期 |
| --- | --- | --- | --- |

### 设计模式（\`design/\`）

| 编号 | 文档 | Scope | 阶段状态 |
| --- | --- | --- | --- |

### 规范模式（\`spec/\`）

| 编号 | 文档 | Scope | 阶段状态 |
| --- | --- | --- | --- |

### 手册模式（\`runbook/\`）

| 编号 | 文档 | Scope | 状态 |
| --- | --- | --- | --- |
`;

const MAINTENANCE_TEMPLATE = `# 工程文档维护器公约（MAINTENANCE）

本文件约束 \`docs/engineering/\` 与顶层 \`plan/\` 下文档的创建、取号、阶段演进与卫生维护。日常写作与巡检由 \`engineering-design\` 插件（\`research-er\` / \`design-er\` / \`spec-er\` / \`runbook-er\` / \`plan-er\` / \`doc-clean\`）执行。

## 1. 模式与目录边界

| 目录 | 模式 | 何时写入 | 状态机 |
| --- | --- | --- | --- |
| \`docs/engineering/research/\` | 调研（research） | 摸清外部标准、竞品或技术机制，只记现状与证据 | 无状态（记 \`调研日期：YYYY-MM-DD\`） |
| \`docs/engineering/design/\` | 设计（design） | 具体功能/模块怎样工作、数据接口、异常与验证 | \`draft\` → \`rfc\` → \`adr\` / \`rejected\` / \`superseded\` |
| \`docs/engineering/spec/\` | 规范（spec） | 跨模块通用标准、命名/目录约定、架构红线 | \`draft\` → \`rfc\` → \`adr\` / \`rejected\` / \`superseded\` |
| \`docs/engineering/runbook/\` | 手册（runbook） | 部署上线、告警排查、故障止血与恢复 SOP | \`draft\` → \`active\` → \`deprecated\` / \`superseded\` |
| \`plan/\` + \`plan/archive/\` | 计划（plan） | 分阶段实施路线、存量迁移与回滚步骤 | 活动态（\`plan/\`）：\`draft\` → \`ready\` → \`in-progress\`；终态（\`plan/archive/\`）：\`done\` / \`cancelled\` / \`superseded\` |

## 2. 命名与独立取号铁律

所有受控文档统一命名为 \`NNNN-<scope>-<title>.md\`：

1. **\`NNNN\`（四位独立序列）**：
   - \`research\`、\`design\`、\`spec\`、\`runbook\` 在各自目录内独立取现有最大编号 +1（空目录从 \`0001\` 起）；
   - \`plan\` 取新号时**必须同时扫描 \`plan/\` 与 \`plan/archive/\`**，取合并最大编号 +1，防止与已归档计划撞号；
   - 不同模式的序列互不占用（\`research/0001\`、\`design/0001\`、\`spec/0001\` 可同时并存）；跨模式演进靠文首 \`承接 [NNNN](相对路径)\` 链接，严禁跨目录续号。
2. **\`<scope>\`（业务域）**：取自 [\`../scope-manage.md\`](../scope-manage.md) 词表的英文单词列，与目录模式正交。
3. **\`<title>\`**：kebab-case 英文短标题。

## 3. 原位演进与归档纪律

1. **单文件原位演进**：\`design\` 与 \`spec\` 从 \`draft\`（起草）到 \`rfc\`（提案描述/评审）再到 \`adr\`（定稿约束/冻结）始终在原文件内更新状态与收敛内容，不跨目录搬家；
2. **定稿锁定**：\`design\` 与 \`spec\` 状态升为 \`adr\` 须经人工确认；升为 \`adr\` 后核心条款锁定，后续推翻须新建文档并将旧文标为 \`superseded\`（双向互链）；
3. **计划完结归档**：\`plan/\` 下平铺活动计划；当计划进入 \`done\`、\`cancelled\` 或 \`superseded\` 时，必须移入 \`plan/archive/\` 并修正文内相对路径；
4. **分模式台账同步**：每次新增、改状态或归档后，必须同步更新 [\`../README.md\`](../README.md) 或 [\`../../plan/README.md\`](../../plan/README.md) 对应模式分表，并可用 \`doc-clean\` 校验。
`;

const PLAN_README_TEMPLATE = `# 实施计划看板（Plan）

本目录管理分阶段推进、兼容迁移与切流回滚计划。命名、取号（同时扫描 \`plan/\` 与 \`plan/archive/\`）及状态规则遵循 [\`docs/engineering/MAINTENANCE.md\`](../docs/engineering/MAINTENANCE.md)。

## 进行中计划（平铺于 \`plan/\`）

| 编号 | 计划 | Scope | 状态（\`draft\` / \`ready\` / \`in-progress\`） |
| --- | --- | --- | --- |

## 已归档计划（\`plan/archive/\`）

| 编号 | 计划 | Scope | 终态（\`done\` / \`cancelled\` / \`superseded\`） |
| --- | --- | --- | --- |
`;

async function ensureDirWithKeep(dirPath, created) {
  const info = await stat(dirPath).catch(() => null);
  if (info?.isDirectory()) return;
  await mkdir(dirPath, { recursive: true });
  await writeFile(join(dirPath, ".gitkeep"), "", "utf8");
  created.push(dirPath);
}

async function ensureFileIfMissing(filePath, content, created) {
  const info = await stat(filePath).catch(() => null);
  if (info?.isFile()) return;
  await mkdir(join(filePath, ".."), { recursive: true });
  await writeFile(filePath, content, "utf8");
  created.push(filePath);
}

async function ensureDocsTree(root) {
  const created = [];
  for (const name of ENG_SUBDIRS) {
    await ensureDirWithKeep(join(root, "docs", "engineering", name), created);
  }
  await ensureFileIfMissing(
    join(root, "docs", "engineering", "MAINTENANCE.md"),
    MAINTENANCE_TEMPLATE,
    created,
  );
  await ensureFileIfMissing(
    join(root, "docs", "README.md"),
    DOCS_README_TEMPLATE,
    created,
  );
  await ensureDirWithKeep(join(root, "plan", "archive"), created);
  await ensureFileIfMissing(
    join(root, "plan", "README.md"),
    PLAN_README_TEMPLATE,
    created,
  );
  return created;
}

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

const created = await ensureDocsTree(root);

if (created.length > 0) {
  console.log("已创建：");
  for (const item of created) console.log(`  + ${item}`);
} else {
  console.log("目录结构与维护文件已就绪，无需创建");
}
