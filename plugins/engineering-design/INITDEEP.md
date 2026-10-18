<!-- init-deep:synced@c4d6803 -->

# engineering-design 知识库

## 概述

工程研发文档与实施计划管理插件：五个写作技能分管 `docs/engineering/{research,design,spec,runbook}`
四个工程模式与顶层 `plan/`（含 `plan/archive/`）实施计划模式，外加 `docs-init` 目录与维护器初始化器、
`doc-clean` 卫生巡检。`draft → rfc → adr` 作为 `design` 与 `spec` 的单文件内部演进阶段，
编号、状态机、Scope 词表与反 AI 腔纪律统一由 `skills/_shared/` 约束。

## 目录结构

```text
engineering-design/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/              # 共享约束（单一事实源）
    │   ├── conventions.md    #   工程四模式 + 顶层 plan/ + MAINTENANCE.md + 独立编号
    │   ├── lifecycle.md      #   模式协作流向 + 各模式定制状态机
    │   ├── scope-manage.md   #   业务域词表对接（docs 与 plan 共用）
    │   └── writing-style.md  #   输出语言纪律 + 技术真实性六门禁
    ├── research-er/          # 调研模式：只记现状与证据，无过程状态
    ├── design-er/            # 设计模式：单文件演进 draft → rfc → adr
    ├── spec-er/              # 规范模式：跨模块标准与红线，单文件演进 draft → rfc → adr
    ├── runbook-er/           # 手册模式：运维排障 SOP，演进 draft → active → deprecated
    ├── plan-er/              # 计划模式：顶层 plan/ 活动平铺，终态移入 plan/archive/
    ├── docs-init/            # 初始化器：幂等建目录、MAINTENANCE.md 与分模式索引
    └── doc-clean/            # 卫生整理：扫描编号 / 引用 / 状态机 / 归档位置
```

每个写作技能内部固定三件套：`SKILL.md`（操作清单 + 文档骨架）、
`references/example.md`（好坏对照教学材料）、`examples/sample.md`（可复制成品样例）。

## 导航指南

| 任务                        | 位置                                     | 说明                                        |
| --------------------------- | ---------------------------------------- | ------------------------------------------- |
| 改目录、维护器或编号规则    | `skills/_shared/conventions.md`          | 五写作技能、docs-init 与 doc-clean 同时生效 |
| 改阶段演进或各模式状态机    | `skills/_shared/lifecycle.md`            | `scan_docs.mjs` 直接解析此文件状态表        |
| 调整文风与真实性门禁        | `skills/_shared/writing-style.md`        | 空话词禁用表与六条真实性门禁                |
| 改目录与 MAINTENANCE 初始化 | `skills/docs-init/scripts/init_docs.mjs` | 保持完全幂等可重跑                          |
| 改卫生检查项与扫描器        | `skills/doc-clean/scripts/scan_docs.mjs` | 与 `references/checks.md` 的 code 同步      |

## 约定

- **模式与阶段正交**：目录名（`research` / `design` / `spec` / `runbook` / `plan`）表达体裁模式；`draft → rfc → adr` 是 `design` 与 `spec` 在同一文件内演进的状态阶段，不建独立目录；
- **`plan` 编号必扫两处**：活动计划平铺于 `plan/`，完结计划移入 `plan/archive/`，取新号与查重必须同时合并扫描 `plan/` 与 `plan/archive/`；
- **共享内容只进 `_shared/`**：编号、状态机、词表、语言纪律共用一份事实源；
- **样例共用一条主题线**：五写作技能的 `examples/sample.md` 以「构建产物与 Cursor 清单分发」为同一主题串联演示。

## 反模式

- 把 `rfc` 或 `adr` 重新建成独立目录或拆成多份文件；
- 新建 `plan` 时只看 `plan/` 不看 `plan/archive/` 导致归档时撞号；
- 在 `docs/README.md` 中把不同模式的文档混排在同一个列表里。

## 调试路径

1. 技能未被客户端发现 → 核对 `skills/` 单层结构、`name` 与目录名一致且 `description` ≤ 1024 字符；
2. 编号冲突、终态计划未归档或引用打空 → 跑 `node skills/doc-clean/scripts/scan_docs.mjs <root>`；
3. 文档产出 AI 腔重或自研论证失真 → 对照 `_shared/writing-style.md` 的六条技术真实性门禁复查。

## 引用

- [docs](../../docs/INITDEEP.md) — 本插件产出的落点目录知识库
- [git-manage](../git-manage/INITDEEP.md) — 共享同一套业务域 scope 词表
