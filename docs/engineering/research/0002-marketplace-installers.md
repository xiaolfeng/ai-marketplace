# npx 安装器深度调研：Vercel skills / plugins CLI 与 MCP 安装生态

> 调研日期：2026-08-23（承接 [0001](./0001-plugin-standards.md)）
> 主题：`npx skills add` / `npx plugins add` 的工作机制，以及 MCP 的 npx 安装方式

---

## 一、结论摘要

1. Vercel Labs 维护着**两个独立的 npx 安装器**：
   - [`skills`](https://github.com/vercel-labs/skills)（npm 包名 `skills`）：Agent Skills 安装器，**支持 78 个 agent**，是当前跨工具分发的最大公约数。
   - [`plugins`](https://github.com/vercel-labs/plugins)（npm 包名 `plugins`）：插件安装器，基于 Claude marketplace 格式，目前**仅支持 Claude Code 和 Cursor**，较新（周下载 ~1.6 万）。
2. 两者共同的核心思想：**作者写一次 → 安装器负责翻译到每个 agent 的私有目录**。skills 用 symlink 单一事实源；plugins 直接写入各客户端的插件清单。
3. **MCP 没有 Vercel 式统一安装器**，实际存在三种 npx 相关形态：
   - 运行时形态：`npx -y <mcp-server-package>`（stdio server 的主流分发方式）
   - 注册形态：各客户端自带命令（`claude mcp add` / `codex mcp add --mcp` / `cursor mcp add`）
   - 第三方写入器：`npx add-mcp <owner/repo>`（Neon）、`npx @smithery/cli install`（Smithery）、`npx mcp-get` 等

---

## 二、`npx skills add` —— Agent Skills 安装器（重点）

### 2.1 基本信息

| 项目 | 内容 |
| --- | --- |
| npm 包名 | `skills` |
| 仓库 | vercel-labs/skills（MIT 协议）|
| 发布时间 | 2026-01-20 首发，v1.1.x 加入交互式发现并开源 |
| 支持范围 | 78 个 agent（Claude Code、Codex、Cursor、Copilot、Windsurf、Cline、Qwen Code、iFlow CLI、Grok Build 等）|
| 运行时依赖 | 零依赖，单文件 ESM bundle，Node.js 18+ |

### 2.2 命令全集

```bash
# 安装（核心命令，别名 install/a/i）
npx skills add vercel-labs/agent-skills                    # GitHub shorthand
npx skills add owner/repo --skill frontend-design         # 只装某个技能
npx skills add owner/repo -a claude-code -a codex         # 指定目标 agent
npx skills add owner/repo -g                              # 全局安装（~）
npx skills add owner/repo --all                           # 全部技能×全部 agent 免确认
npx skills add https://github.com/o/r/tree/main/skills/x  # 仓库内直达路径
npx skills add ./my-local-skills                          # 本地路径
npx skills add https://example.com/download/my-skill      # 直链 SKILL.md / zip / tar

# 不安装、临时使用
npx skills use vercel-labs/agent-skills@web-design-guidelines | claude   # 生成 prompt 管道喂给 agent
npx skills use owner/repo --skill x --agent claude-code                  # 直接拉起 agent 会话

# 生命周期管理
npx skills find [query]        # fzf 式交互搜索 skills.sh 目录，可 --owner 限定组织
npx skills list [-g] [-a ...]  # 类似 npm ls
npx skills update [skills...]  # 更新（自动识别 project/global scope）
npx skills remove my-skill     # 卸载（别名 rm）
npx skills init [name]         # 生成 SKILL.md 模板脚手架
```

### 2.3 工作机制

**① 源解析**：GitHub shorthand → HTTPS URL → SSH/git URL → GitLab → 本地路径 → 直链下载（SKILL.md 文件或 zip/tar/tgz 归档，下载限 10 MiB、解压限 25 MiB、1000 文件上限）。私仓认证走三级回退：Git 凭据助手 → `gh repo clone` → SSH fallback；GitHub API 查询则匿名 → 环境变量 token → `gh api`。

**② Skill 发现**（在一个源仓库里怎么找到技能）：
- 扫描固定位置：仓库根、`skills/`、`skills/.curated/.experimental/.system/`，以及全部 78 个 agent 的约定目录（`.claude/skills/`、`.agents/skills/`…）
- 容器目录向下最多走 **3 层**（覆盖 `skills/<分类>/<名称>/SKILL.md` 两级分类布局）；浅层的 SKILL.md 会遮蔽其下的嵌套项
- **兼容 Claude 插件清单**：若存在 `.claude-plugin/marketplace.json` 或 `.claude-plugin/plugin.json`，其中声明的 skills 路径也会被发现——这就是为什么一个 Claude marketplace 仓库可以同时被 `npx skills add` 消费
- 都找不到时才做递归兜底搜索（可用 `--full-depth` 强制）

**③ 安装模型**：

| 维度 | 行为 |
| --- | --- |
| Scope | 默认项目级 `./<agent>/skills/`（随 git 提交共享）；`-g` 全局 `~/<agent>/skills/` |
| 方法 | 默认推荐 **symlink**：每个 agent 目录 → 同一份 canonical copy，单一事实源，更新一处全部生效；不支持 symlink 时选 copy |
| 目标选择 | 自动检测本机装了哪些 agent；未检测到则交互式让用户勾选 |

**④ 遥测**：匿名上报安装事件（仅 GitHub 确认为公开仓库才带 repo/skill 标识），驱动 skills.sh 排行榜。`DISABLE_TELEMETRY=1` 关闭。

### 2.4 关键目录映射表（节选，完整表见 README）

| Agent | `--agent` 名 | 项目级路径 | 全局路径 |
| --- | --- | --- | --- |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| Cursor | `cursor` | `.agents/skills/` ⚠️ | `~/.cursor/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` ⚠️ | `~/.copilot/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Cline / Zed / Warp / Kimi 等 | 各自名字 | `.agents/skills/` | `~/.agents/skills/` |
| Qwen Code | `qwen-code` | `.qwen/skills/` | `~/.qwen/skills/` |
| iFlow CLI | `iflow-cli` | `.iflow/skills/` | `~/.iflow/skills/` |

⚠️ 注意：**越来越多新 agent 把项目级路径收敛到了中立目录 `.agents/skills/`**（Codex、Cursor、Copilot、Gemini CLI、Cline、OpenCode 都是）——「一个目录、多家识别」正在成为项目级分发的事实走向，全局目录仍各自为政。

**功能兼容性差异**（同一份 SKILL.md 在不同 agent 下）：

| 特性 | 覆盖情况 |
| --- | --- |
| 基本 skills | 所有 agent ✅ |
| `allowed-tools` | 多数 ✅，Kiro CLI / GitHub Copilot ❌ |
| `context: fork` | 仅 Claude Code ✅ |
| Hooks | 仅 Claude Code / Cline / Kiro CLI ✅ |

---

## 三、`npx plugins add` —— 插件安装器（Vercel 的另一个 CLI）

### 3.1 基本信息

| 项目 | 内容 |
| --- | --- |
| npm 包名 | [`plugins`](https://www.npmjs.com/package/plugins) v1.3.1 |
| 仓库 | vercel-labs/plugins（Apache-2.0）|
| 支持目标 | **仅 Claude Code + Cursor**（当前版本）|
| 设计理念 | 「Plugin authors write once; the CLI handles the rest」|

### 3.2 用法

```bash
npx plugins add vercel/vercel-plugin          # Vercel 官方插件的官方安装方式
npx plugins discover owner/repo               # dry-run：只检查不安装
npx plugins targets                           # 列出本机检测到的 agent 工具

# 标志
-t, --target claude-code|cursor   # 指定目标（默认自动检测全部）
-s, --scope user|project|local    # 安装作用域（默认 user）
-y, --yes                         # 跳过确认
```

源格式与 skills CLI 一致：GitHub shorthand / HTTPS URL / SSH URL（SSH 失败自动回退 HTTPS）/ 本地目录。

它消费的是 **Claude marketplace 格式**（`.claude-plugin/plugin.json` / `marketplace.json`），安装时把插件翻译进 Claude Code 与 Cursor 各自的插件体系。Vercel 自家的 `vercel-plugin`（含平台知识、skills、专用 agent 人设、slash 命令、校验 hooks）就是通过这条通道分发的。

> 定位差异总结：`skills` = 广度优先（78 个 agent，只管 SKILL.md）；`plugins` = 深度优先（2 个 agent，但能装完整插件包：hooks/commands/agents/MCP）。

---

## 四、MCP 的「npx 安装」生态

MCP 层没有 Vercel 式的统一安装器，而是三种形态并存：

### 形态 A：运行时执行（最普遍）

`npx` 本身就是 stdio 型 MCP server 最主流的分发载体——客户端配置里直接写：

```json
{
  "mcpServers": {
    "postgres": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres"] }
  }
}
```

这里的 npx 解决的是「代码从哪来、怎么跑」，不解决「配置写到哪」。

### 形态 B：客户端自带注册命令

| 客户端 | 命令示例 |
| --- | --- |
| Claude Code | `claude mcp add <name> -- npx -y <pkg>`（支持 user/project/local scope、`--transport http/sse`）|
| Codex | `codex mcp add`（写 `config.toml` 的 `[mcp_servers]`）；旧版需手动编辑或 `codex mcp add --json` |
| Cursor | `cursor mcp add <name> <command>`（Deep Link `deeplink:mcp/install` 可一键跳转安装）|
| VS Code / Insiders | `code --add-mcp '{"name":...,"transport":"http","url":...}'` |
| Gemini CLI | 手动编辑 `settings.json` 的 `mcpServers`（无 CLI 子命令）|

### 形态 C：第三方「配置写入器」

| 工具 | 命令 | 说明 |
| --- | --- | --- |
| Neon `add-mcp` | `npx add-mcp <owner/repo>` | 从 GitHub 仓库读 package.json 里的 `mcpServers` 字段，写入所有检测到的客户端配置；支持 `--client`、`--transport http/sse`、`--install-global` |
| Smithery | `npx -y @smithery/cli install <server> --client claude` | Smithery registry 的配套安装器，服务端托管运行 |
| mcp-get | `npx @mcp-get install <server>` | 社区 registry 安装器（早期方案）|

### Registry 层的角色

官方 MCP Registry（registry.modelcontextprotocol.io）与 GitHub MCP Registry 都定位为**元数据目录**（metaregistry），刻意不做终端安装——安装动作留给上述 B/C 形态。`server.json` 里的 `packages[].registry_type/npm` 字段正是为安装器提供「去 npm 拿什么包」的线索。

---

## 五、对插件库项目的启示

1. **兼容 `npx skills add` 应作为第一优先级的分发通道**：只要仓库按 `skills/<name>/SKILL.md` 组织（或提供 `.claude-plugin/marketplace.json` 元数据），就能被 78 个 agent 的用户一条命令安装，零开发成本。skills CLI 的发现规则（容器目录 3 层深扫描 + manifest 声明）应作为我们仓库布局的设计输入。
2. **项目级目录收敛趋势利好自建市场**：新 agent 纷纷认领中立的 `.agents/skills/`，未来「一次安装、多端生效」的项目级体验会越来越自然。
3. **`npx plugins add` 证明了「通用插件安装器」有真实需求但尚不成熟**（仅 2 个客户端、发布不久）。插件库若想补位，可参考其三命令设计（add/discover/targets）与 scope 模型，做一个同时理解 Agent Plugins 1.0 + Claude marketplace 双格式的安装器，就是差异化机会。
4. **MCP 分发建议双轨**：插件库里的 MCP server 条目同时给出「运行时 npx 包名」（供手动配置/形态 A）和「一键注册命令片段」（形态 B），并可考虑实现 `add-mcp` 式的一键写入器对接自家 registry。
5. **遥测即排行榜**：skills.sh 的排名完全来自安装器匿名遥测。插件库若做热度排序，安装器埋点是最可靠的数据源（注意隐私边界：只对公开仓库上报标识）。

---

## 六、推论：以 Claude marketplace 格式为「单一事实源」的可行性边界

> 结论先行：**可行，且是当前最优解**——一份 `.claude-plugin/marketplace.json` 可同时被三条分发通道消费。但有两处边界必须处理，否则会出现「清单写了却装不上」的暗坑。

### 6.1 一份格式，三条通道

| 分发通道 | 消费的格式 | 用户命令 |
| --- | --- | --- |
| Claude Code 原生市场 | `.claude-plugin/marketplace.json` | `/plugin marketplace add <owner/repo>` |
| Vercel skills 安装器 | 同上（读取其中声明的 skills 路径）| `npx skills add <owner/repo>` |
| Vercel plugins 安装器 | 同上 | `npx plugins add <owner/repo>` |

### 6.2 边界一：skills CLI 的发现主路径是目录约定，manifest 只是补充

skills CLI 扫描的是固定位置清单（根目录、`skills/`、各 agent 约定目录…）；`.claude-plugin/marketplace.json` 中声明的 skills 路径属于**追加发现**。因此：

- 若技能放在 `skills/<name>/SKILL.md` 等标准位置 → 无需 manifest 即可被发现；
- 若采用市场常见布局 `plugins/<plugin>/skills/<skill>/SKILL.md` → **不在固定扫描清单内，必须在 marketplace.json 条目里用 `skills` 字段显式声明**，否则 `npx skills add` 找不到；
- 稳妥做法是双保险：标准布局 + manifest 显式声明同时满足。

### 6.3 边界二：Claude 格式 ≠ Cursor / Codex 自动可用

- Cursor 的**市场清单**只有一种格式：`.cursor-plugin/marketplace.json`（结构与 Claude 版相似但不通用），需单独导出；
- Cursor 加载**单个插件**时可直接吃 Agent Plugins 标准的根级 `plugin.json`（无需转换）；
- Codex v0.147+ 可安装 Agent Plugin；OpenAI 官方插件库实际使用 `.cursor-plugin/plugin.json` 格式。

因此正确的表述是：**Claude marketplace 格式作为手写的唯一源数据，Cursor 清单由 CI 从源数据导出**，而不是「一份文件通吃所有客户端」。

### 6.4 最小可行仓库结构

```text
ai-marketplace/
├── .claude-plugin/
│   └── marketplace.json        # 唯一手写的市场清单（单一事实源）
├── plugins/
│   └── my-plugin/
│       ├── .claude-plugin/
│       │   └── plugin.json     # 插件 manifest
│       └── skills/
│           └── my-skill/
│               └── SKILL.md
├── dist/                       # CI 产物（不入库亦可）
│   └── cursor/
│       └── .cursor-plugin/
│           └── marketplace.json
└── docs/
```

`marketplace.json` 关键写法（`metadata.pluginRoot` 让条目 source 可省略 `./` 前缀；`skills` 显式声明供 skills CLI 发现）：

```json
{
  "name": "xiaofeng-plugins",
  "owner": { "name": "筱锋" },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "my-plugin",
      "description": "……",
      "version": "0.1.0",
      "skills": ["./skills"]
    }
  ]
}
```

### 6.5 发布前检查清单

- [ ] 插件名全部 kebab-case，未占用 Anthropic 保留名（`agent-skills`、`claude-plugins-*` 等）
- [ ] `claude plugin validate .` 通过（CI 固定步骤，schema 错误/重名/路径穿越都会被拦下）
- [ ] 每个 skill 的 frontmatter 有 `name` + `description`（skills CLI 与所有 agent 的最低要求）
- [ ] 版本号随每次发布递增（Claude 侧以 version 为更新信号，不 bump 用户拿不到新版）
- [ ] `npx skills add ./ --list` 能列出全部技能（验证边界一的双保险生效）
- [ ] 导出的 `.cursor-plugin/marketplace.json` 通过 Cursor 提交检查项

---

## 七、参考链接

| 主题 | 链接 |
| --- | --- |
| skills CLI（README 含 78 agent 映射全表）| https://github.com/vercel-labs/skills |
| skills.sh 目录与排行榜 | https://skills.sh |
| plugins CLI（npm）| https://www.npmjs.com/package/plugins |
| plugins CLI（源码）| https://github.com/vercel-labs/plugins |
| Vercel Plugin 文档（plugins add 的样板案例）| https://vercel.com/docs/agent-resources/vercel-plugin |
| Neon add-mcp | https://github.com/neondatabase/add-mcp |
| Smithery CLI | https://smithery.ai/docs |
