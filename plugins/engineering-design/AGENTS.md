<!-- deep-init:synced@b43b534 -->

# engineering-design 知识库

## 概述

工程设计文档管理插件：四个写作技能分管 `draft → research → rfc → adr` 全链路
四个阶段，外加 `docs-init` 目录初始化器和 `doc-clean` 卫生整理。产出统一落入
本仓的 `docs/engineering/` 五段式目录，写作时的编号、状态与语言纪律全部由
`_shared/` 一处约束。

## 目录结构

```text
engineering-design/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/              # 共享约束（单一事实源）
    │   ├── conventions.md    #   五阶段目录 + NNNN 阶段内独立编号
    │   ├── lifecycle.md      #   流转方向 + 各阶段状态机
    │   ├── scope-manage.md   #   业务域词表对接
    │   └── writing-style.md  #   输出语言纪律（反 AI 腔）
    ├── draft-er/             # 草案：链首，钉住困惑与初步想法
    ├── research-er/          # 调研：只记现状与证据，不拍板
    ├── rfc-er/               # 提案：给评审人拍板的收敛方案
    ├── adr-er/               # 定稿：冻结长期约束
    ├── docs-init/            # 初始化器：Node 脚本幂等建目录
    └── doc-clean/            # 卫生整理：编号 / 引用 / 错位
```

每个写作技能内部固定三件套：`SKILL.md`（操作清单 + 文档骨架）、
`references/example.md`（好坏对照教学材料）、`examples/sample.md`（可复制成品样例）。

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 改编号或命名规则 | `skills/_shared/conventions.md` | 写作技能与 doc-clean 同时生效 |
| 改流转方向或状态机 | `skills/_shared/lifecycle.md` | 单向流动是底线 |
| 加新写作阶段技能 | `skills/<name>/` 三件套照抄现有结构 | 同步更新 README 技能表 |
| 调整文风纪律 | `skills/_shared/writing-style.md` | 空话词禁用表也在这里 |
| 改目录初始化行为 | `skills/docs-init/scripts/init_docs.mjs` | 保持幂等可重跑 |
| 改卫生检查项 | `skills/doc-clean/references/checks.md` | 与 `scan_docs.mjs` 的 code 同步 |

## 约定

- **共享内容只进 `_shared/`**：编号、状态机、词表、语言纪律写作技能与 doc-clean
  共用一份事实源，复制进各技能必然版本漂移；下划线前缀保证它不会被当作技能发现。
- **整理技能走脚本**：doc-clean 的确定性检查在 `scripts/scan_docs.mjs`，检查项只在
  `references/checks.md`，不要把编号规则再抄进 SKILL.md。
- **`references/` 与 `examples/` 语义不同不可混放**：前者是动笔前才读的好坏对照
  教学材料，后者是可直接复制改写的完整成品——这是渐进披露的一部分。
- **自由度分级**：编号与状态是死命令，文档骨架按模板，行文语气按原则——
  改技能时保持这个分级，不要把语气建议写成硬性步骤。
- **样例共用一条主题线**：四技能的 `examples/sample.md` 以「构建产物入库」为
  同一主题连成 draft→research→rfc→adr 完整流转演示，改动需保持文首承接链接
  连贯——编号按阶段独立，不要求跨目录递增。

## 反模式

- 在 `SKILL.md` 正文里堆模板全文与示例——骨架留操作清单，其余按需加载；
- 把 `docs/engineering/` 的阶段目录名（draft/research/...）当 Scope 使用——
  阶段与文件名中的业务域词表正交；
- 为 `design` 阶段新建技能前先在 `lifecycle.md` 登记流转语义——该目录目前预留、
  写作技能待补，直接加文件会绕过状态机约定。

## 调试路径

1. 新技能未被客户端发现 → 核对 `skills/` 单层结构且 `name` 与目录名一致；
2. 编号冲突或引用打空 → 跑 `doc-clean`（脚本扫 `engineering/` + README 索引），
   不要手算跨目录编号；规则见 `_shared/conventions.md`；
3. 文档产出 AI 腔重 → 对照 `_shared/writing-style.md` 的禁用表与删减测试复查。

## 引用

- [docs](../../docs/AGENTS.md) — 本插件产出的落点目录知识库
- [git-manage](../git-manage/AGENTS.md) — 共享同一套业务域 scope 词表
