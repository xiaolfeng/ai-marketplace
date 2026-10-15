# 数据契约与命令

## 目录和版本

命令使用 Node.js >=18，无第三方包。以 `node '<技能目录>/scripts/cli.mjs'` 开头，
再接子命令。`--root` 是使用者的项目根，省略则使用当前工作目录；技能调用总是显式
提供根目录。`--host claude|pi` 表示当前会话宿主。JSON 文件使用 `schemaVersion: 1`，
未知字段、未知版本拒绝，ID 使用 1–64 字符 kebab-case。

```text
.xlf-marketplace/
  config.json                     # 可用适配器登记，不是当前会话的宿主证据
  models/registry.json             # 用户登记的模型映射，无凭据
  agents/<id>.json                 # 通用角色定义
  workflows/<id>.json              # 用户编写的顺序步骤
  generated/<host>/<id>.json       # 插件生成内容摘要
  runs/<run-id>/
    state.json                    # 模型/角色/步骤快照与验收进度
    inputs/<index>                # 项目输入快照
    artifacts/<output>            # 各步产物
```

脚本随 skill 安装，不复制到 `.xlf-marketplace/`。该目录的 models 注册表不等同于
Pi 的 provider 配置文件；不写 auth.json，也不注册 endpoint。

## 命令表

所有命令可加 `--root` 与 `--host`，help 除外。`--replace` 与 `--apply` 是无值开关。
`--file` 只接受项目内的相对路径；绝对路径和符号链接拒绝。

| 命令          | 参数                                                 | 行为                                                       |
| ------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| help          | 无                                                   | 命令与参数列表                                             |
| host          | 无                                                   | 返回宿主、evidence、目录候选；未知返回 host:null           |
| init          | Pi 必填 `--adapter pi-subagent-v1`                   | 初始化空注册表，保留已有数据                               |
| model-list    | 无                                                   | 列出用户登记的映射                                         |
| model-set     | `--id --model`，Pi 加 `--provider`；可选 `--replace` | 新建或更新当前宿主映射                                     |
| model-resolve | `--id`                                               | 输出结构化模型及 native 值，availability 始终 not-verified |
| agent-save    | `--file`；可选 `--replace`                           | 校验并保存角色定义                                         |
| agent-render  | `--id`；可选 `--apply --replace`                     | 默认只预览，加 apply 才写原生 Agent                        |
| workflow-save | `--file`；可选 `--replace`                           | 检查引用关系后保存流程                                     |
| check         | 无                                                   | 检查全部定义及当前宿主原生文件一致性                       |
| run-start     | `--workflow`                                         | 创建运行快照；缺模型、代理或项目输入时失败                 |
| run-next      | `--run`                                              | 返回当前步骤、绝对输入输出路径；不派发代理                 |
| run-complete  | `--run --step`；按步骤要求加 `--approval`            | 检查非空产物并记录摘要、推进索引                           |

成功 stdout：`{"ok":true,...}`。错误 stderr：
`{"ok":false,"error":{"code":"...","message":"..."}}`，退出码 1。

## 模型专题

以下 `example-router` 与 `vendor/model:revision` 是虚构值，只用于演示格式；生产配置
必须由用户实际使用的宿主模型目录或用户输入提供。

```bash
node '<技能目录>/scripts/cli.mjs' model-set --root '<项目根>' --host pi --id research --provider example-router --model vendor/model:revision
node '<技能目录>/scripts/cli.mjs' model-resolve --root '<项目根>' --host pi --id research
```

记录：

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

Pi resolve 返回 `native: example-router/vendor/model:revision`，同时保留 provider 与
model 两字段，供结构化工具接口传参。model 参数是 provider 内 ID，可含多级 `/`；
脚本不猜测 ID 是否重复写了 provider，录入时须核对原始值。provider 字符允许
字母、数字、点、下划线、连字符；若实际 provider 不满足，需扩展契约，不能改名冒用。

Claude 的 model 是原生值，可为用户明确登记的别名或后端模型 ID，原样保存。脚本
不按斜杠拆它，不检查模型网络可达性。两宿主都拒绝空白、控制字符和 inherit；未登记
的 profile 或宿主映射直接失败。模型别名可能随宿主升级指向新版本，需固定版本时
登记精确 ID。注册表不包含 API key、headers 或 endpoint。

