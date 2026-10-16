# Agent Studio：宿主感知的工作组与工作流构建插件

> 状态：superseded · 2026-10-16 · 由 [本地全局 Agent 体系构建设计](0002-plugin-agent-studio-global.md) 替代；正文保留为 0.0.1 历史方案。
> 承接：用户已确认通用插件方向，并授权详细设计与首版实现；尚无独立 RFC/ADR。
> Scope：plugin。实现入口：[agent-studio](../../../plugins/agent-studio/README.md)。

## 目标与边界

让市场使用者在当前 Agent 工具中定义自己的模型配置、Agent 成员和工作流。
业务步骤由使用者提供，插件不预设开发、审查或发布流水线。配置通过原生 Node.js
ESM 脚本维护，不新增 npm 运行时依赖，不调用付费模型接口，不读取凭据文件。

| 范围     | 首版行为                                               | 边界                                                         |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 宿主     | Claude Code、Pi 的项目级配置                           | 其他宿主明确拒绝；不写用户级目录                             |
| 模型     | 用户登记的宿主原生标识、按 profile 精确引用            | 登记不代表认证、余额或运行可用性验证                         |
| Agent    | 通用角色定义编译到宿主的 agents 目录                   | Pi 要显式声明兼容子代理加载器；不假定所有 Pi 都有 Agent 工具 |
| 工作组   | 一个工作流引用若干独立 Agent                           | 不等同于 Claude Agent Teams 的常驻队友机制                   |
| Workflow | 任意长度的顺序步骤、输入输出、人工确认记录、可恢复进度 | 不实现并行 DAG、自动重试、代码回滚或跨宿主迁移运行           |
| 执行     | 当前宿主按技能说明派发单个 Agent，脚本核对工件后推进   | 脚本不调用 shell 命令、模型 API 或自行启动子进程             |

首版将能力集中在一个可单独安装的 `agent-studio` skill，内含 scripts、references、
examples；避免仅通过 skills 安装器安装一个技能后丢失插件根目录下的共享脚本。
CLI 子命令分别管理 host、models、agents、workflows、runs，后续是否拆成多个技能
由实际路由评估决定。

## 工作方式

### 1. 确认宿主

`host` 返回当前可识别宿主及依据。优先接受 `--host claude|pi`，其含义是调用者
明确提供的宿主上下文，不是脚本独立证明。未提供时仅利用已核实的 Pi 运行标记
`AI_AGENT=pi`、`PI_CODING_AGENT=true`；不读取整个环境，也不记录会话 ID。
`.claude/` 与 `.pi/` 只作为候选提示。没有可靠标记则返回 `HOST_REQUIRED`。
若显式宿主与 Pi 标记冲突则拒绝；嵌套宿主需调用者在正确环境重新运行。
Claude 首版使用显式 `--host claude`，不猜测未核实的 CLAUDE_* 环境变量。

每次涉及宿主的命令重新解析上下文。持久化配置仅登记已初始化的适配器，不能
将上次使用的宿主当作本次正在运行的工具。Pi 初始化需要
`--adapter pi-subagent-v1`，表示调用者已确认当前工具支持该 Markdown 子代理契约。
Claude 使用 `claude-code`。没有 Pi 加载器时停在定义阶段，不能宣称代理已可调用。

### 2. 初始化与模型登记

`init` 在指定项目根创建 `.xlf-marketplace/`，模型注册表初始为空。同一宿主重复
初始化不清空任何记录；不同宿主可追加适配器登记。版本号不认识时失败，不自动迁移。

`model-set --id <profile> --model <native-id>` 只修改当前宿主的映射。
Pi 额外要求 `--provider <provider>`，model 参数必须是 provider 内的 ID；允许该 ID
包含斜杠、冒号、点号等字符。输出时拼接 `${provider}/${model}`。Claude 不接收
provider 参数，model 原样传给宿主，支持用户登记的别名、精确 ID 或第三方后端 ID。
不根据斜杠猜测和剥离前缀，不补默认 provider，不硬编码随时间失效的模型列表。

