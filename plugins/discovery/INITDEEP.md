<!-- init-deep:synced@293803c -->

# discovery 知识库

## 概述

`init-deep` 维护按目录读取的 `INITDEEP.md` 知识索引，`init-arch` 维护根架构总览及各层约束。两者共用简短的根 `AGENTS.md` 入口规范：索引与架构详情由任务决定是否读取。

## 目录结构

```text
discovery/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/agents-entry.md       # 根 AGENTS.md 入口规范与来源
    ├── init-deep/                   # 目录索引：扫描、增量更新、校验
    │   ├── scripts/{scan,validate}.mjs
    │   ├── references/             # 模板、边界与可选公约
    │   ├── examples/               # 根/模块索引示例
    │   └── evals/
    └── init-arch/                   # 架构总览、层级约束与样例
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 改文件扫描或校验 | `skills/init-deep/scripts/` | 零依赖 Node ≥18 |
| 改索引模板与同步标记 | `skills/init-deep/references/templates.md` | 与扫描/校验脚本保持一致 |
| 改根 `AGENTS.md` 入口 | `skills/_shared/agents-entry.md` | 两技能共用一份规则 |
| 改架构文档结构 | `skills/init-arch/references/architecture.md` | 总览与分层文件归属 |
| 改技能触发条件 | 各技能 `SKILL.md` 的 frontmatter | 保持职责边界清楚 |

## 约定

- `init-deep` 只生成 `INITDEEP.md` 索引与根入口的目录链接；`init-arch` 负责架构文件与根入口的架构链接。
- 带同步标记的 `INITDEEP.md` 才由脚本增量处理；未标记文件及已有人工 `AGENTS.md` 必须先确认改动。
- 各级 `INITDEEP.md` 与架构文件使用普通链接按需读取；不在 `CLAUDE.md` 中自动导入详细正文。
- 技能正文留流程，模板和边界留 references；已有 `AGENTS.md` 作为项目上下文保留。

## 反模式

- 把完整目录索引或架构约束复制进根 `AGENTS.md`，造成每轮上下文累积；
- 改标记格式时只改模板，漏掉 `scan.mjs` 和 `validate.mjs`；
- 未核对实际代码就断言模块间依赖方向。

## 调试路径

1. `scan.mjs` 未找到索引 → 确认文件名为 `INITDEEP.md` 且未被 git 忽略；
2. `validate.mjs` 报错 → 检查同步标记、章节和相对链接；
3. 架构入口缺失 → 核对 `ARCHITECTURE.md` 存在且根入口链接可达。
