# AI 编码助手插件标准调研报告

> 调研日期：2026-08-23
> 项目目标：「筱锋のAI插件库」——面向 AI 编码助手的插件市场/插件库
> 调研范围：Claude Code、Codex CLI、Cursor、Gemini CLI/Antigravity、MCP、社区生态（skills.sh 等）

---

## 一、结论摘要（TL;DR）

1. **技能层已经统一**：`SKILL.md`（Agent Skills 规范，agentskills.io）已成为事实标准，被 30+ 主流工具采用（Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、Windsurf、Cline、OpenCode 等）。**一份 SKILL.md 可以跑遍几乎所有主流 agent**。
2. **插件打包层刚完成收敛**：2026-08-06 发布的 **Agent Plugins 1.0**（agent-plugins.org）由 OpenAI、AWS、Cursor、Microsoft (VS Code)、GitHub、Vercel 联合制定。目录约定为 `plugin.json` + `skills/` + `mcp.json`。Cursor 已原生兼容，Codex v0.147.0+ 已支持安装。
3. **各家仍有私有超集**：Claude Code（`.claude-plugin/plugin.json`，含 hooks/agents/LSP/monitors）和 Cursor（`.cursor-plugin/plugin.json`，含 rules/variables）在开放标准之上扩展了自己的组件。
4. **Marketplace 清单有两套主要格式**：Claude 的 `.claude-plugin/marketplace.json` 与 Cursor 的 `.cursor-plugin/marketplace.json`，结构高度相似（name/owner/plugins[]），可以做一个仓库同时输出两份。
5. **对插件库项目的建议**：以 **Agent Skills 为核心资产格式、Agent Plugins 1.0 为打包标准**，marketplace 元数据层做「一份源数据、多目标导出」（Claude / Cursor / Codex 各取所需），这是当前覆盖面最大、维护成本最低的路线。

---

## 二、标准分层全景

```
┌─────────────────────────────────────────────────────────┐
│  发现与分发层（Marketplace / Registry）                    │
│  · Claude: .claude-plugin/marketplace.json               │
│  · Cursor: .cursor-plugin/marketplace.json               │
│  · MCP Registry (server.json, REST API)                  │
│  · skills.sh（社区排行榜）+ npx skills add（通用安装器）     │
├─────────────────────────────────────────────────────────┤
│  插件打包层（Plugin Manifest）                             │
│  · Agent Plugins 1.0（开放标准）: plugin.json             │
│  · Claude Code: .claude-plugin/plugin.json（私有超集）     │
│  · Cursor: .cursor-plugin/plugin.json（私有超集）          │
│  · Codex: 支持 Agent Plugin 安装                          │
│  · Gemini CLI: gemini-extension.json                      │
├─────────────────────────────────────────────────────────┤
│  技能资产层（Skill Format）                                │
│  · Agent Skills 规范：SKILL.md（事实上的统一标准）           │
├─────────────────────────────────────────────────────────┤
│  运行时工具层                                              │
│  · MCP（Model Context Protocol）：连接外部工具的运行时协议    │
└─────────────────────────────────────────────────────────┘
```

---

## 三、各标准详解

### 3.1 Agent Skills 规范（agentskills.io）⭐ 核心资产层

一个 Skill = 一个目录 + 一个必需的 `SKILL.md`：

```
skill-name/
├── SKILL.md          # 必需：YAML frontmatter + Markdown 指令
├── scripts/          # 可选：可执行脚本
├── references/       # 可选：参考文档（按需加载）
└── assets/           # 可选：模板/静态资源
```

`SKILL.md` frontmatter 字段：

| 字段 | 必需 | 约束 |
| --- | --- | --- |
| `name` | 是 | ≤64 字符，小写字母/数字/连字符，不得以 `-` 开头结尾，须与目录名一致 |
| `description` | 是 | ≤1024 字符，说明做什么+何时用（是模型路由的关键依据）|
| `license` | 否 | 许可证名称 |
| `compatibility` | 否 | ≤500 字符，环境要求 |
| `metadata` | 否 | 自由 string→string 键值对 |
| `allowed-tools` | 否 | 空格分隔的预授权工具列表（实验性）|

