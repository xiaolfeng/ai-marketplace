# 数据契约与命令

## 作用域和目录

脚本使用 Node.js >=18，无第三方包。命令以 `node '<技能目录>/scripts/cli.mjs'` 开头；后续都传同一个 `--host claude|pi`。当前宿主从实际会话确认，目录存在只作提示。

默认 `--scope user`，Pi 根为 `${PI_CODING_AGENT_DIR:-~/.pi/agent}`，Claude 根为 `${CLAUDE_CONFIG_DIR:-~/.claude}`。自定义用户根传 `--scope user --root '<目录>'`。只有用户明确要求项目配置才用 `--scope project --root '<项目根>'`；仅传 `--root` 而不传 scope 兼容 0.0.1 的项目模式，避免旧命令改写用户全局数据。

```text
<用户宿主配置根>/
  agents/<id>.md                  # 用户自己的原生角色
  skills/<id>/SKILL.md            # 用户自己的独立工作流入口
  .xlf-marketplace/
    config.json                  # 已确认的宿主适配器
    models/registry.json         # 模型用途 profile，无凭据
    models/catalog-<host>.json   # 本次发现的模型候选快照
    drafts/<name>.json          # 构建时起草的输入
    agents/<id>.json            # 可维护定义
    workflows/<id>.json         # 可维护流程
    generated/<host>/...        # 生成摘要与覆盖保护
```

项目模式的原生文件位于 `<项目根>/.pi/agents/`、`.claude/agents/` 及相应 `skills/`；管理记录仍在项目根 `.xlf-marketplace/`。旧 runs 仅在项目模式保留，不参与全局体系的日常使用。

生成文件不引用本插件脚本或模型 profile。删除插件和 `.xlf-marketplace/` 后，保留的原生角色与工作流技能仍可直接使用；模型 provider、宿主加载器及用户选用的外部技能仍须存在。移动全局目录后需要更新工作流中的绝对角色路径。

## 命令表

所有命令可加 `--host`、`--scope`、`--root`，help 除外。`--file` 是配置根内的相对路径；绝对路径、`..` 与符号链接拒绝。通常把构建输入放在 `.xlf-marketplace/drafts/`，不要写进当前业务项目。

| 命令               | 参数                                                 | 行为                                                  |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| help               | 无                                                   | 显示参数与默认作用域                                  |
| host               | 无                                                   | 返回宿主、依据、scope 和解析后的根；未知宿主返回 null |
| init               | Pi 必填 `--adapter pi-subagent-v1`                   | 创建用户配置根并初始化；保留已有数据                  |
| inventory          | 无                                                   | 列出真实原生 Agent 文件；不要求归本插件管理           |
| model-list         | 无                                                   | 列出已登记的用途 profile                              |
| model-catalog-save | `--file`                                             | 校验并保存本次宿主模型目录快照                        |
| model-candidates   | 可选 `--query --provider`                            | 按名称/ID/provider 筛选候选；不自动登记               |
| model-set          | `--id --model`；Pi 加 `--provider`；可选 `--replace` | 保存固定模型用途映射                                  |
| model-resolve      | `--id`                                               | 输出完整模型值；不验证调用可用性                      |
| agent-save         | `--file`；可选 `--replace`                           | 保存角色定义                                          |
| agent-render       | `--id`；可选 `--apply --replace`                     | 默认预览，加 apply 写原生角色                         |
| workflow-save      | `--file`；可选 `--replace`                           | 校验顺序与引用，保存定义                              |
| workflow-render    | `--id`；可选 `--apply --replace`                     | 导出独立工作流技能                                    |
| check              | 无                                                   | 检查模型引用和角色；user 模式还检查工作流技能一致性   |
| run-start          | `--workflow`                                         | 仅旧项目：创建运行快照                                |
| run-next           | `--run`                                              | 仅旧项目：读取当前步骤，不派发                        |
| run-complete       | `--run --step`；需要时加 `--approval`                | 仅旧项目：检查输出并推进                              |

成功 stdout 为 `{"ok":true,...}`。错误 stderr 为 `{"ok":false,"error":{"code":"...","message":"..."}}`，退出码 1。`--apply`、`--replace` 为无值开关，replace 用于渲染时须同时 apply。

## 模型候选与用途映射

候选目录与 profile 分开：catalog 是从宿主实际读取的可选项，registry 是用户已经选定的用途记录。新一轮选模刷新 catalog，不能把历史快照当作当前可用目录。CLI 不自行运行 credential 命令、不加载 provider 扩展；Pi 会话可用 codemode 的 `models.getAvailableOfType("chat")` 提取目录，也可通过宿主已验证的列表入口读取。

catalog 只接受以下字段；`source` 描述实际来源，如 `pi-runtime`。示例标识为虚构值：

```json
{
  "schemaVersion": 1,
  "host": "pi",
  "source": "pi-runtime",
  "models": [
    {
      "provider": "example-router",
      "model": "vendor/model:revision",
      "name": "资料整理模型"
    }
  ]
}
```

Claude 条目只包含 model、name。重复 provider/model、未知字段、凭据字段与跨宿主目录拒绝。候选按 query 的空白分词做不区分大小写的包含匹配，provider 为精确匹配；不截断结果。返回 total 为完整目录数量，models 为匹配项。没有目录时返回空数组与 `refreshRequired:true`，零匹配不会补虚构结果。

