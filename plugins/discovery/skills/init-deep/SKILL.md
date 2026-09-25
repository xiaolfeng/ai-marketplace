---
name: init-deep
description: >
  迭代项目目录知识索引：从内到外创建或更新各级 INITDEEP.md，并维护简短的根 AGENTS.md
  按需阅读入口。用户说「初始化知识库」「更新目录索引」「init-deep」「deep init」
  「给项目建分层导航」时使用。架构层依赖与边界文档由 init-arch 负责。
compatibility: Requires git and Node.js >= 18
license: MIT
metadata:
  version: "0.0.4"
---

# Init Deep · 目录知识索引

为项目生成按需读取的分层 `INITDEEP.md`：子目录先写，根目录最后汇总。根 `AGENTS.md` 只提供项目简介、必要命令和知识索引入口。

公共入口规范：[../_shared/agents-entry.md](../_shared/agents-entry.md)。
标记与正文模板：[references/templates.md](references/templates.md)；边界情况：[references/edge-cases.md](references/edge-cases.md)；成品示例：[根](examples/root-initdeep.md) · [子模块](examples/submodule-initdeep.md)。

## 执行

1. 运行 `node <skill_dir>/scripts/scan.mjs <项目根目录>`。读取 JSON 的文件盘点、git 状态、已有 `INITDEEP.md` 标记和增量 diff；阅读现有 `AGENTS.md`、`CLAUDE.md`、README 及相关代码，保留已有指令。
2. 按目录职责决定分层：有独立约定、入口或多个可独立描述的子系统才单独建索引；同类文件集合由上层覆盖。`tree[]` 是候选摘要，实际职责以代码为准。
3. 从最深的目录起按 [模板](references/templates.md) 写 `INITDEEP.md`，上层只链接下层。文件首行写同步标记；更新时用 `diffSinceMarker` 定位变更，保留未受影响段落；标记哈希失效按 E3 处理。对既有无标记文件按 Q2 处理；既有 `AGENTS.md` 作为输入保留，按需迁移内容前取得授权。
4. 运行 `node <skill_dir>/scripts/validate.mjs <项目根目录>`，修复 ERROR 后重跑；WARN 需在回报中说明。校验只针对 `INITDEEP.md`，不依赖 `CLAUDE.md`。
5. 按 [入口规范](../_shared/agents-entry.md) 创建或增量维护根 `AGENTS.md` 的项目简介与目录索引行。已有长篇入口需要缩减时先提草案征求确认；已有架构链接由 `init-arch` 维护。检查普通 Markdown 链接实际存在。若项目有对外协作或多工具适配需求，按 [可选公约](references/optional-docs.md) 与 [工具适配](references/ai-rules.md) 盘点候选，按 Q4 征求授权后创建。回报文件、校验结果和待确认事项。

## 边界与问询

| 情形 | 处理 |
| --- | --- |
| Q1：根 `AGENTS.md` 已存在且新入口会覆盖人工内容 | 给出保留原文并补入口、按草案缩减、维持原样三个选项；未确认时保留原文 |
| Q2：目标 `INITDEEP.md` 无同步标记 | 给出另存、确认后整合、跳过三个选项；未经确认不改写 |
| Q3：目标不是 git 仓库 | 说明无法增量同步，询问全量生成或由用户授权初始化 git；全量模式不写标记 |
| Q4：命中可选公约或工具适配信号 | 一次列出候选及影响，征得用户选择后生成；已有文件只盘点 |

`INITDEEP.md` 用来索引真实代码与文档；`AGENTS.md` 只保留每次工作都需要的指令与按需阅读路径。保持已有 `CLAUDE.md` 内容和旧版生成的 `AGENTS.md`，迁移时先对照再按 Q1 修改。架构层约束由 `/init-arch` 管理，已有架构文档可在入口中链接。

## 自检

- [ ] 根索引与各层链接指向真实文件，目录粒度符合职责边界
- [ ] 新增或更新的 `INITDEEP.md` 通过校验，人工内容得到保留
- [ ] 根 `AGENTS.md` 简述项目、指向索引，按任务指向已存在的架构文档
- [ ] 未向 `CLAUDE.md` 或 `AGENTS.md` 复制索引正文或使用 `@` 自动导入
