# agent-studio

帮助用户搭建本地全局、属于自己的 Agent 与 Workflow 体系。通过分支问答确定用途、触发方式、工具和模型，从当前宿主的真实模型目录中匹配候选供用户选择，生成个人角色和独立流程入口。

版本：**0.0.2**。这是构建个人 Agent 体系的辅助插件。生成的文件归用户所有；建成后可以直接使用已有角色或流程，移除本插件与管理记录后仍可工作。技能与脚本自包含，可单独安装，无 npm 运行时依赖，需要 Node.js >=18。

## 使用方式

```bash
npx skills add . --skill agent-studio
```

Claude Code 2.1.275+ 安装整个插件：

```text
/plugin install agent-studio --marketplace xiaolfeng/ai-marketplace
```

安装后可以直接描述需求：

> 帮我建立自己的资料整理助手，所有项目都能用。先让我选跟随当前会话还是固定模型，固定模型请从已有列表给我选。以后我说“整理学习资料”时就能用它。

或者：

> 帮我搭建一套个人写作 workflow，先整理提纲，再由另一个角色检查表达，最后等我确认。复用已有角色就可以，缺的再创建。

Claude 安装整个插件后可用 `/agent-studio:agent-studio`，Pi 按技能发现方式调用。只创建角色或流程时不会自动执行业务任务。

## 问答怎样展开

| 分支          | 需要确认的内容                                                     | 交付                     |
| ------------- | ------------------------------------------------------------------ | ------------------------ |
| 创建 Agent    | 主要用途、输入输出、触发场景、默认/固定模型、工具                  | 用户级原生角色           |
| 创建 Workflow | 总体目标、成员复用、步骤交接、每个新成员的模型、确认位置和流程触发 | 独立工作流技能及所需角色 |
| 管理模型      | 浏览筛选、用途映射或更新映射；从真实目录选择                       | 用户模型专题记录         |
| 维护已有体系  | 只补问本次要改的职责、触发、模型或步骤                             | 更新后的用户文件         |

问题按回答逐层展开，已提供的答案直接复用。模型先选策略：跟随当前会话默认模型，或从目录中选择固定模型。固定模型按 provider、名称与 ID 匹配，不默认要求手填 ID；同名不同 provider 分开列出。候选很多时收窄或分页，不静默漏掉其余结果。

触发场景写进角色/技能 description，同时交付明确的调用名称。按用途自动匹配由宿主模型决定；明确命令可以直接加载流程。

## 文件归属与独立使用

| 内容          | Pi 默认路径                        | Claude 默认路径                  |
| ------------- | ---------------------------------- | -------------------------------- |
| 个人 Agent    | `~/.pi/agent/agents/<id>.md`       | `~/.claude/agents/<id>.md`       |
| 个人 Workflow | `~/.pi/agent/skills/<id>/SKILL.md` | `~/.claude/skills/<id>/SKILL.md` |
| 模型/构建记录 | `~/.pi/agent/.xlf-marketplace/`    | `~/.claude/.xlf-marketplace/`    |

尊重 `PI_CODING_AGENT_DIR` 与 `CLAUDE_CONFIG_DIR`。全局默认不会在当前业务项目创建 `.xlf-marketplace/`。显式项目作用域仅用于用户要求及旧版兼容。

Agent 使用宿主原生子代理入口；Workflow 导出为宿主可发现的独立技能。Pi 直接 `/skill:<id>`，Claude 直接 `/<id>`。流程中包含角色路径、完整模型值或继承策略、任务与材料交接、失败处理及确认位置。正常运行不再读取构建期模型 profile，也不调用插件的 run-* 脚本。

Pi 仍需要用户级 Markdown 子代理加载器；本插件不会替用户安装执行扩展。工作流本版导出顺序技能，不生成 Pi 专用 JS，不提供并行 DAG。手工移动配置根后需要更新工作流里的绝对角色路径。

## 脚本入口

脚本随技能安装，实际调用使用安装后的绝对路径：

```bash
node '<技能目录>/scripts/cli.mjs' host --host pi
node '<技能目录>/scripts/cli.mjs' init --host pi --adapter pi-subagent-v1
node '<技能目录>/scripts/cli.mjs' inventory --host pi
node '<技能目录>/scripts/cli.mjs' model-list --host pi
```

Claude 使用 `--host claude`，初始化省略 adapter。模型候选通过宿主真实目录导入后可用 `model-candidates --query '<关键词>'` 筛选。Agent 的 model 为 null 表示跟随默认，否则引用已登记用途 profile，导出时写入原生值。

将定义放进配置根内 `.xlf-marketplace/drafts/` 后，可依次 `agent-save`、`agent-render --apply`、`workflow-save`、`workflow-render --apply`、`check`。完整参数见 [契约参考](skills/agent-studio/references/contracts.md)，对话过程见 [问答路径](skills/agent-studio/references/interview.md)。

## 维护与验证

- 模型目录是发现快照，新的选模会话重新读取；profile 是用户选择后的用途记录。目录发现和登记都不证明付费接口实际调用成功。
- 修改 profile 后重新生成相关角色与工作流；已导出的固定模型不随映射静默改变。默认策略则在每次派发时继承当前会话。
- 未托管文件与手改文件受到保护；不同内容不会覆盖。已有角色若无法无损导入，保留文件并说明差异，选择新 ID 或人工维护方式。
- 0.0.1 的项目模式及 run-* 保留兼容，需显式项目根；新的全局流程直接使用独立入口。

```bash
npm test
claude plugin validate .
npx skills add . --list
npm run check
```

测试覆盖两个宿主的全局路径、默认/固定模型、候选匹配与凭据字段拒绝、独立导出、移除管理记录后的文件完整性、覆盖保护与旧项目运行。文件级验证不代表宿主已加载或真实模型调用成功；模型行为评估用例见 [evals.json](skills/agent-studio/evals/evals.json)。

设计演进见 [全局构建设计](../../docs/engineering/design/0002-plugin-agent-studio-global.md)；原项目执行方案作为历史材料保留。
