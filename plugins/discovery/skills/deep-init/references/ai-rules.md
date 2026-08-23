# 面向 AI 的定制规则与约定文件

与 [optional-docs.md](optional-docs.md) 互补：那边是**给人类社区看的开源公约**，
这边是**用户写给 AI 的特制内容**——项目总览、行为约定、访问边界。
本目录给出 2026 年的工具生态现状与同步策略，供第 5 步盘点对照。

## 目录

- [总览与约定该放哪：AGENTS.md 已经是答案](#总览与约定该放哪agentsmd-已经是答案)
- [三层模型：用户约定的归属](#三层模型用户约定的归属)
- [工具读取路径地图](#工具读取路径地图)
- [同步策略：单一事实源](#同步策略单一事实源)
- [边界约束类：AI 忽略清单](#边界约束类ai-忽略清单)

---

## 总览与约定该放哪：AGENTS.md 已经是答案

AGENTS.md 由 OpenAI、Google、Cursor、Amp、Factory 共创，现由 Linux 基金会
Agentic AI Foundation 托管，60k+ 项目采用。它的官方定位就是
**"README for agents"**：项目概览、构建测试命令、代码风格、安全注意——
即「总览 + 用户给 AI 的约定」。因此：

- **不要另立 `PROJECT_OVERVIEW.md` 之类的总览文件**——根 AGENTS.md 的
  「概述 + 导航指南」段就是 AI 视角的总览，重复建文件只会制造两份真相；
- monorepo 场景官方推荐嵌套 AGENTS.md（就近生效，OpenAI 主仓有 88 个），
  与本技能的分层生成天然一致；
- 冲突裁决规则：**离被编辑文件最近的 AGENTS.md 胜出，用户当轮对话指令最高**。

真正需要补的是下面两件事：多工具适配层、以及约定的分层归属。

## 三层模型：用户约定的归属

| 层 | 典型位置 | 是否提交 | 放什么 |
| --- | --- | --- | --- |
| 个人全局 | `~/.claude/CLAUDE.md`、各工具全局配置 | 否 | 个人语言、风格、习惯偏好 |
| 项目共享 | 根 AGENTS.md（+ 各工具适配文件） | 是 | 团队约定、架构约束、命令 |
| 本地私人 | `CLAUDE.local.md` 等并加入 `.gitignore` | 否 | 实验性偏好、未收敛想法 |

Claude Code 已弃用 `CLAUDE.local.md` 自动加载，改用 `@import` 引入；
私人层文件务必自行加入 `.gitignore`。盘点时发现约定散落在错误层级
（如把团队约定写进个人全局），应在回报中提示迁移。

## 工具读取路径地图

| 工具 | 默认读取 | 接入 AGENTS.md 的方式 | 适配形态 |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md` | `@AGENTS.md` 单行引用 | 指针（第 5 步已做） |
| Codex / Cursor / Windsurf / Jules / Devin / Amp / goose / opencode / Zed / Warp / VS Code / Junie | `AGENTS.md` | 原生支持 | 无需适配 |
| Gemini CLI | `GEMINI.md` | `.gemini/settings.json` 设 `"context": {"fileName": "AGENTS.md"}` | 配置指针 |
| Aider | `CONVENTIONS.md` | `.aider.conf.yml` 设 `read: AGENTS.md` | 配置指针 |
| GitHub Copilot（IDE 内联） | `.github/copilot-instructions.md` | 不支持引用 | 快照 |
| Cline / RooCode | `.clinerules/` 目录拼接 | 放一个引导文件 | 指针 |
| Kiro | `.kiro/steering/*.md`（frontmatter 控制载入时机） | 放一个引导文件 | 指针 |

## 同步策略：单一事实源

与本仓库市场清单的架构原则同构：**AGENTS.md 是唯一手写源，
其余工具文件一律视为导出物**。导出物两种形态：

1. **指针型（默认推荐）**：正文一两行，指示 agent 自行读取根 AGENTS.md。
   零漂移、零维护；适用于所有能跟随读文件的现代 agent；
2. **快照型**：全量复制正文。仅用于既不原生支持、又不能跟随读取的场景
   （典型：Copilot IDE 内联）。每次更新 AGENTS.md 后必须重新导出。

无论哪种形态，导出物首行必须带标记：

```html
<!-- generated from AGENTS.md; do not edit -->
```

更新 AGENTS.md 后，扫描各导出物的标记确认是否需要重导；发现手改过的
快照型文件按问询协议 Q2 同等对待。

## 边界约束类：AI 忽略清单

`.aiignore`（GitHub Copilot）、`.cursorignore`、`.aiderignore`、
`.codeiumignore` 等，控制哪些路径对 AI 不可见。取舍原则：

- 仅当排除范围**超出 `.gitignore`**（如敏感脚本、内部文档）才值得创建；
- 内容以 `.gitignore` 为底、只追加 AI 特有增量，避免双处维护同一份清单;
- 创建前走 Q4 问询，明确告知影响面。