既有相同记录幂等返回；变更既有映射需要 `--replace`，由技能确认这属于用户要求的
更新后使用。未知 profile、缺失宿主映射及非法字段均在写文件前拒绝。
注册表仅允许定义字段，不能夹带 apiKey、headers 或 endpoint。

### 3. 定义与生成 Agent

`agent-save --file <json>` 验证并保存通用定义，不立即写宿主文件。
`agent-render --id <agent>` 默认仅返回路径与内容；添加 `--apply` 才写入。
生成位置固定为 `.claude/agents/<id>.md` 或 `.pi/agents/<id>.md`。
使用 JSON 字符串转义生成 YAML 标量，避免 description、model 等注入额外 frontmatter。
只读模式只提供 read/search 工具，不提供 shell；shell 能写文件，不能被当作只读工具。

宿主工具映射：`read → Read/read`、`search → Grep+Glob/grep+find`、
`edit → Edit+Write/edit+write`、`shell → Bash/bash`。
显式工具列表必须非空，未知能力拒绝；宿主是否真正执行限制仍由宿主负责。
每个代理的模型必须引用登记的 profile，不接受内嵌模型字符串绕过注册表。

渲染文件和内容摘要记录在 `generated/<host>/<id>.json`。已有文件与预期一致可
幂等采用；非插件生成的不同文件一律不覆盖。更新插件生成文件也必须摘要仍与旧
记录一致并显式传入 `--replace`。手改文件视为冲突，需人工处理；首版不做删除和抢占。

### 4. 定义工作流

`workflow-save --file <json>` 先检查所有 Agent 已登记、步骤 ID 唯一、工件路径唯一，
再存储。数组顺序就是执行顺序。输入仅支持 `project:<相对路径>` 和
`artifact:<相对路径>`；artifact 必须由更早步骤声明产出，禁止前向引用、覆盖及环。
每步都需至少一个输出文件，以及非空 task。approval 是明确的布尔值。
`check` 对当前宿主解析全部模型引用，并检查原生 Agent 文件是否与当前定义一致。
输出冲突以 Unicode NFD 与小写形式比较，以拒绝大小写或规范化别名及其父路径冲突；
输入引用仍需与声明拼写一致。完成摘要使用无原型字典，允许 `__proto__` 等普通文件名。

### 5. 运行、验收与继续

`run-start --workflow <id>` 在全部静态检查和输入文件读取成功后创建独立运行。
快照包含工作流、渲染后的 Agent、精确模型标识及 project 输入文件副本；不以今后的
注册表值重新解释既有运行。每次运行目录由脚本随机生成，不接收自定义运行路径。

`run-next --run <id>` 返回当前步骤、输入快照绝对路径、输出绝对路径、Agent 名称和
模型值。宿主先读相应技能/代理指令，再派发代理；只读代理的返回文本由主代理写成
工件。插件不把收到一次文本回复等同于验证通过。

`run-complete --run <id> --step <id>` 要求指定步骤正是当前步骤，所有输出均为
非空普通文件；需要人工确认的步骤还要求 `--approval <确认说明>`。技能只能在实际
用户确认后记录该说明。记录工件 SHA-256 后推进索引。重复完成同一旧步骤会失败，
不会多跳一步。失败后索引不变，修复当前输出后可重新验收；不自动重跑 Agent。
`run-next` 再次调用可恢复同一运行。

每次 next/complete 检查当前步骤对应的宿主 Agent 文件仍匹配启动快照，以及全部
已完成工件仍匹配记录摘要。中途修改产物或代理定义会阻断推进；重新开始运行可
采用新定义。注册表后续修改不会改变旧运行已记录的模型。

确认说明是审计记录，不是独立的人类身份认证。工件检查只能证明文件与历史摘要
一致，不能证明内容正确、模型实际被调用或测试通过。测试验收仍由使用者定义步骤
并检查真实执行结果，首版不自动执行任意配置中的命令。

## 数据与接口

