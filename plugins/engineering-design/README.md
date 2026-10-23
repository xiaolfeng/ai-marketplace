# engineering-design

工程研发文档与实施计划管理插件。将**文档模式（写什么体裁）**与**过程阶段（走到哪一步）**正交解耦：
五个写作技能分管**调研（`research`）**、**设计（`design`）**、**规范（`spec`）**、**手册（`runbook`）**与**实施计划（`plan`）**，
外加 `docs-init` 基础初始化、`docs-adventure-init` 高级目录（`reader` + `develop`）增量初始化、`docs-clean` 卫生巡检与 `docs-move` 旧文档迁移整理。

## 包含技能

| 技能                                                   | 模式与落点                              | 状态机（过程阶段）                   | 一句话定位                                                                                     |
| ------------------------------------------------------ | --------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`research-er`](./skills/research-er/)                 | 调研 · `docs/engineering/research/`     | 无状态（仅记日期）                   | 直接记录现状与实测证据，方向判断标「倾向」不拍板                                               |
| [`design-er`](./skills/design-er/)                     | 设计 · `docs/engineering/design/`       | `draft → rfc → adr`                  | 单文件原位演进模块职责、数据接口、备选对比、异常与验证                                         |
| [`spec-er`](./skills/spec-er/)                         | 规范 · `docs/engineering/spec/`         | `draft → rfc → adr`                  | 单文件原位演进跨模块标准、协议契约、正反例与长期红线                                           |
| [`runbook-er`](./skills/runbook-er/)                   | 手册 · `docs/engineering/runbook/`      | `draft → active → deprecated`        | 编写部署发布、告警排查、故障止血回滚与恢复验证 SOP                                             |
| [`plan-er`](./skills/plan-er/)                         | 计划 · `docs/plan/`（含 `archive/`）    | `draft → ready → in-progress → done` | 活动计划平铺于 `docs/plan/`，完结移入 `docs/plan/archive/`                                     |
| [`docs-init`](./skills/docs-init/)                     | 基础初始化 · `docs/{engineering,plan}/` | —                                    | 幂等创建基础目录树、`MAINTENANCE.md` 与分模式索引                                              |
| [`docs-adventure-init`](./skills/docs-adventure-init/) | 高级初始化 · `docs/{reader,develop}/`   | 无状态                               | 先检查并确保 `docs-init` 就绪，再增量扩展直读 `.html`（`reader/`）与 AI 工程记录（`develop/`） |
| [`docs-clean`](./skills/docs-clean/)                   | 卫生整理 · 全受控域及扩展域             | —                                    | 扫描编号/引用/状态机/归档位置，安全项直修，重编号先请示                                        |
| [`docs-move`](./skills/docs-move/)                     | 迁移整理 · 旧目录与不规范文档           | —                                    | 将旧版目录、不规范命名、旧状态与散乱章节整理迁移为当前规范样式                                 |

## 核心架构设计

- **体裁模式与过程阶段解耦**：`rfc`（提案描述/评审）与 `adr`（定稿约束/冻结）不再是独立目录，而是 `design` 与 `spec` 文档在**同一文件内原位演进的过程阶段**（`draft → rfc → adr`）；
- **统一收归 `docs/` 下同级分层**：`docs/engineering/` 沉淀长期有效的调研、设计、规范与运维手册；同级的 `docs/plan/` 承载分阶段推进与迁移计划（活动平铺、终态归入 `docs/plan/archive/`）；
- **可选高级双目录（`reader` + `develop`）**：通过 `docs-adventure-init` 增量开启 `docs/reader/`（专门放置给用户直读的 `.html` 界面与高级渲染图）与 `docs/develop/`（供 AI 留存有价值但不宜归入 `engineering` 四模式的工程信息，**不需要保留记录状态**）；
- **存量平滑治理（`docs-move` + `docs-clean`）**：`docs-move` 负责将旧版目录（如顶层 `plan/`、独立 `rfc/adr/`）与不规范文档重构为当前规范样式，`docs-clean` 负责日常编号、引用与状态机巡检；
- **反 AI 腔与技术真实性六门禁**：内置空话词禁用表、最强反驳原则（反稻草人拉踩）、工作树现状与规划隔离、物理失效边界自白与自研退出条件。

## 安装

```bash
# Claude Code
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install engineering-design@ai-marketplace

# 或任意支持 Agent Skills 的工具（78+）
npx skills add xiaolfeng/ai-marketplace --skill research-er --skill design-er --skill spec-er --skill runbook-er --skill plan-er --skill docs-init --skill docs-adventure-init --skill docs-clean --skill docs-move
```

## 使用

| 场景                                   | 说的话                                       | 触发技能              |
| -------------------------------------- | -------------------------------------------- | --------------------- |
| 需要摸清现状或对比方案                 | 「调研一下 X」                               | `research-er`         |
| 设计功能/模块，或推进设计提案与定稿    | 「写个详细设计稿」「把这个设计定稿为 ADR」   | `design-er`           |
| 制定跨模块标准、协议或架构红线         | 「写个规范」「把这条规矩冻住」               | `spec-er`             |
| 编写部署步骤、排障或应急止血手册       | 「写个排障 runbook」                         | `runbook-er`          |
| 拆解多阶段改造、存量迁移或完结归档     | 「写个实施计划」「把这个计划归档」           | `plan-er`             |
| 新项目搭建基础文档与计划骨架           | 「初始化文档」                               | `docs-init`           |
| 增量开启 `.html` 直读区与无状态备忘区  | 「高级初始化文档」「添加 reader 和 develop」 | `docs-adventure-init` |
| 检查编号串号、断链或未归档计划         | 「整理一下工程文档」                         | `docs-clean`          |
| 将旧版目录或不规范文档重构为当前新规范 | 「把旧文档整理迁移成新规范」                 | `docs-move`           |

也可显式调用：

```bash
/research-er
/design-er
/spec-er
/runbook-er
/plan-er
/docs-init
/docs-adventure-init
/docs-clean
/docs-move
```

## 结构

```text
engineering-design/skills/
├── _shared/
│   ├── conventions.md      # 四工程模式 + docs/plan/ + 可选 reader/develop + 独立编号规则
│   ├── lifecycle.md        # 模式流转方向 + 定制状态机（含 draft → rfc → adr 原位演进）
│   ├── scope-manage.md     # 业务域词表对接（docs 与 plan 共用）
│   └── writing-style.md    # 输出语言纪律 + 技术真实性六门禁
├── research-er/
│   ├── SKILL.md
│   ├── references/example.md
│   └── examples/sample.md
├── design-er/
│   ├── SKILL.md
│   ├── references/example.md
│   └── examples/sample.md
├── spec-er/
│   ├── SKILL.md
│   ├── references/example.md
│   └── examples/sample.md
├── runbook-er/
│   ├── SKILL.md
│   ├── references/example.md
│   └── examples/sample.md
├── plan-er/
│   ├── SKILL.md
│   ├── references/example.md
│   └── examples/sample.md
├── docs-init/
│   ├── SKILL.md
│   ├── examples/minimal-index.md
│   └── scripts/init_docs.mjs
├── docs-adventure-init/
│   ├── SKILL.md
│   ├── examples/adventure-index.md
│   └── scripts/init_adventure_docs.mjs
├── docs-clean/
│   ├── SKILL.md
│   ├── references/checks.md
│   ├── examples/sample-report.md
│   ├── evals/evals.json
│   └── scripts/scan_docs.mjs
└── docs-move/
    ├── SKILL.md
    ├── references/migration-rules.md
    ├── examples/sample-migration.md
    └── scripts/discover_legacy.mjs
```
