---
name: doc-clean
description: >
  整理工程文档与实施计划卫生。检查 docs/engineering/{research,design,spec,runbook} 与顶层 plan/
  （含 plan/archive/）是否按模式独立取号（串号、空洞、撞号）、相对链接是否打空、文件是否放错目录
  （含终态计划未归档或遗留旧目录）、docs/engineering/MAINTENANCE.md 是否就位，并核对 docs/README.md
  与 plan/README.md 索引、状态机取值、Scope 词表、superseded 双向链接、正文骨架与外链 404。
  安全项直接修，重编号/改名/搬文件先列出对照表等确认。用户说「整理文档」「检查编号」「文档卫生」
  「doc-clean」「引用是不是空的」「工程文档乱了」时使用。
---

# doc-clean · 工程文档与计划卫生

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md)

检查项与 fix 分级：[references/checks.md](./references/checks.md)。
编号、状态、词表的规则只在 `_shared/` 和目标仓 `docs/scope-manage.md`、`docs/engineering/MAINTENANCE.md`，这里不复述。

## 扫哪里

1. `docs/engineering/{research,design,spec,runbook}/` 四个工程模式目录 + `docs/engineering/MAINTENANCE.md` + `docs/README.md` 分模式索引；
2. 顶层 `plan/`（平铺活动计划 + `plan/archive/` 归档计划 + `plan/README.md` 看板索引，若存在）；
3. `docs/scope-manage.md`、`AGENTS.md`、`ARCHITECTURE.md` 等非编号基建文档不搬、不改名。

`research/0001`、`design/0001`、`spec/0001`、`runbook/0001` 与 `plan/0001` 同时存在是合法的——五条序列各自独立。
但 `plan/0001-xxx.md` 与 `plan/archive/0001-yyy.md` 同时存在属于**同模式撞号（`NUM-DUP`）**，因为归档前后共享同一条 `plan` 序列。

## 操作流程

复制此清单并随做随勾：

```
整理进度：
- [ ] 1. 跑 scan_docs.mjs，读 JSON findings
- [ ] 2. 按 checks.md 的 fix 列分流：safe 直接修 / ask 列出对照表等确认 / report 只写入报告
- [ ] 3. 安全项改完再跑一遍脚本，确认 findings 下降
- [ ] 4. 按 sample-report.md 的骨架回报：已修 / 待确认 / 仍存在 / 干净的检查
```

### 第 1 步：扫描

```bash
node <本技能目录>/scripts/scan_docs.mjs <项目根目录>
# 不传根目录时默认当前工作目录（被整理的项目根，不是技能目录）
# 离线或只要结构检查时加 --skip-http
```

stdout 是 JSON。退出码 `0` 表示扫描完成，有 findings 也是 `0`。
不要凭 `ls` 手算编号——同模式空洞、`plan/` 与 `plan/archive/` 跨目录撞号靠脚本检查。

### 第 2 步：分流处理

读 [references/checks.md](./references/checks.md) 的 `fix` 列，不要自行升级或降级：

- **safe**：断链且同名文件唯一、索引漏登/指空、缺 `MAINTENANCE.md`、用了旧版初始状态名（如 `open`/`proposed` → `draft`）、后继已有 blockquote 缺回指——直接改；
- **ask**：重编号、改文件名、搬移目录（含终态 `plan` 移入 `plan/archive/` 或清理遗留 `rfc/`、`adr/`、`draft/` 目录）。列出「旧路径 → 新路径」对照表，停下来等确认，不得在同一轮默默改；
- **report**：外链 404、骨架不像该模式、`research` 误写状态、空引用猜不出目标——写入报告，不改正文论点。

改索引时沿用 `docs/README.md` 与 `plan/README.md` 的分模式表格体例。标题取文件第一个 `#` 标题。
补双向承接时，只在后继文已有文首 blockquote 的前提下追加，不新造章节。

不要删文档。不要擅自把状态改成 `adr`、`active` 或 `done`。

### 第 3 步：复扫

安全项落地后再跑同一条命令。还在的 ask / report 项原样带进报告，不要假装没了。

### 第 4 步：回报

骨架见 [examples/sample-report.md](./examples/sample-report.md)。
没有问题时写清扫了多少篇、哪几类检查是干净的——空报告等于没跑。
