# agent-studio

在当前 Agent 工具中定义自己的 Agent 工作组和工作流。插件识别宿主上下文，维护
`.xlf-marketplace/models/` 模型记录，生成宿主原生代理配置，并用 `.mjs` 检查顺序
流程的输入、输出和验收进度。业务职责、阶段数量和审批位置由使用者决定。

版本：**0.0.1**。首版提供一个自包含的 [agent-studio skill](skills/agent-studio/SKILL.md)，
支持单独安装；脚本与参考资料都放在技能目录内，无 npm 运行时依赖，需要 Node.js >=18。

## 当前支持

| 能力         | Claude Code                            | Pi                                                 |
| ------------ | -------------------------------------- | -------------------------------------------------- |
| 宿主来源     | 会话明确提供 `--host claude`           | 已核实的 Pi 进程标记或显式 `--host pi`             |
| 模型登记     | 原生别名或模型 ID，原样保留            | provider、model 分字段记录，输出 provider/model    |
| 项目级 Agent | `.claude/agents/<id>.md`               | `.pi/agents/<id>.md`；需兼容 Markdown 子代理加载器 |
| 工作流       | 主代理按当前工具契约派发，脚本记录进度 | 同左；不假设所有 Pi 安装都有 SubagentWorkflow      |

目录存在只表示项目可能适配某工具，不能证明当前启动的宿主。Pi 的
`--adapter pi-subagent-v1` 表示已确认项目代理作用域、工具名称和模型字段契约；
未安装该能力时，创建 Markdown 文件不会自动增加子代理功能。

模型登记只做结构校验和精确引用，不证明认证、余额或接口调用成功。Claude 别名的
实际路由由宿主决定。插件不修改 provider 配置或凭据、不探测模型 API。

## 使用路径

当前工作树可通过支持 Agent Skills 的安装器安装单个技能：

```bash
npx skills add . --skill agent-studio
```

发布到远程市场后，Claude Code 2.1.275+ 可使用：

```text
/plugin install agent-studio --marketplace xiaolfeng/ai-marketplace
```

直接向当前 Agent 描述需要的工作组，例如：

> 为这个项目建立两个不同职责的代理，分别收集资料和检查证据。模型使用我登记的
> research profile。流程先收集再核对，最后等我确认；先生成配置，不执行。

技能会确认宿主、复用模型记录、生成用户定义的角色与流程，并报告检查结果。安装
本插件后，Claude 可使用 `/agent-studio:agent-studio`；其他工具按其技能发现方式调用。
独立脚本也可从终端执行：

```bash
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs help
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs host --root '<项目根>'
```

完整字段与所有命令见 [契约参考](skills/agent-studio/references/contracts.md)。下面是
Claude 环境中的搭建例子；脚本路径相对于本市场仓库，安装后应换成实际技能绝对路径。
`sonnet` 仅为原生别名示例，使用时应换成用户确认的值。

```bash
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs init --root '<项目根>' --host claude
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs model-set --root '<项目根>' --host claude --id research --model sonnet
```

将示例 [agent.json](skills/agent-studio/examples/agent.json) 和
[workflow.json](skills/agent-studio/examples/workflow.json) 按实际需求调整后保存到目标
项目根目录，并创建包含主题和材料的 `brief.md`。然后：

```bash
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs agent-save --root '<项目根>' --host claude --file agent.json
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs agent-render --root '<项目根>' --host claude --id researcher --apply
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs workflow-save --root '<项目根>' --host claude --file workflow.json
node plugins/agent-studio/skills/agent-studio/scripts/cli.mjs check --root '<项目根>' --host claude
```

Pi 对应初始化加 `--adapter pi-subagent-v1`，模型登记加 `--provider`，其余命令使用
`--host pi`。不要在实际 Pi 会话里显式冒充 Claude；检测冲突会拒绝。

## 执行和维护

用户授权执行后，运行 `run-start --workflow compare`，记住返回的 run ID，再调用
`run-next --run <id>` 获取当前任务、模型和输入输出路径。当前宿主负责真实派发，
主代理核对结果后保存工件并执行 `run-complete --run <id> --step <id>`。重复
`run-next` 可恢复进度，不会自动重跑已验收步骤。需要人工确认的步骤必须在真实
确认后加 `--approval '<确认内容>'`。

- `.xlf-marketplace/` 保存使用者的配置、输入快照和工件；脚本保留在安装的技能中。
- 更新定义或模型映射使用 `--replace`；渲染更新使用 `--apply --replace`。宿主原生
  文件若由用户手改，返回 DRIFT；未托管的不同文件返回 UNMANAGED，不覆盖。
- 旧运行固定启动时的模型和代理快照；修改注册表不会悄悄改变正在恢复的运行。
- 运行文件可能包含项目资料，使用者自行决定 Git 管理范围；插件不改 `.gitignore`。

## 验证与限制

```bash
node --test plugins/agent-studio/tests/studio.test.mjs
```

测试用临时项目验证两个宿主的配置生成、跨宿主模型边界、保护已有文件、顺序推进、
审批记录、输入快照和历史工件变更，以及单独复制技能后的 CLI。测试不调用模型。
完整设计见 [Agent Studio 详细设计](../../docs/engineering/design/0001-plugin-agent-studio.md)。

首版不提供并行 DAG、用户级配置、自动回滚或模型目录同步。工件非空和摘要一致
不能证明业务正确；人工确认字段也不是独立身份认证。脚本不执行配置中的 shell
命令、不绕过宿主权限。真实模型调用、宿主加载和跨版本兼容性需要另行验收。

## 文件导航

- [SKILL.md](skills/agent-studio/SKILL.md)：调用时的操作流程。
- [scripts/](skills/agent-studio/scripts/)：宿主、模型、定义、运行与文件存储模块。
- [examples/](skills/agent-studio/examples/)：可修改的 Agent/Workflow 定义。
- [evals/evals.json](skills/agent-studio/evals/evals.json)：技能行为评估提示；不等同于已运行的模型评估。