## Agent 定义

完整例子：[agent.json](../examples/agent.json)。

| 字段         | 约束                                         |
| ------------ | -------------------------------------------- |
| id           | 与最终文件名一致，kebab-case                 |
| description  | 非空，最多 1024 字符                         |
| model        | models.profiles 中的名称，不是模型 ID        |
| access       | read-only 或 workspace-write                 |
| capabilities | 非空、去重；read、search、edit、shell 中选取 |
| instructions | 非空角色正文；业务规范由使用者维护           |

工具映射：

| 能力   | Claude      | Pi          |
| ------ | ----------- | ----------- |
| read   | Read        | read        |
| search | Grep, Glob  | grep, find  |
| edit   | Edit, Write | edit, write |
| shell  | Bash        | bash        |

read-only 不允许 edit/shell。workspace-write 是能力分类，不是文件系统访问范围
沙箱；Bash 可能访问整个宿主允许的环境。不要用“只读”指令抵消 shell 的实际权限。
首版不自动赋予 MCP、联网工具或递归代理能力。

生成路径是 `.claude/agents/<id>.md` 或 `.pi/agents/<id>.md`。Pi 必须有兼容这些工具名
和 frontmatter 的加载器；当前工具若使用不同名称或作用域，先处理适配问题。

## Workflow 定义

完整例子：[workflow.json](../examples/workflow.json)。业务步骤可自由增减，数组顺序
是执行顺序。每步字段：id、agent、task、inputs、outputs、approval，全部必填。

- inputs 可以为空；`project:brief.md` 表示项目内源文件，启动时复制为输入快照；
  `artifact:notes.md` 必须引用前序步骤的输出。
- outputs 至少一个项目相对形式的路径，但实际存入该次运行的 artifacts 目录。
  不能重复产出同一路径，也不能让一个输出成为另一个输出的父目录。为适配常见的
  大小写不敏感文件系统，冲突检查统一使用 Unicode NFD 与小写形式；输入引用仍需
  与声明的原始拼写完全一致。摘要字典不继承对象原型，允许 `__proto__` 等普通文件名。
- approval 只接受 true/false；需要审批时，模型必须等待用户实际确认，再传确认说明。
- task 可指出当前宿主已安装的技能及具体调用约定；本版本不自动扫描或安装其他插件。

只读 Agent 不能自行写工件，其返回结果由主代理核对并保存。验收仅检测非空普通文件
和既有摘要，不能替代业务验收或测试。run-next/complete 都检查输入快照和历史工件；
当前步骤的 Agent 文件也必须与启动快照一致。

## 错误与恢复

| 错误                               | 处理                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| HOST_REQUIRED / HOST_CONFLICT      | 从实际会话确认宿主；不要用目录猜测或清除进程标记强行继续 |
| ADAPTER_REQUIRED                   | 确认 Pi 的项目子代理能力与工具名后声明适配器             |
| MODEL_UNKNOWN / MODEL_HOST_MISSING | 向用户取得准确映射后登记，不选替代模型                   |
| EXISTS                             | 确认属于用户要求的更新后使用 replace                     |
| UNMANAGED                          | 目标已有其他配置；展示差异，不覆盖                       |
| DRIFT                              | 检查手工修改；旧运行不自动接受变更，必要时开始新运行     |
| INPUT / OUTPUT / STEP_ORDER        | 修正定义或完成当前步骤，不能跳步                         |
| ENOENT / OUTPUT_EMPTY              | 检查缺少的输入或输出；不要用占位结果假装完成             |
| LOCKED                             | 确认无活跃写者后处理遗留 .lock；不自动删锁               |
| SYMLINK / PATH                     | 使用项目内真实文件与相对路径，不绕过边界                 |

每次修改持有项目级合作锁，单文件用临时文件加 rename。多文件操作不是事务；生成
文件已写而记录未写时，相同内容重新渲染可修复记录。异常中止可能留下 .tmp 或未完成
的 runs 目录，未写好 state.json 的运行不能恢复，确认后可人工清理。

人工确认记录、模型快照与文件摘要都不是防篡改凭证。操作者拥有写权限时可以编辑
这些文件，本插件只提供协作状态检查。