**渐进式披露（Progressive Disclosure）** 是该规范的核心设计：
1. 启动时只加载所有 skill 的 `name` + `description`（~100 tokens/个）
2. 激活时才读完整 `SKILL.md` 正文（建议 <5000 tokens，<500 行）
3. `scripts/`、`references/`、`assets/` 仅按需读取

> 注意：Codex 对初始 skill 列表有 ~8000 字符预算上限（约为模型上下文窗口的 2%），超出会截断 description 甚至省略条目——所以 description 要精炼且前置关键词。

采用方（截至 2026-08，30+）：Claude Code、Codex、Cursor、GitHub Copilot、Gemini CLI、Antigravity、Windsurf、Cline、Roo Code、Kilo Code、OpenCode、Amp、Goose、Trae、Qwen Code、iFlow CLI 等。

### 3.2 Agent Plugins 1.0（agent-plugins.org）⭐ 打包层开放标准

**2026-08-06 发布**，由 OpenAI、AWS、Cursor、Microsoft (VS Code)、GitHub、Vercel 联合推出。定位：「跨客户端可移植的最小插件包」。

最小结构：

```
hello-plugin/
├── plugin.json       # 必需：位于插件根（注意：不是隐藏目录！）
├── skills/           # 可选：Agent Skills 集合
│   └── greet/
│       └── SKILL.md
└── mcp.json          # 可选：MCP 服务器配置
```

