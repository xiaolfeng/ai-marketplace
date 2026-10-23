---
name: docs-move
description: >
  将不规范或旧版的项目文档迁移并整理为当前 engineering-design 规范样式。支持把旧版顶层 plan/ 迁入 docs/plan/、
  将旧版 draft/rfc/adr 独立目录归并为 design/spec 单文件原位演进、将散落的 .html 渲染物与无状态工程笔记分流至
  docs/reader/ 与 docs/develop/，并完成独立四位取号重命名、文首元信息修补、标准章节骨架重构、全仓相对链接修正
  与索引同步。用户说「迁移旧文档」「整理不规范文档」「docs-move」「把旧文档改成新规范」「升级文档结构」「/docs-move」时使用。
---

# docs-move · 旧版与不规范文档迁移整理器

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

迁移映射规则与状态/骨架转换表见 [references/migration-rules.md](./references/migration-rules.md)。

## 职责边界：与 `docs-clean` 的分工

- **`docs-clean`**：针对**已按新规范组织**的仓库做日常巡检与微修（修索引漏登、单条断链、提醒个别空洞或未归档文件）；
- **`docs-move`（本技能）**：针对**旧版目录结构或散乱不规范文档**做系统性迁移与样式重构——包括目录搬迁（顶层 `plan/` → `docs/plan/`、旧 `draft/rfc/adr/` → `design/spec/`、散落 `.html`/笔记 → `reader/develop/`）、按模式重排独立编号、修补文首元信息头、将旧正文重排为当前模式的标准章节骨架，以及全仓相对链接批量重写。

## 操作流程

复制此清单并随做随勾：

```
文档迁移整理进度：
- [ ] 1. 运行 discover_legacy.mjs <项目根目录>，盘点旧目录、不规范文件名、旧状态值与骨架偏差
- [ ] 2. 结合正文内容拟定「迁移与重构对照表」（原路径 → 目标目录与新命名 → 状态/元信息转换 → 章节骨架改写点），请用户确认
- [ ] 3. 确认后检查基础/高级目录（缺基础目录跑 docs-init；涉及 reader/ 或 develop/ 跑 docs-adventure-init）
- [ ] 4. 执行文件搬移与重命名、文首元信息与标准章节骨架改写（100% 保留原技术事实与证据）、清理空旧目录
- [ ] 5. 批量修正全仓相对链接，同步更新 docs/README.md、docs/plan/README.md（及 reader/develop 索引）
- [ ] 6. 运行 docs-clean 的 scan_docs.mjs 复验结构零报错，按 sample-migration.md 回报迁移账单
```

### 第 1 步：盘点存量不规范文档

运行盘点脚本收集所有候选迁移项：

```bash
node <本技能目录>/scripts/discover_legacy.mjs <项目根目录>
# 不传参数时默认当前工作目录
```

脚本输出 JSON，包含：

- `legacyDirs`：顶层 `plan/`、`docs/{draft,rfc,adr}`、`docs/engineering/{draft,rfc,adr}` 等旧目录；
- `candidates`：每篇需迁移或重构的文档，含当前路径、推断的目标模式（`research` / `design` / `spec` / `runbook` / `plan` / `develop` / `reader`）、旧状态值映射建议、缺失的标准二级标题骨架。

### 第 2 步：输出对照表并等待用户确认

**铁律：物理搬移文件、重编号或改写章节结构前，必须先向用户列出对照表并获得确认。**

对照表包含四列（示范见 [examples/sample-migration.md](./examples/sample-migration.md)）：

1. **原路径**；
2. **目标路径与新命名**（受控模式按目标目录独立序列分配 `NNNN-<scope>-<title>.md`；`reader/` 与 `develop/` 使用 `<kebab-case>.{html,md}`）；
3. **元信息转换**（如旧目录 `adr/` 或旧状态 `accepted` → `状态：adr`，`develop/` 移除状态字段）；
4. **章节骨架改写点**（哪些旧标题归入新骨架的哪一节，缺失的必选章节如何从正文提炼补齐）。

若发现未登记的 `<scope>`，在同一轮将新 Scope 的三列名称（2 字中文 / 4 字中文 / 英文单词）一并提请确认。

### 第 3 步：补齐目标目录骨架

- 仅涉及五大受控模式 → 调用 [`docs-init`](../docs-init/SKILL.md) 的 `init_docs.mjs`；
- 涉及 `.html` 渲染物迁入 `docs/reader/` 或无状态工程记录迁入 `docs/develop/` → 调用 [`docs-adventure-init`](../docs-adventure-init/SKILL.md) 的 `init_adventure_docs.mjs`（会自动先检查并补齐 `docs-init`）。

### 第 4 步：执行迁移与规范化改写

严格按照 [references/migration-rules.md](./references/migration-rules.md) 执行：

1. **路径与命名落地**：使用 `git mv`（若在 Git 仓库内）或文件移动将文档迁至目标路径，清理搬空后的旧目录（如顶层 `plan/`、旧 `rfc/`、`adr/`）；
2. **文首元信息对齐**：按目标模式写入标准文首 blockquote（`状态`、`日期`、`Scope`、`承接`链接）；`research` 只记调研日期，`develop` 不保留任何状态字段；
3. **章节骨架规范化**：将原正文重组为目标模式的标准二级标题骨架（对照 `research-er` / `design-er` / `spec-er` / `runbook-er` / `plan-er` 的文档骨架），并遵守 [`writing-style.md`](../_shared/writing-style.md)：
   - **严禁丢失技术事实**：原文档中的代码路径、接口字段表、配置项、报错堆栈、命令与实测数据必须完整保留；
   - **严禁凭空编造**：原文档未提及的验证结果或待确认项，如实列入「待确认」或标注待补测，不得伪造测试通过结论。

### 第 5 步：全仓重链与索引同步

1. 扫描 `docs/`、根 `README.md`、`AGENTS.md`、各级 `INITDEEP.md` 中的相对链接，按「旧路径 → 新路径」映射表更新（尤其注意顶层 `plan/` 迁入 `docs/plan/` 后，指向 `docs/engineering/` 的链接从 `../docs/engineering/...` 变为 `../engineering/...`）；
2. 在 `docs/README.md`、`docs/plan/README.md`（以及 `docs/reader/README.md`、`docs/develop/README.md`）对应分表中登记全部迁移后的文档。

### 第 6 步：`docs-clean` 复验与回报

运行 `node ../docs-clean/scripts/scan_docs.mjs <项目根目录> --skip-http` 确认结构检查归零，按 [examples/sample-migration.md](./examples/sample-migration.md) 输出迁移完成报告。
