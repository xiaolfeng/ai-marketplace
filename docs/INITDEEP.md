<!-- init-deep:synced@c4d6803 -->

# docs 知识库

## 概述

项目文档中心：根级包含 `README.md`（按模式分区的文档中心索引）与 `scope-manage.md`（业务域总账），
`engineering/` 下由 `MAINTENANCE.md` 统管四大工程模式目录（`research/`、`design/`、`spec/`、`runbook/`），
并与同级的 `plan/`（含 `plan/archive/`）协同构成完整的研发文档体系（按需可通过 `docs-adventure-init` 扩展 `reader/` 与 `develop/`）。写作、迁移与巡检由 `engineering-design` 插件执行。

## 目录结构

```text
docs/
├── README.md                        # 文档中心索引：按模式分区导航 + 分模式文档台账
├── scope-manage.md                  # Scope 总账：Git 提交、工程文档与 plan 共用业务域词表
├── engineering/
│   ├── MAINTENANCE.md               # 工程文档维护器公约：命名、取号、状态机、演进与归档铁律
│   ├── research/                    # 调研模式（0001~0005：无状态，直接记录现状与证据）
│   ├── design/                      # 设计模式（0001~0002：单文件演进 draft → rfc → adr）
│   ├── spec/                        # 规范模式（0001 插件编写与上架规范：draft → rfc → adr）
│   └── runbook/                     # 手册模式（运行与排障 SOP：draft → active → deprecated）
└── plan/                            # 实施与迁移计划（与 engineering/ 同级）
    ├── README.md                    # 计划看板索引：进行中计划 + 已归档计划
    └── archive/                     # 已归档计划目录
```

## 导航指南

| 任务               | 位置                                         | 说明                                                          |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| 查工程文档维护规则 | `engineering/MAINTENANCE.md`                 | 命名、取号、各模式状态机与归档铁律                            |
| 写调研笔记         | `engineering/research/`                      | 只记现状与证据，无状态（`research-er`）                       |
| 写或演进工程设计   | `engineering/design/`                        | 单文件原位演进 `draft → rfc → adr`（`design-er`）             |
| 写或演进技术规范   | `engineering/spec/`                          | 跨模块标准与红线，单文件演进 `draft → rfc → adr`（`spec-er`） |
| 写运维排障手册     | `engineering/runbook/`                       | 部署与止血 SOP，`draft → active → deprecated`（`runbook-er`） |
| 写或归档实施计划   | `plan/` 与 `plan/archive/`                   | 活动平铺、终态进 `archive/`（`plan-er`）                      |
| 登记新业务域 Scope | `scope-manage.md`                            | 三列一次填齐                                                  |
| 修改插件上架标准   | `engineering/spec/0001-plugin-guidelines.md` | 全平台实测结论，按 `spec` 模式演进维护                        |

## 约定

- **模式与过程阶段正交**：目录名（`research` / `design` / `spec` / `runbook` / `plan`）表达文档模式；`draft → rfc → adr` 等是文档内部的**过程阶段状态**，在原文件内原位演进，不拆独立目录；
- **编号按模式独立递增**：`NNNN-<scope>-<title>.md` 的四位编号在五大模式中各自从 `0001` 起独立递增；其中 `plan` 取新号时必须同时扫描 `docs/plan/` 与 `docs/plan/archive/`；
- **索引按模式分表**：`docs/README.md` 按模式独立建表登记，禁止将不同模式的文档混排在一起；
- **词表三列一次填齐**：2 字中文、4 字中文、英文单词即使当前只用一列也照填。

## 反模式

- 删除已被取代的旧文档——讨论上下文是流程的一部分，应标 `superseded` 并链接新文；
- 把已经进入终态（`done` / `cancelled` / `superseded`）的计划继续留在 `docs/plan/` 根目录而不移入 `docs/plan/archive/`；
- 绕过 `engineering-design` 技能与 `MAINTENANCE.md` 手写未编号或未登记的工程文档。

## 调试路径

1. 编号疑似冲突、终态计划未归档或引用打空 → 跑 `engineering-design` 的 `docs-clean`（`scan_docs.mjs`）；旧文档迁移跑 `docs-move`；
2. Scope 拿不准 → 查 `scope-manage.md` 词表，任一名字列语义命中即视为同域复用；
3. 模式或状态选择困惑 → 对照 `engineering/MAINTENANCE.md` 与 `_shared/lifecycle.md`。

## 引用

- [engineering-design](../plugins/engineering-design/INITDEEP.md) — 本目录写作、迁移与卫生巡检技能的宿主插件
- [插件编写与上架规范](engineering/spec/0001-plugin-guidelines.md) — 向本市场提交插件的唯一标准（`adr`）
- [Agent Studio 全局体系设计](engineering/design/0002-plugin-agent-studio-global.md) — 本地全局 Agent 与独立工作流构建设计（`draft`）
