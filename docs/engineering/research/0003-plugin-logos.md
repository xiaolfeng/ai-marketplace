# 专题调研：插件市场 Logo/Icon 的实现机制

> 调研日期：2026-08-23（承接 [0001](./0001-plugin-standards.md) / [0002](./0002-marketplace-installers.md)）
> 问题：Codex（及其他主流）插件市场如何获取并展示插件的 logo 图片？

---

## 一、结论摘要

1. **Codex 的答案是 `interface` 对象**：`.codex-plugin/plugin.json` 里一个专门面向「安装界面展示」的块，含 `logo`、`composerIcon`、`screenshots`、`brandColor` 等字段，全部是相对插件根的 `./assets/...` 路径，随插件一起被 clone 进本地缓存后由 Codex UI 渲染。
2. **开放标准（Agent Plugins 1.0）刻意没有 logo 字段**——manifest 是封闭 schema，客户端私有展示数据必须放进 `extensions.<reverse-domain>` 命名空间。
3. **各平台三种流派并存**：
   - **随包分发派**（Codex/Cursor）：logo 是插件仓库内的相对路径文件，clone 时一并获取；
   - **Registry 元数据派**（MCP server.json）：`icons[]` 直接存 HTTPS URL + 尺寸 + 明暗主题；
   - **不支持派**（Claude Code）：插件市场 UI 目前统一渲染默认占位图标，无自定义 logo 机制。
4. 对自建插件库的启示：**资产放 `./assets/` 随仓库走是最大公约数**，各平台清单导出时做一次字段映射即可。

---

## 二、Codex：`interface` 对象详解 ⭐ 核心答案

### 2.1 声明方式（真实案例：openai/plugins 的 build-web-apps）

```json
{
  "name": "build-web-apps",
  "version": "0.1.2",
  "description": "...",
  "skills": "./skills/",
  "interface": {
    "displayName": "Build Web Apps",
    "shortDescription": "...",
    "longDescription": "...",
    "developerName": "OpenAI",
    "category": "Developer Tools",
    "capabilities": ["Interactive", "Read", "Write"],
    "websiteURL": "https://openai.com/",
    "privacyPolicyURL": "https://openai.com/policies/privacy-policy/",
    "termsOfServiceURL": "https://openai.com/policies/terms-of-use/",
    "defaultPrompt": ["Design a new landing page for my new SaaS product."],
    "brandColor": "",
    "composerIcon": "./assets/build-web-apps-small.svg",
    "logo": "./assets/app-icon.png",
    "screenshots": []
  }
}
```

### 2.2 视觉字段说明

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `logo` | 相对路径 | 插件目录/详情页的主 logo |
| `composerIcon` | 相对路径 | 输入框/composer 场景的小尺寸图标 |
| `screenshots` | 路径数组 | 安装页截图轮播 |
| `brandColor` | 颜色串 | 品牌主色（可空）|

### 2.3 工作机制

- **路径规则**：所有视觉资产必须是相对插件根、以 `./` 开头的路径；官方建议统一放 `./assets/` 子目录；
- **分发即展示**：`codex plugin install` 把整个插件目录复制进 `~/.codex/plugins/cache/$MARKETPLACE/$PLUGIN/$VERSION/`，logo 文件随之落地本地，UI 直接读缓存里的文件——**不依赖运行时的外部图床**；
- **市场清单位置**：仓库级 `$REPO_ROOT/.agents/plugins/marketplace.json`（openai/plugins 官方目录就在此）；个人级 `~/.agents/plugins/marketplace.json`；
- **兼容性彩蛋**：Codex 会读取 **legacy 兼容的 `$REPO_ROOT/.claude-plugin/marketplace.json`** ——Claude 格式市场天然多一个消费者；
- Git 型 marketplace 条目支持 `ref`/`sha` 锁定；单条目解析失败只跳过该插件，不炸整个市场。

---

## 三、其他平台的 Logo 实现

### 3.1 Cursor：`plugin.json` 顶层 `logo` 字段 + raw.githubusercontent 解析

```json
{ "name": "my-plugin", "logo": "assets/logo.svg" }
```

- **相对路径** → 自动解析为 `raw.githubusercontent.com/<owner>/<repo>/<commit-sha>/<plugin-dir>/assets/logo.svg`（基于提交 SHA，内容不可变，天然防篡改/防盗链问题）；
- 也接受绝对的 GitHub user content URL（`http(s)://` 开头）;
- 提交建议：logo commit 进仓库并用相对路径引用。

### 3.2 MCP Registry（server.json）：最完整的 `icons[]` schema

2025-10-17 版 schema 中 `ServerDetail.icons` 是结构化数组，每项：

| 字段 | 说明 |
| --- | --- |
| `src` | 必需，HTTPS URI（≤255 字符）|
| `mimeType` | 可选覆盖：png/jpeg/jpg/svg+xml/webp |
| `sizes` | `"48x48"`、`"96x96"`… 或 `"any"`（SVG）|
| `theme` | `light` / `dark`（明暗两套图）|

