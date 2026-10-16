---
name: agent-studio
description: >
  辅助用户搭建本地全局、属于自己的 Agent 与 Workflow 体系。用户要创建或调整个人代理、
  设计可复用工作流、梳理已有角色、查看匹配模型列表、记录模型用途与派发映射时使用。
  通过分支问答收集类型、用途、触发条件、默认或固定模型与工具，生成用户级原生 Agent
  和独立 Workflow 技能；生成后可脱离本插件直接调用。支持 Claude Code 与兼容 Markdown
  子代理加载器的 Pi。执行已有角色的日常任务时直接使用对应 Agent/Workflow。
compatibility: Node.js >=18；Claude Code 或有用户级 Markdown 子代理加载器的 Pi。
---

# Agent Studio

帮助用户建立自己的本地全局 Agent 体系。交付物是宿主直接读取的角色文件与工作流技能，模型专题记录辅助后续维护。插件负责构建；建成后，任务由已有 Agent/Workflow 承担。不要因为当前打开了代码仓库，就把用户的个人体系建进该项目。

## 开场与分支问答

先读 [问答路径](references/interview.md)，复用用户已经给出的答案，按分支补问。使用当前宿主的结构化问答工具，每批最多 4 问，每题 2–4 个选项；支持补充文本。先确定“创建 Agent / 创建 Workflow / 管理模型 / 维护已有体系”，再展开相关问题。用途和触发条件不预设为开发、审查、测试或发布；允许学习、写作、资料整理等任意职责。用户已说明目标时，直接进入对应分支，避免再问相同问题。

依次确认：

1. **用途与边界**：主要做什么、输入什么、交付什么，哪些事交回调用者。
2. **触发方式**：用户会怎样表达需求、适用场景和相邻但不适用的场景；默认允许按 description 匹配，也给出明确调用方式。匹配是模型行为，不能保证自动触发。
3. **模型策略**：继承派发时的会话默认模型，或从实际模型目录选择固定模型。不要把“默认”误写为创建时当前模型的固定 ID。
4. **工具和协作**：需要哪些工具、是否允许修改文件、是否需要用户确认。Workflow 另外确认步骤、成员复用、材料交接、失败处理及确认位置。

用户提出创建即授权在约定的用户全局位置生成文件；必要答案齐备后，展示简短配置概览并落盘，不为常规创建追加确认。对未托管文件冲突，展示差异再让用户决定。

## 宿主与全局位置

脚本入口为本技能绝对目录下的 `scripts/cli.mjs`。参数与数据契约见 [contracts.md](references/contracts.md)。所有示例中的脚本路径都应换成安装后的绝对路径。

先从会话确认宿主，再运行：

```bash
node '<技能目录>/scripts/cli.mjs' host --host pi
node '<技能目录>/scripts/cli.mjs' init --host pi --adapter pi-subagent-v1
node '<技能目录>/scripts/cli.mjs' inventory --host pi
```

Claude 使用 `--host claude`，初始化不需要 adapter。不要通过 `.claude/` 或 `.pi/` 目录存在来认定活跃宿主。Pi 初始化前确认实际子代理工具支持用户级 Markdown 角色、工具名和模型字段。缺少加载器时说明缺少的能力，不自行安装或宣称已能调用。

默认作用域为 user：Pi 写入 `${PI_CODING_AGENT_DIR:-~/.pi/agent}`，Claude 写入 `${CLAUDE_CONFIG_DIR:-~/.claude}`。角色位于 `agents/<id>.md`，工作流技能位于 `skills/<id>/SKILL.md`，管理记录位于该根内 `.xlf-marketplace/`。后续调用保持相同宿主和作用域。全局自定义根须同时传 `--scope user --root '<根>'`。只有用户明确要项目级角色时，才使用 `--scope project --root '<项目根>'`。

## 从已有模型中选择

先读 `model-list` 复用个人模型 profile，再读取宿主实际模型目录。Pi 若有 codemode：

```js
const available = await models.getAvailableOfType("chat");
text(
  available.map((m) => ({ provider: m.provider, model: m.id, name: m.name })),
);
```

只保留 provider、model、name。不要输出整个模型对象、认证配置或完整环境变量。若无该接口，按宿主已验证的列表能力（如 Pi 的 `pi --list-models`）读取候选； Claude 从当前会话提供的模型选择器/目录获得原生值，不能硬编码一份“最新列表”。

