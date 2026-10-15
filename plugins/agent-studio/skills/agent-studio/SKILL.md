---
name: agent-studio
description: >
  在当前 Agent 工具中搭建和维护用户自定义的 Agent 工作组与顺序工作流。
  用户要创建代理小组、自定义 workflow、登记模型、修正 provider/model、生成 .claude/agents
  或 .pi/agents 配置、继续已有 Agent Studio 工作流时使用。通过 .mjs 管理
  .xlf-marketplace/models 等专题记录。首版适配 Claude Code 与兼容 Markdown 子代理的 Pi。
  普通业务开发、安装现成插件、直接执行任意命令不由本技能接管。
compatibility: Node.js >=18；Claude Code 或已确认项目级子代理加载能力的 Pi。
---

# Agent Studio

把使用者自己的角色和流程写成可维护的定义，再按当前宿主生成配置。业务步骤来自
用户要求。脚本管理模型登记、文件生成和顺序进度；模型调用由当前宿主完成。

## 定位入口

脚本在本技能目录的 `scripts/cli.mjs`，参考在
[references/contracts.md](references/contracts.md)。相对路径以本技能所在目录解析，
不要假定安装目录就是项目目录。每次执行都用绝对脚本路径及明确的 `--root` 项目根。

```bash
node '<本技能绝对目录>/scripts/cli.mjs' help
node '<本技能绝对目录>/scripts/cli.mjs' host --root '<项目根>'
```

命令成功返回 JSON `ok:true`；错误在 stderr 返回 `ok:false` 并以 1 退出。
首版仅处理项目级配置，不能改写用户级目录或凭据。

## 先确认正在使用的工具

1. 从当前会话工具契约确认 Claude Code 或 Pi，再调用 `host` 核对。不要根据项目内
   `.claude/`、`.pi/`、`CLAUDE.md` 或安装过的 CLI 猜测当前宿主。
2. 若脚本返回 `host:null`，在会话上下文足够明确时显式传 `--host claude|pi`；上下文
   也不明确时询问用户正在用哪个工具。遇到 HOST_CONFLICT 先查明运行环境，不能
   清除标记后强行继续。其他工具暂不支持生成，说明所缺适配。
3. Pi 须确认当前会话有能读取 `.pi/agents/*.md` 的子代理工具，及其真实参数与工具名。
   对得上本技能契约后，初始化传 `--adapter pi-subagent-v1`；只有基本 Pi 主代理时，
   不能宣称已经拥有子代理执行能力，也不要自行安装扩展。
4. 后续每个命令明确传 `--host`。以前登记的宿主不是当前会话证据。

## 初始化与模型专题

```bash
node '<技能目录>/scripts/cli.mjs' init --root '<项目根>' --host pi --adapter pi-subagent-v1
```

Claude 使用 `--host claude`，省略 adapter。初始化保留既有配置，不填默认模型。
先运行 `model-list`，复用用户登记的 profile；新增时从用户给出的配置或当前宿主
模型选择器取得准确值，不根据模型印象编造 ID。Pi 可用 shell 注入的 `PI_PROVIDER`
和 `PI_MODEL` 核对当前选中值，但它们不代表其他模型可用。

Pi 通过 `model-set --id <profile> --provider <provider> --model <provider 内 ID>`
登记；Claude 只传 `--model <原生值>`。先读契约中的模型例子。
不对 Claude ID 删斜杠前缀，不自动替换模型，不把登记视作已验证授权。
更新既有映射时仅在用户需求包含该更新后使用 `--replace`，并说明影响的 Agent
需要重新渲染；旧运行快照不会自动换模型。

## 创建或维护工作组

1. 从用户目标提取角色的职责、输入、输出、model profile 和工具需求。足够明确则
   直接起草；缺少关键模型或职责信息时集中询问。避免预设所有人都需要开发流水线。
2. 按 [examples/agent.json](examples/agent.json) 写项目内定义文件。model 是已登记
   profile，不能直接填模型 ID。`read-only` 只允许 read/search，不能为了跑命令加 shell。
   确实要运行命令的角色使用 workspace-write 并明确说明其写入能力。
3. `agent-save --file <项目相对路径>` 保存通用定义；`agent-render --id <角色>` 预览
   原生路径、模型和工具。用户已授权生成配置时接着加 `--apply` 落盘，无需重复确认。
4. 遇到 UNMANAGED/DRIFT，展示真实差异并让用户决定如何保留，不删除文件或重建
   管理记录来绕过检查。更新未被手改的插件生成文件可用 `--apply --replace`。
5. 需要多个成员时按同样方式分别登记。提供自定义角色文件并不代表宿主已加载；
   按当前工具的加载方式核对。Pi 项目代理可能需要 project/both scope。

## 编写与执行工作流

按 [examples/workflow.json](examples/workflow.json) 组织用户需要的步骤，步骤数量不限。
每步指定 agent、task、inputs、outputs 和 approval。需要调用已有技能时，将当前
环境实际可用的技能路径及其职责写入 task，并在派发前读取；不要发明跨宿主通用
的 Skill 调用 API，也不要假定子代理继承了父会话加载的技能。

`workflow-save --file <项目相对路径>` 保存后执行 `check`。若用户只要求搭建流程，
交付配置即可；用户已要求执行时继续：

1. `run-start --workflow <id>` 创建运行，保存返回的 run ID。
2. `run-next --run <id>` 获取当前步骤。按返回的 agentPath、model、task 和输入快照
   构造完整派发请求，要求代理返回或写入指定输出。使用当前宿主实际提供的子代理
   工具，显式选择配置的代理和模型；没有该能力则说明阻塞，不假装已执行。
3. Pi 字符串入口使用返回的 `model.native`（provider/model）；结构化入口使用
   `model.provider` 和 `model.model` 分开传入。Claude 使用其登记的原生值。工具若
   不支持这些字段，以已渲染代理定义为准；无法确认加载契约时停止派发。
4. 等待真实完成事件，读取结果和实际验证证据。失败、取消、输出不完整时保持当前
   步骤；不能用占位文件或自写成功结论推进。只读代理的结果由主代理写入所指定
   工件路径，勿因此扩大子代理权限。
5. 审核结果符合该步骤 task 后，运行 `run-complete --run <id> --step <id>`。
   approval 为 true 时，等待实际用户确认后再用 `--approval '<确认内容>'` 记录。
   不得把文本记录字段当作具备独立身份认证的批准凭证。
6. 继续 run-next，直到返回 completed。恢复时复用原 run ID。遇到历史工件或原生
   代理漂移时说明变化；修改原始定义后可开始新运行，不悄悄改旧快照。

## 交付与限制

交付具体文件路径、宿主及适配器、已登记模型、检查结果、运行 ID（如有）。区分
“已生成”“静态检查通过”“宿主实际加载”“模型实际调用成功”。脚本只验证文件、
字段和顺序，不保证内容质量或最终路由，不能声称消除了所有错误模型调用。

脚本不运行用户配置里的 shell 命令；测试或业务验证需要写入步骤任务，并由宿主
按授权执行。工作流中的人工确认是协作约定；本插件不是操作系统沙箱。