配套的兼容性要求：客户端 **MUST** 支持 png/jpeg，**SHOULD** 支持 svg/webp；schema 明确警告 SVG 可能内嵌 JS，消费端需防护。这是目前设计最完备的 icon 元数据模型。

### 3.3 Agent Plugins 1.0（开放标准）：刻意留白

Manifest 是**封闭 schema**，可移植顶层字段仅限：`$schema`、`name`、`version`、`description`、`author`、`homepage`、`repository`、`license`、`keywords`、`extensions`。未知顶层字段虽不致命但会被忽略并上报。

→ 展示类数据属于「客户端私有」，规范给出的正道是 `extensions` 反向域名命名空间，例如：

```json
{
  "extensions": {
    "dev.cursor.plugin": { "logo": "assets/logo.svg" },
    "com.openai.codex": { "interface": { "logo": "./assets/logo.png" } }
  }
}
```

### 3.4 Claude Code：暂不支持自定义图标

社区 feature request（anthropics/claude-code#28187）确认：插件市场 UI 为所有插件渲染统一的默认占位图标，`marketplace.json`/`plugin.json` 中无生效的 logo 字段；该请求已关闭（未计划）。Claude 生态的第三方目录站（claudepluginhub 等）普遍退而求其次：抓取 GitHub 组织头像或仓库社交卡图当封面。

### 3.5 ZCode（智谱 AI）：暂不支持品牌图片（2026-08 官方文档确认）

`plugin.json` 与 `marketplace.json` 的完整字段速查中均**没有任何视觉字段**（无 logo / icon / brandColor / screenshots）。插件商店的卡片与详情页是纯文字展示：名称、描述、开发者、类别、版本、网站链接。由于 ZCode 兼容 Claude 插件格式、而 Claude 本身也无生效的 logo 字段，两边展示形态一致——**文字就是门面**。

### 3.6 skills.sh / npx skills：技能本身无 logo 概念

SKILL.md 规范不含图像字段，skills.sh 列表以文字 + 排行数据为主。视觉身份依赖发布者的 GitHub 头像/组织图。

---

## 四、机制横向对比

| 平台 | 声明位置 | 取值形式 | 渲染来源 | 多尺寸/主题 |
| --- | --- | --- | --- | --- |
| Codex | `.codex-plugin/plugin.json` → `interface.logo` + `composerIcon` | 相对路径 `./assets/…` | 本地插件缓存文件 | 两档图标（大/小），无主题区分 |
| Cursor | `plugin.json` 顶层 `logo` | 相对路径或绝对 URL | 解析为 raw.githubusercontent（按 commit SHA 固定）| 单图 |
| MCP Registry | `server.json` → `icons[]` | HTTPS URL 数组 | 远程拉取 | ✅ sizes + theme |
| Agent Plugins 标准 | ❌（走 `extensions` 私有命名空间）| 由客户端自定义 | — | 交给客户端 |
| Claude Code | ❌ 不支持 | — | 默认占位图 | — |
| ZCode | ❌ 不支持 | — | 纯文字详情页 | — |

**三种工程流派**：
1. **随包分发**：logo 与代码同仓同版（Codex/Cursor）——离线可用、版本一致，代价是仓库膨胀；
2. **元数据外链**：registry 只存 URL（MCP）——灵活、可 CDN 化，代价是链接失效与供应链风险（故强制 HTTPS + 同域建议）；
3. **平台代偿**：无字段时用 GitHub 头像/OG 图兜底（第三方站通用做法）。

---

## 五、对「筱锋のAI插件库」的建议

1. **统一资产约定**：每个插件固定 `assets/logo.(svg|png)`（建议 SVG 主图 + PNG 兜底），一份源资产服务所有平台；
2. **导出映射链**（CI 从单一事实源生成各平台清单时同步处理）:
   - → Codex：写入 `interface.logo` / `composerIcon`（小尺寸另出一图）；
   - → Cursor：写入顶层 `logo`（相对路径即可，Cursor 自己会转 raw.githubusercontent URL）；
   - → 自建 Web 目录站：参照 MCP 的 `icons[]` 模型（sizes/theme），从同一 assets 目录生成绝对 URL；
   - → Claude：无需处理（反正不显示 😂），但 README 里放 logo 保持门面；
3. **若走 Agent Plugins 打包**：平台差异字段放 `extensions`（如 `dev.cursor.plugin.logo`），保持可移植核心干净；
4. **SVG 安全**：若自建站点渲染 SVG logo，记得消毒或限制为 PNG/WebP 白名单（MCP schema 的警告值得抄）。

---

## 六、参考链接

| 主题 | 链接 |
| --- | --- |
| Codex 插件构建文档（interface 字段权威定义）| https://developers.openai.com/codex/plugins/build |
| openai/plugins 官方插件库 | https://github.com/openai/plugins |
| build-web-apps 真实 manifest 案例 | https://github.com/openai/plugins/blob/main/plugins/build-web-apps/.codex-plugin/plugin.json |
| Agent Plugins manifest（封闭 schema + extensions）| https://agent-plugins.org/plugin-authors/manifest |
| MCP server.schema.json（icons 定义）| https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json |
| Claude Code 图标 feature request | https://github.com/anthropics/claude-code/issues/28187 |
