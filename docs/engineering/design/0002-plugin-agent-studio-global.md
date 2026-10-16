# Agent Studio：本地全局 Agent 体系构建

> 状态：draft · 2026-10-16
> 承接：用户明确要求以辅助插件构建个人全局 Agent/Workflow、从已有模型列表选择，生成后脱离插件使用；替代 [原项目工作组设计](0001-plugin-agent-studio.md) 的产品定位与默认作用域。
> Scope：plugin。实现入口：[agent-studio](../../../plugins/agent-studio/README.md)。

## 目标与边界

Agent Studio 通过问答把用户的用途、触发场景、模型策略和协作方式写成用户全局原生文件。它维护构建期的模型用途记录与角色/流程定义，交付可直接使用的 Agent 和独立 Workflow 技能。创建结束后，日常任务由这些成果承担。

| 范围     | 本次实现                                          | 限制                                     |
| -------- | ------------------------------------------------- | ---------------------------------------- |
| 默认归属 | Pi/Claude 用户级配置根                            | 自定义根需显式声明；旧项目命令保留兼容   |
| 问答     | 类型、用途、触发、默认/固定模型、工具、成员与交接 | 自动触发依赖宿主模型，不作保证           |
| 模型     | 宿主目录快照、候选匹配、用户用途 profile          | 不写凭据或 provider 配置，不验证真实调用 |
| Agent    | 用户级 Markdown，继承或固定模型                   | Pi 仍需兼容的子代理加载器                |
| Workflow | 用户级独立顺序技能，内联任务和路由信息            | 不生成并行 DAG 或 Pi 专用 JS             |
| 维护     | 覆盖保护与重新生成                                | 手改/未托管文件不能自动无损接管          |

## 工作方式

### 问答入口

[SKILL.md](../../../plugins/agent-studio/skills/agent-studio/SKILL.md) 负责对话路由，[interview.md](../../../plugins/agent-studio/skills/agent-studio/references/interview.md) 定义按回答展开的问题。入口分为创建 Agent、创建 Workflow、管理模型、维护已有体系。复用对话已有答案，每批至多四问，只补本分支缺失的信息。

Agent 分支确认职责、输入输出、触发正反例、默认/固定模型和工具。Workflow 分支先确认总体目标与交接，再复用实际已有成员或创建新成员。每个成员可独立选模。创建请求提供常规生成授权，必要信息齐备后直接生成；遇到真实冲突才请求用户决定。

### 全局位置

[cli.mjs](../../../plugins/agent-studio/skills/agent-studio/scripts/cli.mjs) 根据真实宿主解析 user 根。Pi 尊重 PI_CODING_AGENT_DIR，默认 `~/.pi/agent`；Claude 尊重 CLAUDE_CONFIG_DIR，默认 `~/.claude`。原生角色在 agents，流程技能在 skills，构建记录在根内 `.xlf-marketplace`。全局命令不使用当前业务项目存放用户体系。

默认未传 root/scope 为 user。显式 scope 为 user 时 root 可覆盖用户根。仅传 root 且省略 scope 继续表示旧 project 模式；项目原生路径仍加 `.pi/` 或 `.claude/` 前缀。host 查询不创建目录，init 才创建配置根。全局 run-* 被拒绝。

### 模型发现与记录

宿主会话负责读取实际目录。Pi codemode 使用 `models.getAvailableOfType("chat")`，仅提取 provider、id→model、name；没有该接口时使用已验证的宿主列表入口。Claude 由实际模型选择器/会话目录提供原生值。没有候选时选择刷新、重新筛选或默认模型，不猜 ID。

[catalog.mjs](../../../plugins/agent-studio/skills/agent-studio/scripts/catalog.mjs) 校验候选快照、拒绝多余字段与跨宿主污染，再按名称、ID、provider 返回完整匹配集合。问答层负责收窄/分页并让用户选择，不要求记忆长 ID。快照须在新选模会话刷新；不提供自动后台同步。

[models.mjs](../../../plugins/agent-studio/skills/agent-studio/scripts/models.mjs) 保存用户选定的用途 profile。Agent 的 model 为 null 时返回 inherit 策略，原生文件不输出 model 行；固定 profile 在生成时解析并内联 provider/model 或 Claude 原生值。默认策略随以后派发会话变化，固定策略只有重新生成才改变。

### 原生交付

[definitions.mjs](../../../plugins/agent-studio/skills/agent-studio/scripts/definitions.mjs) 校验和生成角色；工具与模型字段写在原生 frontmatter。read-only 只含 read/search，shell 不能归类为只读。

