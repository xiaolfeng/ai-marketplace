<!-- init-deep:synced@d4c5c88 -->

# engineering-design 知识库

## 概述

工程研发文档与实施计划管理插件：五个写作技能分管 `docs/engineering/{research,design,spec,runbook}`
四个工程模式与同级 `docs/plan/`（含 `docs/plan/archive/`）实施计划模式，外加 `docs-init` 基础初始化器、
`docs-adventure-init` 高级目录（`docs/reader/` 与 `docs/develop/`）增量初始化器、`docs-clean` 卫生巡检
以及 `docs-move` 旧版与不规范文档迁移整理器。`draft → rfc → adr` 作为 `design` 与 `spec` 的单文件内部演进阶段，
编号、状态机、Scope 词表与反 AI 腔纪律统一由 `skills/_shared/` 约束。

## 目录结构

```text
engineering-design/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/              # 共享约束（单一事实源）
    │   ├── conventions.md    #   engineering 四模式 + docs/plan/ + 可选 reader/develop + 独立编号
    │   ├── lifecycle.md      #   模式协作流向 + 各模式定制状态机（develop/reader 无状态）
    │   ├── scope-manage.md   #   业务域词表对接（受控文档与 plan 共用）
    │   └── writing-style.md  #   输出语言纪律 + 技术真实性六门禁
    ├── research-er/          # 调研模式：只记现状与证据，无过程状态
    ├── design-er/            # 设计模式：单文件演进 draft → rfc → adr
    ├── spec-er/              # 规范模式：跨模块标准与红线，单文件演进 draft → rfc → adr
    ├── runbook-er/           # 手册模式：运维排障 SOP，演进 draft → active → deprecated
    ├── plan-er/              # 计划模式：docs/plan/ 活动平铺，终态移入 docs/plan/archive/
    ├── docs-init/            # 基础初始化：幂等创建 docs/engineering/、docs/plan/ 与 MAINTENANCE.md
    ├── docs-adventure-init/  # 高级初始化：先查基础结构，再增量扩展 docs/reader/ 与 docs/develop/
    ├── docs-clean/           # 卫生整理：扫描编号 / 引用 / 状态机 / 归档位置
    └── docs-move/            # 迁移整理：将旧版或不规范文档迁移并重构为当前规范样式
```

每个写作技能内部固定三件套：`SKILL.md`（操作清单 + 文档骨架）、
`references/example.md`（好坏对照教学材料）、`examples/sample.md`（可复制成品样例）。

## 导航指南

| 任务                               | 位置                                                         | 说明                                                                               |
| ---------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 改目录、维护器或编号规则           | `skills/_shared/conventions.md`                              | 五写作技能、`docs-init`、`docs-adventure-init`、`docs-clean`、`docs-move` 同时生效 |
| 改阶段演进或各模式状态机           | `skills/_shared/lifecycle.md`                                | `scan_docs.mjs` 直接解析此文件状态表                                               |
| 调整文风与真实性门禁               | `skills/_shared/writing-style.md`                            | 空话词禁用表与六条真实性门禁                                                       |
| 改基础目录与 MAINTENANCE 初始化    | `skills/docs-init/scripts/init_docs.mjs`                     | 保持完全幂等可重跑                                                                 |
| 改高级目录（reader/develop）初始化 | `skills/docs-adventure-init/scripts/init_adventure_docs.mjs` | 先检查基础结构，缺失则调用 `init_docs.mjs` 再执行增量扩展                          |
| 改卫生检查项与扫描器               | `skills/docs-clean/scripts/scan_docs.mjs`                    | 与 `references/checks.md` 的 code 同步                                             |
| 改旧文档盘点与迁移规范             | `skills/docs-move/scripts/discover_legacy.mjs`               | 与 `references/migration-rules.md` 同步                                            |

## 约定

- **模式与阶段正交**：目录名（`research` / `design` / `spec` / `runbook` / `plan` / `reader` / `develop`）表达体裁模式；`draft → rfc → adr` 是 `design` 与 `spec` 在同一文件内演进的状态阶段，不建独立目录；
- **`docs/plan/` 与 `docs/engineering/` 同级**：实施计划必须位于 `docs/plan/`，禁止放在仓库顶层；取新号与查重必须同时合并扫描 `docs/plan/` 与 `docs/plan/archive/`；
- **高级目录轻量无状态**：`docs/reader/` 放置面向用户直读的 `.html` 页面或高级渲染图，`docs/develop/` 放置 AI 留存的无状态工程记录（严禁写状态字段），两者均不强制四位编号；
- **共享内容只进 `_shared/`**：编号、状态机、词表、语言纪律共用一份事实源。

## 反模式

- 把 `plan/` 放到与 `docs/` 同级的仓库根目录，或把 `rfc`/`adr` 建成独立目录；
- 在 `docs/develop/` 中保留过程状态字段，或把 `.html` 塞进 `docs/engineering/`；
- 新建 `plan` 时只看 `docs/plan/` 不看 `docs/plan/archive/` 导致归档时撞号；
- 在 `docs/README.md` 中把不同模式的文档混排在同一个列表里。

## 调试路径

1. 技能未被客户端发现 → 核对 `skills/` 单层结构、`name` 与目录名一致且 `description` ≤ 1024 字符；
2. 编号冲突、终态计划未归档或引用打空 → 跑 `node skills/docs-clean/scripts/scan_docs.mjs <root>`；
3. 旧版目录或散乱文档迁移 → 跑 `node skills/docs-move/scripts/discover_legacy.mjs <root>` 列出对照表；
4. 文档产出 AI 腔重或自研论证失真 → 对照 `_shared/writing-style.md` 的六条技术真实性门禁复查。

## 引用

- [docs](../../docs/INITDEEP.md) — 本插件产出的落点目录知识库
- [git-manage](../git-manage/INITDEEP.md) — 共享同一套业务域 scope 词表