`plugin.json` 关键字段：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "hello-plugin",
  "displayName": "...",
  "description": "...",
  "version": "1.0.0",
  "author": { "name": "..." },
  "keywords": ["..."],
  "license": "MIT",
  "homepage": "...",
  "repository": "...",
  "spec_version": "1.0.0"
}
```

设计要点：
- **包边界约束**：配置中的相对路径必须以 `./` 开头并解析在插件根内；禁止用 symlink 逃逸出包。
- **mcp.json** 显式声明传输类型：`{"type": "stdio", "command": ...}` 或 `{"type": "http", "url": ...}`。
- **客户端扩展（client extensions）**：允许为特定客户端附加命名空间化的私有行为，不破坏可移植契约。
- **刻意不定义**：安装方式、分发渠道、启用/更新机制、UI——这些留给客户端实现（这正是 marketplace 的生存空间！）。

### 3.3 Claude Code Plugins（Anthropic 私有超集）

清单：`.claude-plugin/plugin.json`（藏在点目录里，与开放标准的根级 `plugin.json` 不同）。

完整组件表：

| 组件 | 位置 | 说明 |
| --- | --- | --- |
| Skills | `skills/<name>/SKILL.md` | 与开放标准一致 |
| Commands | `commands/*.md` | 旧式扁平命令文件（新插件建议用 skills）|
| Agents | `agents/*.md` | 子代理定义 |
| Hooks | `hooks/hooks.json` | 事件处理器（PreToolUse/PostToolUse/Stop 等）|
| MCP | `.mcp.json` | MCP 服务器配置 |
| LSP | `.lsp.json` | 语言服务器（代码智能）|
| Monitors | `monitors/monitors.json` | 后台监控（stdout 每行→通知）|
| bin/ | `bin/` | 加入 PATH 的可执行文件 |
| settings | `settings.json` | 默认设置（目前仅 `agent`、`subagentStatusLine` 键）|

**Marketplace 清单**（`.claude-plugin/marketplace.json`）——对本项目最关键的格式：

```json
{
  "name": "my-marketplace",
  "owner": { "name": "筱锋", "email": "..." },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    {
      "name": "quality-review-plugin",
      "source": "./plugins/quality-review-plugin",
      "description": "...",
      "version": "1.0.0",
      "category": "productivity",
      "tags": ["review"],
      "keywords": ["..."],
      "strict": true
    }
  ],
  "renames": { "old-name": "new-name" }
}
```

`source` 支持七种类型：相对路径（`./`）、`github`（repo/ref/sha）、`url`（git URL）、`git-subdir`（稀疏检出）、`npm`（包名/版本/私有 registry）、`archive`（HTTPS zip + sha256 校验）、`command`（本地命令产出，每 session 重跑）。

分发机制：
- 用户通过 `/plugin marketplace add <owner/repo>` 注册，`/plugin install <plugin>@<marketplace>` 安装
- 官方市场 `claude-plugins-official`（Anthropic 策展）+ 社区市场 `claude-community`（提交审核制，审批后 pin commit SHA，夜间同步进 catalog）
- 有保留名称黑名单（如 `agent-skills`、`claude-plugins-official` 等，第三方不可注册）
- 企业管控：`extraKnownMarketplaces` / `enabledPlugins` / `strictKnownMarketplaces`（allowlist）/ 私仓支持

### 3.4 Cursor Plugins（双格式支持）

Cursor 同时加载两种格式：

| 格式 | 清单位置 | 组件范围 |
| --- | --- | --- |
| **Agent Plugins（开放标准）** | 根级 `plugin.json` | skills + mcp servers |
| **Cursor Plugin（私有超集）** | `.cursor-plugin/plugin.json` | rules + skills + agents + commands + hooks + mcp + variables |

Cursor 私有超集的独有组件：
- **Rules**（`.mdc` 文件）：frontmatter 含 `alwaysApply`、`globs`，提供持久化编码规范
- **Variables**：manifest 里用 JSON Schema 声明变量**名**（如 API_TOKEN），真实值由用户在 Dashboard 配置，`${VAR}` 占位注入 mcp.json——这是密钥管理的优雅方案，值得借鉴
- Hooks 事件更丰富：`beforeShellExecution`、`beforeMCPExecution`、Tab 相关 hook 等

Marketplace 清单：`.cursor-plugin/marketplace.json`，结构与 Claude 版高度相似（name/owner/plugins[]，最多 500 个插件）。提交走 cursor.com/marketplace/publish，团队人工审核。

### 3.5 Codex CLI（OpenAI）

**Skills**：完全遵循 agentskills.io 标准。扫描路径优先级：

| 范围 | 位置 |
| --- | --- |
| REPO | `$CWD/.agents/skills` → 上级目录 → `$REPO_ROOT/.agents/skills` |
| USER | `$HOME/.agents/skills` |
| ADMIN | `/etc/codex/skills` |
| SYSTEM | OpenAI 内置 |

注意 Codex 用的是**中立的 `.agents/skills` 目录**（不是 `.codex/skills`）——这是跨工具共享的关键设计。同名 skill 不合并，都会出现在选择器里。

调用方式：`$skill-name` 显式调用，或按 description 隐式匹配。`agents/openai.yaml` 可声明调用策略与依赖。

**Plugins**：v0.147.0+ 支持 Agent Plugin 安装（`codex plugins search/install`），可直接装 GitHub 上的 Agent Plugin。OpenAI 官方插件库（openai/plugins）使用 `.cursor-plugin/plugin.json` 格式（即 Cursor 兼容格式）。

**Skills 分发**：官方目录 openai/skills 按 `.system`（内置）/`.curated`（审核过）/`.experimental` 三级组织，内置 `$skill-installer` 可从任意 GitHub URL 安装。

### 3.6 Gemini CLI Extensions（Google）

- 清单：`gemini-extension.json`，组件含 `contextFileName`（GEMINI.md）、`mcpServers`、`commands`（TOML 格式的自定义命令）
- ⚠️ **重要变化**：Google 于 2026-06-18 宣布 Gemini CLI 将被 **Antigravity CLI** 取代，新扩展开发应关注 Antigravity 平台
- Antigravity 同样支持 SKILL.md 技能

### 3.7 MCP 与 MCP Registry（运行时层）

- **MCP** 是连接外部工具/数据源的运行时协议（stdio/http 传输），几乎所有 agent 都已支持，是「能力接入」层的统一协议
- **官方 MCP Registry**（registry.modelcontextprotocol.io）：
  - 元数据格式：`server.json`（唯一名如 `io.github.user/server-name`、定位方式 npm 包/远程 URL、执行参数、描述等）
  - 命名空间通过 DNS 验证（`io.github.<user>/...` 需匹配 GitHub，自定义域名用 TXT 记录）
  - 发布工具：`mcp-publisher init/login/publish`
  - 定位是 **metaregistry**：只存元数据，代码托管在 npm/PyPI/Docker Hub
  - 定义了标准化 REST API（OpenAPI spec），其他 registry 可实现同接口以复用客户端支持
  - ⚠️ 官方明确表示其代码库**不支持自托管**

### 3.8 社区分发生态：skills.sh 与 `npx skills add`

Vercel Labs 于 2026-01-20 发布的 [`skills` CLI](https://skills.sh) 是当前最流行的**跨工具技能安装器**：

```bash
npx skills add vercel-labs/agent-skills              # GitHub shorthand
npx skills add vercel-labs/agent-skills --skill frontend-design -a codex -g   # 指定技能/agent/全局
npx skills find "react testing"                     # 交互式搜索 skills.sh 目录
npx skills list / update / remove                   # 生命周期管理
```

工作原理：从 git 源拉取 → 在每个 agent 的技能目录间建立 **symlink**（canonical copy 单一来源）→ 更新只需更新一处。

安装位置映射（同一份 SKILL.md，CLI 自动放置）：

| Agent | 项目级位置 |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| GitHub Copilot | `.github/skills/` |
| Gemini CLI | `.gemini/skills/` |

skills.sh 本身是目录 + 排行榜（按安装量排名，遥测匿名统计）。头部数据参考：`find-skills` 180 万+ 安装、anthropics 的 `frontend-design` 48 万+。

---

## 四、兼容性与差异对照矩阵

| 能力 | 开放标准 (Agent Skills/Plugins) | Claude Code | Codex | Cursor | Gemini CLI |
| --- | --- | --- | --- | --- | --- |
| SKILL.md 技能 | ✅ 规范本体 | ✅ | ✅ | ✅ | ✅ |
| 插件 manifest | ✅ 根 `plugin.json` | ✅ 但用 `.claude-plugin/` 点目录 | ✅ 支持安装 | ✅ 双格式 | ❌ 用 gemini-extension.json |
| MCP 配置 | ✅ `mcp.json` | ✅ `.mcp.json` | ✅ config.toml | ✅ `mcp.json` | ✅ 内嵌于扩展 |
| Rules/持久指令 | ❌ | 部分（settings/CLAUDE.md）| AGENTS.md | ✅ `.mdc` rules | GEMINI.md |
| Subagents | ❌ | ✅ `agents/` | ❌（有 agents/openai.yaml 辅助）| ✅ `agents/` | ❌ |
| Hooks | ❌ | ✅ | ❌ | ✅ 更丰富事件 | ❌ |
| 变量/密钥注入 | ❌ | `${CLAUDE_PLUGIN_ROOT}` 等环境变量 | ❌ | ✅ variables schema | ❌ |
| Marketplace 清单 | 刻意不管 | ✅ marketplace.json | 通过 plugins search | ✅ marketplace.json | ❌ |
| 官方市场 | ❌ | ✅ 审核 pin SHA 制 | ✅ 官方 catalog | ✅ 人工审核 | ❌ |

**关键洞察**：
1. `SKILL.md` 是最大公约数——任何插件库都应以它为底层资产。
2. Agent Plugins 的 `plugin.json` + `skills/` + `mcp.json` 组合能被 Cursor 直接加载、被 Codex 安装，转换到 Claude 格式只需把 `plugin.json` 移入 `.claude-plugin/` 子目录（字段基本兼容）。
3. Marketplace 层是「客户端各自为政」的重灾区，但两份主流 marketplace.json 结构相似度高，适合「单一源 → 多格式导出」。

---

## 五、对「筱锋のAI插件库」的架构建议

### 推荐方案：三层解耦 + 多目标分发

```
ai-marketplace/
├── plugins/                        # 插件源（以 Agent Plugins 1.0 组织）
│   └── <plugin-name>/
│       ├── plugin.json             # Agent Plugins 1.0 根清单（主数据）
│       ├── skills/<skill>/SKILL.md # 技能资产
│       ├── mcp.json                # 可选
│       ├── .claude-plugin/         # 构建产物：Claude 兼容层（CI 生成）
│       └── README.md
├── registry/                       # 插件库元数据（自建，单一事实源）
│   └── index.json                  # 名称/版本/分类/tags/兼容矩阵/下载源
├── dist/                           # CI 产物：各平台 marketplace 清单
│   ├── claude/.claude-plugin/marketplace.json
│   └── cursor/.cursor-plugin/marketplace.json
└── docs/
```

**理由与要点**：

1. **资产层用 SKILL.md**——一次编写，30+ 工具可用，无需转换。
2. **打包层用 Agent Plugins 1.0**——行业联合背书，Cursor 原生加载、Codex 可安装；对 Claude 的兼容成本极低（manifest 位置差异 + 可选的超集组件放 `.claude-plugin/`）。
3. **分发层做导出器而不是选边站**——写一个构建脚本从 `plugins/*/plugin.json` + `registry/index.json` 生成 Claude 与 Cursor 两份 marketplace.json（两者 schema 相似，映射简单）。后续 Codex/Gemini 有成熟市场格式时再扩。
4. **兼容 Claude marketplace 的发布规则**：插件名 kebab-case、避免 Anthropic 保留名（`agent-skills`、`claude-plugins-*` 等）、版本号变更才触发用户更新。
5. **借鉴 Cursor 的 variables 设计**：插件不携带密钥，只带 JSON Schema 声明，值由使用者配置——安全且体面。
6. **可选增值方向**：
   - 提供 `xf skills` 类 CLI（参考 `npx skills add` 的 symlink 模型）实现一键安装到多 agent；
   - 实现 MCP Registry 兼容的 REST 只读接口（其 OpenAPI spec 公开），让现有 MCP host 能直接消费；
   - 安全审计标记（类似 skills.sh 的 audit 状态）作为差异化特性。

### 风险提示

- Claude 与 Cursor 的 marketplace 清单 schema 都在快速演进（新增字段频繁），导出器需要跟随版本测试（Claude 侧可用 `claude plugin validate` 做 CI 校验）。
- Agent Plugins 1.0 尚新，部分字段（client extensions）在各客户端的支持度不一致，核心三件套（plugin.json/skills/mcp.json）最稳。
- Gemini CLI 生态处于换代期（→ Antigravity CLI），短期不建议投入专属格式适配。

---

## 六、参考链接

| 主题 | 链接 |
| --- | --- |
| Agent Skills 规范 | https://agentskills.io/specification |
| Agent Plugins 1.0 标准 | https://agent-plugins.org/plugin-authors |
| Agent Plugins 发布公告 | https://aws.amazon.com/cn/blogs/devops/announcing-agent-plugins-v1-0/ |
| Claude Code 插件文档 | https://code.claude.com/docs/en/plugins |
| Claude marketplace 格式 | https://code.claude.com/docs/en/plugin-marketplaces |
| Cursor 插件参考 | https://cursor.com/docs/reference/plugins |
| Codex Skills 文档 | https://developers.openai.com/codex/skills |
| MCP Registry | https://registry.modelcontextprotocol.io/ |
| skills.sh（Vercel） | https://skills.sh |
| skills CLI 源码 | https://github.com/vercel-labs/skills |