profile 格式：

```json
{
  "schemaVersion": 1,
  "profiles": {
    "research": {
      "pi": { "provider": "example-router", "model": "vendor/model:revision" },
      "claude": { "model": "sonnet" }
    }
  }
}
```

Pi 精确保留 provider 与 provider 内 model ID，允许 model 含多级斜杠和冒号，native 为二者拼接。Claude 原生值不按斜杠拆分。映射不包含 endpoint、headers、apiKey，也不改变当前会话模型。固定映射校验不接受 `inherit`；继承策略由 Agent 的 `model: null` 表示，避免把继承误记为固定 profile。

登记与目录发现均不保证认证、余额、网络或最终路由。`availability` 为 `not-verified`。resolve 固定映射的 mode 是 fixed；Agent 使用 null 时内部解析结果为 `{profile:null,host,mode:"inherit",native:null,availability:"not-verified"}`。

## Agent 定义

[agent.json](../examples/agent.json) 默认继承模型，需固定时将 model 改成已登记用途 profile。

| 字段          | 约束                                                  |
| ------------- | ----------------------------------------------------- |
| schemaVersion | 1                                                     |
| id            | 不超过 64 字符 kebab-case，与文件名一致               |
| description   | 非空且最多 1024 字符，包含职责与适用触发场景          |
| model         | null 表示派发时继承会话默认；字符串引用已登记 profile |
| access        | read-only 或 workspace-write                          |
| capabilities  | 非空去重数组：read、search、edit、shell               |
| instructions  | 输入、方法、输出格式、职责边界与异常处理              |

继承模型时两个宿主的原生文件都省略 model frontmatter；固定模型时内联真实原生模型值。默认模型并不固定为创建时的会话模型。

| 能力   | Claude      | Pi          |
| ------ | ----------- | ----------- |
| read   | Read        | read        |
| search | Grep, Glob  | grep, find  |
| edit   | Edit, Write | edit, write |
| shell  | Bash        | bash        |

read-only 不允许 edit/shell。workspace-write 是工具分类，不是文件系统沙箱。Pi 适配器要求当前加载器支持这些名称及用户级 Markdown 角色；没有加载器时文件不会自动带来子代理能力。不同加载器的工具名、模型继承和 scope 需实际核对。

inventory 列出现有角色用于问答选择；未托管角色不自动成为通用定义。若已有文件与渲染内容一致可幂等采用；有格式或内容差异时保留原文件，明确差异并选择新角色 ID 或人工维护方式，不悄悄覆盖。复杂的第三方角色不能靠本版四类能力无损导入。

## Workflow 定义与独立导出

[workflow.json](../examples/workflow.json) 使用任意领域的顺序步骤。根字段是 schemaVersion、id、description、steps。description 非空且不超过 1024 字符，应写清整个流程的触发场景。每步必填 id、agent、task、inputs、outputs、approval。

inputs 可为空；`project:brief.md` 在独立技能中指本次调用的材料目录，`artifact:notes.md` 必须由更早步骤声明产出。outputs 非空，路径不能重复或互为父目录；冲突按 Unicode NFD 与小写判断，引用仍须原样匹配。approval 只能是布尔值。

保存要求成员定义存在；导出还要求原生角色已生成且一致。工作流输出完整步骤、绝对原生角色路径、模型值/继承策略、独立输出目录要求、失败停留与人工确认规则。默认不运行流程。Pi 使用 `/skill:<id>`，Claude 使用 `/<id>`；自然语言触发由宿主依据 description 决定，不保证必定触发。

导出是独立顺序技能，不假称 Pi 原生 SubagentWorkflow JS，也不提供并行 DAG 或强制执行引擎。运行时主代理使用宿主真实子代理工具、核对加载来源和模型后派发，等待真实完成并验收。只读子代理返回结果由主代理保存；人工确认不能由模型自行代答。

## 覆盖保护与旧项目兼容

每次写操作持有配置根内 `.xlf-marketplace/.lock`；单文件用临时文件加 rename。多文件操作不是事务，异常时可能留下临时文件或缺失记录。相同内容重复渲染可修复缺失摘要，旧版项目 Agent 摘要路径保持不变。

已托管且未手改的文件更新需 replace。已有不同文件未托管返回 UNMANAGED；用户修改过返回 DRIFT。不要删记录绕过保护。生成文件可脱离插件手工维护，但之后插件不会自动覆盖手改内容。

0.0.1 的项目定义、模型映射与 runs 保留原行为，仍须显式相同 root。旧运行快照固定模型、角色与输入，历史工件/输入/原生文件变化会阻止继续，缺输出或确认不能推进。全局模式拒绝 run-*，避免用户体系再次依赖插件运行入口。

常见错误：HOST_REQUIRED/HOST_CONFLICT 核对真实会话；ADAPTER_REQUIRED 核对加载器；MODEL_UNKNOWN/MODEL_HOST_MISSING 刷新目录并选择真实模型；EXISTS 确认更新范围后 replace；UNMANAGED/DRIFT 比较并保留用户文件；PATH/SYMLINK 使用配置根内真实相对路径；LOCKED 查明活跃写者后处理遗留锁。路径、摘要和确认记录用于协作检查，不是 OS 沙箱或防篡改认证。