```text
plugins/agent-studio/
  .claude-plugin/plugin.json
  skills/agent-studio/
    SKILL.md
    scripts/{cli,store,host,models,definitions,runs}.mjs
    references/contracts.md
    examples/{agent,workflow}.json
  tests/studio.test.mjs

<project>/.xlf-marketplace/
  config.json
  models/registry.json
  agents/<id>.json
  workflows/<id>.json
  generated/<host>/<id>.json
  runs/<run-id>/
    state.json
    inputs/<index>
    artifacts/<relative-output>
```

脚本随技能分发，只保存一份实现；`.xlf-marketplace/` 专门存放使用者数据，避免
复制 `.mjs` 到每个项目后出现脚本版本漂移。首版不修改使用者的 `.gitignore`。
模型记录无密钥，仍应由使用者决定哪些配置提交；运行输入和产物可能含项目资料。

所有 JSON 带 `schemaVersion: 1`。未知字段和未知版本拒绝，文件 ID 用不超过 64 字符
的 kebab-case。CLI 返回 JSON：成功为 `{ok:true,...}`，失败为
`{ok:false,error:{code,message}}` 且退出码 1。参数缺失、重复参数、未知子命令同样失败。
示例定义与完整命令见 [契约参考](../../../plugins/agent-studio/skills/agent-studio/references/contracts.md)。

模型记录示意（虚构值，仅说明格式）：

```json
{
  "schemaVersion": 1,
  "profiles": {
    "review": {
      "pi": { "provider": "example-router", "model": "vendor/model:revision" },
      "claude": { "model": "sonnet" }
    }
  }
}
```

运行状态包含 `workflow`、`host`、`agents`、`inputs`、`index`、`completed`。
index 等于步骤数才表示全部工件已验收；完成项保存 step、outputs 的摘要与人工确认
记录（如适用）。运行完成不代表发布或业务质量认证。

## 异常与兼容

- 每次 mutation 使用 `.xlf-marketplace/.lock` 的独占创建阻止合作进程同时写；进程
  异常终止留下锁时返回 LOCKED，由使用者确认无活跃写者后移除，不自动猜测锁已过期。
- 单文件通过同目录临时文件和 rename 原子替换。多文件操作不宣称事务；原生文件与
  生成摘要之间中断可通过相同内容幂等渲染修复。初始化缺失的文件可重复 init 补齐。
- 写入/读取管理目录内数据前检查路径，拒绝绝对相对路径、`..`、反斜杠和符号链接。
  project 输入也限定项目内普通文件。项目根可由使用者明确指定并解析真实路径。
- 这些检查防止配置误操作，不是对抗同机恶意进程的文件系统沙箱；不能消除 OS 层
  检查与写入之间的竞态。JSON 快照也不抵抗有权限者手动篡改。
- 首版不接管既有代理，不默认开启网络或 shell，不跳过宿主信任/权限机制。
- `.xlf-marketplace/models/registry.json` 不是 Pi 的 `models.json`；登记不安装 provider，
  不配置认证。模型别名也可能随宿主升级改变路由，要求精确固定时应登记完整 ID。
- Pi 适配依据兼容的子代理 Markdown 契约，不自动输出或执行 `SubagentWorkflow` JS。
  该工具只在部分安装环境可用，后续适配需独立能力声明与测试。

## 验证

使用 `node --test` 与临时项目目录覆盖：

1. 项目同时含 `.claude/`、`.pi/` 时无标记不推断宿主；显式宿主与标记冲突拒绝。
2. 空注册表不能启动代理；Pi 缺 provider 拒绝，多斜杠 ID 原样保留；Claude 已登记
   值原样输出，未知 profile 失败；不探测或存储凭据。
3. Claude/Pi 分别生成正确路径、tools 和 model；只读代理不能加入 shell；未知能力失败。
4. 已有文件、用户修改、路径穿越、符号链接、锁冲突及未知 schema 均明确失败。
5. 工作流输入只引用先前工件；缺失 project 文件不创建运行；中途缺失输出不能推进。
6. 两步任意领域流程可 start → next → complete → next → complete；人工确认说明
   缺失会阻断，重复完成不能跳步，前步工件被改会阻断后步。
