# 专题调研：ZCode（智谱 AI）的插件/技能兼容体系

> 调研日期：2026-08-23（承接 [0001](./0001-plugin-standards.md) ~ [0003](./0003-plugin-logos.md)）
> 问题：ZCode 兼容的是哪家插件/技能标准？

---

## 一、结论摘要

**ZCode 是智谱 AI（Z.ai / BigModel）的 AI 编程工具**（适配 GLM-5.x），它的兼容主频道就是 **Claude Code 插件生态**：

1. **Plugin 层 → 复刻并兼容 Claude Code 格式**：清单位置优先找自家的 `.zcode-plugin/plugin.json`，找不到则**回退读取 `.claude-plugin/plugin.json`**；marketplace.json 的字段结构、source 类型、依赖语法几乎照搬 Claude；客户端甚至**预置了 Claude Code 的插件市场源**（claude-plugins-official），开箱即可浏览安装；
2. **Skill 层 → 开放的 Agent Skills 规范（SKILL.md）**：`~/.zcode/skills/<name>/SKILL.md`，frontmatter 要求与 agentskills.io 规范一致，且内置从 Claude Code / Codex CLI / OpenClaw / Augment / Windsurf 技能目录一键导入的功能；
3. **MCP 层 → 标准协议**（stdio/http/sse）；同时支持 AGENTS.md；
4. 对本插件库的意义：**维护好一份 Claude marketplace 格式清单，ZCode 用户即自动成为目标受众**——无需任何额外适配。

---

## 二、证据细节

### 2.1 Plugin：Claude Code 格式兼容

清单位置查找顺序（官方文档《开发自己的插件》）：

```text
.zcode-plugin/plugin.json   （推荐，自家命名空间）
.claude-plugin/plugin.json  （兼容 Claude Code）
```

组件布局与 Claude Code 一致：`commands/*.md`、`skills/<name>/SKILL.md`、`agents/*.md`、`hooks/hooks.json`、`.mcp.json`。连模板变量都直接沿用 `${CLAUDE_PLUGIN_ROOT}`（另提供 `${ZCODE_PLUGIN_ROOT}` 别名）。

`marketplace.json` 与 Claude 版对照：

| 能力 | ZCode | Claude Code |
| --- | --- | --- |
| 顶层字段 | name/description/plugins/pluginRoot/allowCrossMarketplaceDependenciesOn | 相同 |
| source 类型 | 相对路径 / directory / github(repo+path+ref) / git(url+path+ref) / file / url(可带 headers) / npm | github/url/git-subdir/npm/archive/command |
| 插件依赖 | `name@market` 或同市场裸 `name` | `name@marketplace` |
| strict 字段 | 有 | 有 |
| 用户配置扩展 | `userConfig`（界面化配置项：type/title/default/required/sensitive，`${user_config.键}` 在 mcp.json 中引用）| pluginConfigs |

差异点：
- ZCode 的 `channels` / `lspServers` / `outputStyles` / `settings` 字段**仅登记不执行**（诊断提示，不影响其他组件加载）；
- `userConfig.sensitive` 敏感值暂不支持界面填写；
- 插件内 skills 必须单层目录，嵌套分组目录里的技能不会被 Agent 识别；
- 无 logo/interface 类视觉字段（详情页展示开发者/类别/版本/网站等文字信息）；
- **版本口径的坑**：「最新版本」取自 marketplace.json 条目声明的 `version`，「已安装版本」取自插件自身 `plugin.json` 的 `version`——发版时两处必须同步修改，否则用户收不到更新提示；
- Hook 支持七个事件：SessionStart、UserPromptSubmit、PreToolUse、PermissionRequest、PostToolUse、PostToolUseFailure、Stop；
- 插件注册的 MCP 服务键名自动加命名空间 `plugin:<插件名>:<服务名>` 防冲突。

### 2.2 插件商店：预置 Claude 市场

设置 → 插件分为「公开」（ZCode 官方收录目录，来自 GitHub）与「个人」（自建源）两段。**个人分段已预置 Claude Code 的插件市场**，无需手动添加即可浏览安装；也可通过 创建 → 添加插件市场 接入任意 GitHub 仓库 / git URL / 本地目录。

> 智谱自家官方市场 [zai-org/zai-coding-plugins](https://github.com/zai-org/zai-coding-plugins) 的 README 标题即为 "Z.ai Coding Plugins Marketplace in Claude Code"，安装命令直接是 `claude plugin marketplace add zai-org/zai-coding-plugins` ——官方自己也在用 Claude 生态分发。

### 2.3 Skill：Agent Skills 规范 + 外部导入器

- 目录：`~/.zcode/skills/<skill-name>/SKILL.md`；frontmatter 必须含 `name`/`description`（description 上限 1024 字符，超限整个技能丢弃）；
- 元数据注入有固定预算（名称+描述摘要单条 ≤250 字符），超预算降级为只留技能名——与 Codex 的预算机制同思路；
- 调用：`$skill-name` 显式引用 + `/` 面板 + 自动触发；
- **外部导入**：设置 → 技能 → 导入，自动扫描 Claude Code、Codex CLI、OpenClaw、Augment、Windsurf 的技能目录，支持软链（跟随变更）或复制（解耦）两种方式——相当于把 `npx skills add` 的跨工具思想做进了 GUI。

### 2.4 其他

- MCP：标准协议，支持 stdio/http/sse，服务键名自动加 `plugin:<名>:<服务>` 命名空间防冲突；
- AGENTS.md 在支持的六类扩展之列；
- 数据迁移向导目前**仅支持从 Claude Code 导入对话记录**——产品层面同样押注 Claude 生态。

---

## 三、对插件库的影响评估

| 维度 | 影响 |
| --- | --- |
| 分发覆盖 | ✅ 现有方案零成本新增一个客户端：Claude marketplace 格式清单 → ZCode 手动添加仓库源即可使用 |
| 需要避开的坑 | 插件内 skills 保持单层目录；不要依赖 `lspServers`/`settings` 等 ZCode 不执行的字段；版本号需同步更新 marketplace.json 条目（ZCode 以条目 version 判更新）|
| 潜在机会 | ZCode 商店的「公开」目录来自官方收录——若插件质量高可争取进入其精选；`userConfig` 可作为比 Cursor variables 更进一步的用户配置声明参考 |

**结论**：「以 Claude marketplace 格式为单一事实源」的策略经 ZCode 验证再次加分——这一份格式现已覆盖 Claude Code、Codex（legacy 兼容读取）、Vercel 双安装器、ZCode 四类消费方。

---

## 四、参考链接

| 主题 | 链接 |
| --- | --- |
| ZCode Skill 官方文档 | https://zcode.z.ai/cn/docs/skill |
| ZCode Plugin 官方文档（含字段速查）| https://zcode.z.ai/cn/docs/plugin |
| ZCode 产品页 | https://zcode.z.ai/cn |
| 智谱开放平台 ZCode 文档 | https://docs.bigmodel.cn/cn/coding-plan/tool/zcode |
| zai-org 官方插件市场（Claude 格式分发实例）| https://github.com/zai-org/zai-coding-plugins |