[exports.mjs](../../../plugins/agent-studio/skills/agent-studio/scripts/exports.mjs) 的 `inventory` 列出实际原生角色供访谈选择。独立流程导出前检查引用角色已经生成且与定义一致。输出 skills 下的 SKILL.md，包含流程触发说明、绝对角色路径、固定模型或继承策略、所有任务、材料/工件关系、独立输出目录、失败停留与真实人工确认要求。派发前核对角色来源，避免同名项目角色遮蔽。

独立技能直接使用宿主子代理工具。它不读取模型 profile 或构建脚本；保留角色和技能即可移除插件及构建记录。宿主加载器和用户自己选用的外部工具/技能仍是依赖。加载方式或模型路由无法满足时停止并说明缺口。

## 数据与接口

所有持久化 JSON 保持 schemaVersion:1；旧定义字符串 model 继续有效，null 增加继承语义。description 最大 1024 字符并承载触发场景。catalog 新增按宿主的 source/models 文件，条目仅允许 provider/model/name（Claude 不接收 provider）。完整字段见 [契约](../../../plugins/agent-studio/skills/agent-studio/references/contracts.md)。

新增命令为 inventory、model-catalog-save、model-candidates、workflow-render；所有命令支持 scope。workflow-render 默认预览，加 apply 才落盘，返回直接调用方式及角色依赖。user 模式 check 还验证独立工作流是否缺失/过期。

## 异常与兼容

复用原子单文件写入、合作锁和摘要覆盖保护。工作流摘要与 Agent 摘要分目录，旧项目 Agent 记录路径不变。手改返回 DRIFT，未托管不同文件返回 UNMANAGED，插件不删记录绕过这些检查。已有第三方原生角色若无法按当前四类工具无损表达，保留原文件，展示差异并选新 ID 或人工维护。

0.0.1 的 runs 保留在显式项目模式内，原快照、确认、工件检查不改变。全局流程通过导出技能运行，不依赖这些命令。路径/锁/摘要属于合作检查，不防御同机恶意写者；人工确认也不是身份认证。

若需要长期运行调度、跨机执行或大量宿主专用 API，应重新评估宿主原生工作流扩展；保留用户原生文件作为退出路径，不将插件扩张成常驻执行平台。

## 验证

| 验证项                       | 入口与预期                                                   |
| ---------------------------- | ------------------------------------------------------------ |
| 两个宿主的全局根与自定义目录 | global.test.mjs；隔离 HOME，不写真实用户配置                 |
| 默认/固定模型                | 默认不写 model，固定保留 provider 与完整 ID                  |
| 目录匹配与隔离               | 同名跨 provider 分开、零匹配不编造、拒绝凭据字段             |
| 脱离插件使用                 | 删除临时构建记录后，原生角色与独立技能保留全部任务/路由信息  |
| 文件保护                     | 预览不写文件、手改/未托管内容拒绝覆盖、缺工作流时 check 失败 |
| 旧项目兼容                   | 原 studio.test.mjs 覆盖快照、模型边界与顺序验收              |
| 分发                         | validate、skills 发现、Cursor build/check                    |

本轮已读取当前 Pi 的运行时模型目录，接口返回 20 项；这证明候选读取入口可用，不等于模型逐一调用成功。自动化脚本测试与分发检查在完成后以实际运行结果回报。宿主 UI 加载、真实模型派发和多轮问答 A/B 尚未端到端验收。

| 现状类别   | 内容                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 当前工作树 | 全局生成、继承策略、模型目录快照/筛选、独立流程导出、分支问答与兼容代码 |
| 后续适配   | Pi 原生工作流 JS、并行 DAG、更多宿主、复杂第三方角色的无损导入          |

## 依据与源码

| 主张                                             | 依据                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Pi 支持用户级技能与明确技能命令                  | Pi 1.2.0 安装包 docs/skills.md 与 docs/configuration.md                                                   |
| Pi 运行时能列出 chat 模型且无需输出凭据          | Pi 1.2.0 docs/codemode.md；本轮接口实测                                                                   |
| Pi 示例子代理的用户 agents 路径与省略 model 继承 | Pi 1.2.0 examples/extensions/subagent/README.md                                                           |
| Claude 用户级角色与技能                          | [subagents](https://code.claude.com/docs/en/sub-agents)、[skills](https://code.claude.com/docs/en/skills) |

## 待确认

无阻塞当前实现的事项。当前设计状态为 draft，不将用户的产品方向澄清视作文档 accepted 或发布授权。
