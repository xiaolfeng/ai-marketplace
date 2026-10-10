# discovery

项目目录索引与架构层约束插件。两个技能共用简短的 `AGENTS.md` 入口：它只说明项目用途、常用检查和任务所需的阅读路径；详细内容由任务按需打开。

## 技能

| 技能 | 产出 | 用途 |
| --- | --- | --- |
| [`init-deep`](./skills/init-deep/) | 根及选定子目录的 `INITDEEP.md` | 目录职责、修改入口、局部约定与分层导航；脚本负责扫描和校验 |
| [`init-arch`](./skills/init-arch/) | 根 `ARCHITECTURE.md`，必要时 `docs/architecture/<layer>.md` | 模块依赖、跨层不变量、层级约束与验证路径 |

两技能各自维护根 `AGENTS.md` 中与自己相关的一条阅读入口；已有人工内容须确认后才缩减。它们不会自动扩充 `CLAUDE.md` 或将详细文档导入项目指令。规则与来源见 [`skills/_shared/agents-entry.md`](./skills/_shared/agents-entry.md)。

`init-deep` 仍支持可选的社区公约及跨工具适配盘点：命中条件后经用户选择才生成。原有 `AGENTS.md` 作为输入保留；旧索引迁移时先审阅，再生成 `INITDEEP.md`。

## 安装与使用

```bash
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install discovery@ai-marketplace

# 支持 Agent Skills 的工具
npx skills add xiaolfeng/ai-marketplace --skill init-deep --skill init-arch
```

在目标项目中说「初始化知识库」或调用 `/init-deep` 生成目录索引；说「初始化架构」或调用 `/init-arch` 梳理架构层约束。Claude Code 以插件形式安装时对应 `/discovery:init-deep` 和 `/discovery:init-arch`。评测场景分别见 [`init-deep`](./skills/init-deep/evals/evals.json) 和 [`init-arch`](./skills/init-arch/evals/evals.json)。
