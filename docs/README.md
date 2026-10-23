# 文档中心

本项目文档按**模式**分区管理，不同模式的文档独立建表、互不混排。
工程文档与实施计划的命名、独立取号、状态机与归档维护铁律统一由 [`engineering/MAINTENANCE.md`](./engineering/MAINTENANCE.md) 约束。

## 模式导航

| 顶层模式                                | 子模式 / 入口                                                                             | 定位与职责                                                                             | 状态流转                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| **工程研发模式**（`docs/engineering/`） | [调研模式 `research/`](./engineering/research/)                                           | 记录「现状是什么」——外部标准、竞品拆解与实测证据                                       | 无状态（仅记调研日期）               |
| **工程研发模式**（`docs/engineering/`） | [设计模式 `design/`](./engineering/design/)                                               | 记录「怎样工作与实现」——模块职责、数据接口、异常与验证                                 | `draft → rfc → adr`                  |
| **工程研发模式**（`docs/engineering/`） | [规范模式 `spec/`](./engineering/spec/)                                                   | 记录「必须遵守什么规则」——跨模块标准、协议契约与长期红线                               | `draft → rfc → adr`                  |
| **工程研发模式**（`docs/engineering/`） | [手册模式 `runbook/`](./engineering/runbook/)                                             | 记录「线上怎么操作与救火」——部署发布、告警排查与止血回滚 SOP                           | `draft → active → deprecated`        |
| **实施计划模式**（`docs/plan/`）        | [计划看板 `./plan/README.md`](./plan/README.md)                                           | 记录「怎么分步推进与迁移」——活动计划平铺于 `docs/plan/`，完结归入 `docs/plan/archive/` | `draft → ready → in-progress → done` |
| **项目基建模式**（`docs/` 根级）        | [`scope-manage.md`](./scope-manage.md) · [`MAINTENANCE.md`](./engineering/MAINTENANCE.md) | Git 提交与工程文档共用的业务域词表总账、工程文档维护器公约                             | 持续维护                             |

---

## 工程研发模式台账（按模式分表）

### 调研模式（`research/`）

| 编号 | 文档                                                                             | Scope         | 调研日期   |
| ---- | -------------------------------------------------------------------------------- | ------------- | ---------- |
| 0001 | [插件标准全景调研](./engineering/research/0001-plugin-standards.md)              | `plugin`      | 2026-08-23 |
| 0002 | [npx 安装器深度拆解](./engineering/research/0002-marketplace-installers.md)      | `marketplace` | 2026-08-23 |
| 0003 | [插件 Logo 展示机制](./engineering/research/0003-plugin-logos.md)                | `plugin`      | 2026-08-24 |
| 0004 | [ZCode 兼容性分析](./engineering/research/0004-marketplace-zcode.md)             | `marketplace` | 2026-08-24 |
| 0005 | [Skill 编写规范与 AI 输出可读性](./engineering/research/0005-skill-authoring.md) | `skill`       | 2026-08-25 |

### 设计模式（`design/`）

| 编号 | 文档                                                                                               | Scope    | 阶段状态               |
| ---- | -------------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| 0001 | [Agent Studio：宿主感知的工作组与工作流构建插件](./engineering/design/0001-plugin-agent-studio.md) | `plugin` | `superseded`（→ 0002） |
| 0002 | [Agent Studio：本地全局 Agent 体系构建](./engineering/design/0002-plugin-agent-studio-global.md)   | `plugin` | `draft`                |

### 规范模式（`spec/`）

| 编号 | 文档                                                               | Scope    | 阶段状态 |
| ---- | ------------------------------------------------------------------ | -------- | -------- |
| 0001 | [插件编写与上架规范](./engineering/spec/0001-plugin-guidelines.md) | `plugin` | `adr`    |

### 手册模式（`runbook/`）

| 编号 | 文档                                       | Scope | 状态 |
| ---- | ------------------------------------------ | ----- | ---- |
| —    | _暂无手册（需要时通过 `runbook-er` 创建）_ | —     | —    |

---

## 项目基建与实施计划入口

- **实施计划看板**：[./plan/README.md](./plan/README.md) — 跨阶段演进与迁移实施计划（由 `plan-er` 维护）
- **工程文档维护器公约**：[./engineering/MAINTENANCE.md](./engineering/MAINTENANCE.md) — 命名、独立取号、状态流转与卫生检查规则
- **项目 Scope 总账**：[./scope-manage.md](./scope-manage.md) — Git 提交与工程文档共用的业务域词表