将已读取列表整理为契约中的 catalog JSON，放在配置根内 `.xlf-marketplace/drafts/models.json`，然后：

```bash
node '<技能目录>/scripts/cli.mjs' model-catalog-save --host pi --file .xlf-marketplace/drafts/models.json
node '<技能目录>/scripts/cli.mjs' model-candidates --host pi --query '<用户关键词>'
```

catalog 是本次发现的快照，开始新的选模会话时刷新；model-list 是用户有意保存的用途映射。二者不能相互冒充。按 provider、名称或 ID 匹配候选后，显示带 provider 的选项供用户直接选择。超过问答工具容量时先按 provider 或关键词收窄，再分页；说明还有多少候选，不静默截断。选项标签可缩短，描述保留完整标识，并在内部保留精确 provider/model 元组。默认不要求用户手填模型 ID。

若选择默认模型，Agent 定义使用 `model: null`，不创建固定 profile。若选择固定模型，用 `model-set --id <用途名> --provider <原值> --model <原值>` 保存 Pi 映射； Claude 仅传原生 `--model`。profile 名按用途命名，如资料整理、写作对应的 kebab-case 标识。目录不可读或无匹配时提供刷新、换筛选、继承默认等选择；只有用户明确要求手工登记时才接受输入，不编造候选。登记不等于模型调用已验证。

## 生成 Agent

1. 用 [agent.json](examples/agent.json) 结构起草 JSON 到配置根内 `.xlf-marketplace/drafts/<id>.json`。description 写清职责与触发场景；instructions 写清输入、工作方法、输出格式、边界和失败处理。model 是 null 或已登记 profile。
2. `agent-save --file <相对路径>` 保存，`agent-render --id <id>` 预览，然后 `agent-render --id <id> --apply` 写出原生角色。
3. read-only 只含 read/search。shell 有写入能力；需要命令时明确工具和权限，不能用文字“只读”抵消 shell 的能力。本版工具映射不含 MCP 或联网；需要这些工具时说明适配缺口，不默默降低用户需求。
4. 已有角色优先通过 inventory 发现并读取；导入维护时从其实际内容起草定义，不覆盖或接管不同内容。同名全局/项目角色可能互相遮蔽，交付时核对实际加载来源。

## 生成 Workflow

1. 确认各步骤职责、角色、输入输出与确认位置。从已有全局角色复用适合的成员，缺少角色时走 Agent 分支；每个成员可独立选默认或固定模型。未登记角色先读取并起草等价定义；只有原生文件与渲染内容一致时可直接采用。存在差异时保留用户文件，展示差异并选择新 ID 或人工维护方式，不宣称已经无损导入。
2. 按 [workflow.json](examples/workflow.json) 起草 JSON，description 包含整个流程的用途与触发场景。首版支持顺序交接；需要并行/DAG 时说明尚需宿主专用适配。
3. `workflow-save --file <相对路径>` 保存；`workflow-render --id <id>` 预览，再加 `--apply` 生成为用户全局 `skills/<id>/SKILL.md`。导出包含真实原生角色路径、固定模型值或继承策略、所有任务与输入输出、失败处理和确认要求，不引用插件脚本。
4. 生成后运行 `check`，交付角色/技能的绝对路径及调用示例。Pi 工作流可直接 `/skill:<id>`；Claude 可 `/<id>`，角色通过宿主的子代理入口使用。说明按宿主需要 reload 或重启，并区分已生成、静态检查、宿主已加载、真实调用四种状态。

## 交付和维护

创建后的日常任务直接交给对应角色或工作流。不要调用 run-start/next/complete 来成为必经运行入口；这些命令只兼容旧项目记录。全局构建不在当前项目写入进度数据，也不自动执行新建流程。模型选择与生成本身不会调用付费模型 API。

更新个人体系时重新进入相关问答分支。用户要求更新已托管、未手改的文件时使用 `--replace`；UNMANAGED/DRIFT 先展示差异，不清除记录绕过保护。修改模型 profile 后提示哪些角色需要重新生成，再更新引用它们的 workflow；已导出的固定模型不会随注册表偷偷变化。生成的角色和技能是用户自己的文件，可以手工维护，移除构建插件与管理记录后仍可使用；宿主本身的加载器和用户选用的其他技能仍是实际依赖。
