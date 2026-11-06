# XSU 编译器开发说明

AI 编写 `.xsu`，可信 Node.js 脚本装配 HTML。这里是共享开发源，三个技能的 `scripts/xsu.mjs`、`references/xsu-components.json`、`examples/example.xsu` 与 Replay 的 `references/xsu-shared/` 都由构建生成，禁止手改。渲染器支持 Node >=18，没有第三方 npm 运行依赖；浏览器阅读生成页不需要 Node。

## 模块与改动入口

- `parser.mjs`：递归下降解析，不执行作者代码，保留文件与行列诊断。
- `resolver.mjs`：Include、UTF-8、真实路径沙箱、资源额度与栅格图片；重复 Include 另按展开文本累计 20 MiB，避免少量源文件被放大。
- `contracts.mjs`：错误、签名、安全 URL、HTML/脚本 JSON 编码、联网图表门禁。
- `editorial.mjs`：组件注册表、严格属性校验、受限 Markdown、HTML/SVG 与四种 Cover 包装；重复图片引用另计 25 MiB 预装配预算，避免生成超大字符串后才失败。
- `replay.mjs`：领域组件、五要素、Public 检查、旧 JSON lowering 与显式迁移。
- `compiler.mjs`：三个壳层装配、导航快照、确定性标记、25 MiB HTML 上限、独占锁与原子输出。
- `cli.mjs`：validate/render/components/migrate-replay、漂移比较与结构化诊断；诊断仅用于 validate/render，且只创建新文件。
- `build.mjs`：零第三方依赖的受控模块打包器，静态嵌入本预设模板；不是通用 JavaScript bundler。

作者签名与枚举以各技能 `components` 输出或生成的 `references/xsu-components.json` 为准，指南不能成为另一份校验器。图片只接受本地 PNG/JPEG/WebP/GIF，不能把 SVG、原始 HTML、CSS 或 JS 当作作者扩展点。Pele 1.6.0 仅在显式 connected 且实际包含 diagram 时加载，版本锁定不等于供应链完整性保证。

## 常规构建与测试

```bash
npm run build
npm test
npm run check
```

`build` 同步 Cursor 清单与 XSU 分发物；`check` 只核对漂移，不改文件。独立分发回归把单个 bundle 与源示例复制到临时目录，确认不依赖仓库根目录、模板邻居或兄弟技能。CI 的测试矩阵为 Node 18/22；本机执行结果须单独记录，不把 CI 配置当成 CI 已跑过。

## 实际浏览器与截图比较

开发专用浏览器测试需要 Node 22+ 的 WebSocket，以及可用的 Chrome；默认查找 macOS Google Chrome，其他位置通过 `CHROME_PATH` 指定。图表测试从 `XSU_PELE_PATH` 读取事先获取并信任的 Pele 1.6.0 原始脚本，不把它写入插件或新增 npm 依赖。未提供脚本时图表与组件矩阵标为 skipped，不能宣称全量通过。

```bash
XSU_PELE_PATH=/absolute/path/to/pele-1.6.0.js node scripts/xsu/browser-smoke.mjs /absolute/path/to/artifacts
```

输出在指定目录的 `xsu-browser/`，包括 `tests.json`、PNG、HTML、PDF、真实下载的 Markdown 转储，以及逐片段 `component-cases/`。测试只启动独立临时 Chrome profile 与回环 HTTP 服务，结束后关闭并清理 profile，不接触用户浏览器资料。无效 Chrome 路径应生成失败报告并退出，不挂起。

基准模板固定为 Git 修订 `2335a4f7bdee70834cb876770d7f8e7a6a85a313`，运行环境必须能读取该修订；浅克隆需要先准备这份 Git 历史。`fixtures/style-baselines.json` 是该修订三份 CSS 的 SHA-256，不由测试自动更新。三个预设封面和 64 个旧片段对应的 90 个已登记变体，按桌面/390px × 浅/深比较。冻结动画、字体就绪、视口和输入后比较 PNG 字节，不使用自动放宽阈值掩盖差异。

**比较范围必须说清楚：**新旧两侧使用相同的新组件 HTML，只切换不可变旧壳与当前壳。因此截图证明本轮壳层改动没有改变这些固定输入的视觉，不是“原手写片段 DOM 与新组件逐像素等价”的独立证明，也不能覆盖所有长文、屏幕、字体或 Mermaid 类型。组件结构、内容、状态和数值行为另由覆盖清单与单元测试约束；未登记样本与人工可读性仍需审阅。

## 交付门禁与边界

发布或提交前还须运行 `claude plugin validate .`、`npx skills add . --list`、`npm run build`、`npm run check`。本地没有 Claude CLI 或命令未能启动时，必须记录阻塞，不以自写 manifest 检查替代官方校验。编译成功、Public 字段已确认、自动截图通过均不等于事实真实、内容可以公开或人工已授权发送。纯 Markdown Replay 技能保留原入口。