7. 独立复制技能目录后脚本仍能运行；说明示例通过 CLI；市场清单和 Cursor 导出一致。

仓库门禁：`claude plugin validate .`、`npx skills add . --list`、`npm run check`。
模型真实调用、宿主界面端到端派发与跨安装版本兼容性需另行记录结果，不能由单测
推断。技能触发评估单独登记测试提示，不将脚本测试冒充模型触发率评估。

### 首版工作树验收记录

2026-10-15，macOS、Node.js v26.10.0。源码以 Node.js >=18 为兼容目标，最低版本
尚未单独实测。文档状态仍为 draft，以下结果不代表发布或设计已经正式接受。

| 项目                         | 状态与证据                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| 宿主、模型、代理、工作流脚本 | 已实现；`npm test` 26 项通过                                                         |
| 独立只读检查                 | 发现大小写路径冲突与 `__proto__` 摘要丢失；先用测试复现，两项修复后全量通过          |
| Pi 配置格式                  | 用当前安装包真实 `parseFrontmatter` 解析生成文件通过；说明中的 JSON 示例可启动到首步 |
| 市场与插件清单               | 根目录与插件目录分别执行 `claude plugin validate` 均通过                             |
| 技能发现                     | `npx skills add . --list` 发现 22 个技能，包含 agent-studio                          |
| Cursor 导出                  | `npm run build` 导出 8 个插件，`npm run check` 通过                                  |
| 文档结构                     | 6 篇工程文档编号、链接、索引无异常；本次新增材料 18 条相对链接核验通过               |
| 模型与宿主端到端运行         | 尚未执行真实模型调用；未验收宿主界面加载与派发                                       |
| 技能触发评估                 | 已准备 3 个提示用例，未运行模型 A/B 评估                                             |

文档扫描器的 `parseVocab` 仅接受表格单元两侧各一个空格，对已有词表的对齐空格
产生 4 条 SCOPE-UNKNOWN 误报。按支持任意空白的解析核对，plugin 与 skill 均已登记；
没有为消除误报改动历史文档或词表。编辑器附带的 ESLint 10 检查因本仓缺少
eslint.config.* 未运行，不能将上述测试结果表述为 ESLint 通过。

## 依据与纠偏

| 核验事实                                                          | 依据                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Claude 项目子代理位于 `.claude/agents/`；model 支持别名或完整 ID  | [Claude subagents](https://code.claude.com/docs/en/sub-agents)                          |
| Claude 模型选择受后端、别名与环境配置影响                         | [Claude model configuration](https://code.claude.com/docs/en/model-config)              |
| Pi 1.2.0 提供 AI_AGENT、PI_CODING_AGENT 进程标记及 shell 会话变量 | 安装包 `docs/environment-variables.md`；[Pi 仓库](https://github.com/earendil-works/pi) |
| Pi 示例子代理有项目/用户目录，支持短模型名；model 省略可继承      | 安装包 `examples/extensions/subagent/README.md` 与 `agents.ts`                          |
| Pi provider 内 model ID 可以包含斜杠与冒号                        | 安装包 `docs/models.md`                                                                 |

前序讨论中的“Pi 一律只支持 provider/model”“目录足以识别正在运行的宿主”
“按斜杠剥离 Claude 模型前缀”“脚本可以保证模型永不出错”不作为实现依据。
本插件为了明确路由主动收紧 Pi 配置，但仍不能验证宿主实际最终选择的模型。

## 待确认

无阻塞首版实现的事项。以下扩展尚未承诺：用户级共享配置、Pi 原生工作流适配、
Claude Agent Teams、Codex/Cursor 适配、并行 DAG、自动模型目录导入。

若维护工作扩张到调度常驻服务、跨机执行、认证代理或大量宿主私有 API，应停止
扩展此薄层脚本，重新评估宿主原生机制或现有编排产品；保留 JSON 定义与工件作为
迁移出口，不将使用者数据绑定到本插件。
