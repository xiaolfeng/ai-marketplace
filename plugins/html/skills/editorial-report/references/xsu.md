# XSU v1 · editorial 写作参考

本页是可维护的作者指南，不是构建副本。精确字段、枚举与父子限制以本技能 `components --preset editorial` 输出为准；旧 HTML 的全部组件和状态变体不自动等于已经实现的 XSU API。

## 受限语法

XSU v1 是数据语言，不是改名的 JavaScript。每文件一个根调用，组件名区分大小写，常见签名为 `Component(props, children)`、`Component(props)` 或 `Component(text)`，精确签名查当前预设注册表。

- 值仅允许 JSON 双引号字符串、有限数值、布尔、null、数组、对象和注册组件调用；对象键可写 ASCII 标识符或双引号字符串。
- 字符串外允许 `//`、`/* ... */` 注释与尾逗号。原始多行字符串以三双引号 `"""` 起止，分隔符各占独立一行；正文不插值、不解码转义、不自动去缩进。普通字符串沿用 JSON 转义。
- 不允许变量、赋值、函数、条件、循环、成员访问、展开、模板插值、import/export、Load、事件回调或计算表达式；提交原始数据，派生值由脚本计算。
- 禁止重复键、原型键、RawHTML/RawCSS/RawJS、任意 style/className 与脚本。组件不支持的效果先报告缺口，不改生成 HTML。
- 根必须写 `xsuVersion: 1`、稳定 `id`、`preset`、`title`、事实日期 `date`；`theme` 为 `system/light/dark`，默认 system。
- 分片写 `Fragment([组件...])`，主文件用 `Include("sections/01.xsu")`。路径相对引用它的 XSU，展开后仍须符合当前父子关系；真实路径必须留在入口文件目录沙箱内，禁止 URL、绝对路径、逃逸链接和循环。不支持的输入报错，不静默截断。

## 编译、诊断与输出保护

使用 **Node >=18**，零第三方 npm 运行依赖；生成 HTML 在浏览器阅读无需 Node。技能内 `scripts/xsu.mjs` 是构建生成的独立分发 bundle，不手改；`examples/example.xsu` 从仓库 `scripts/xsu/fixtures/` 构建复制，也不双写维护。

`<skill-dir>` 替换为本技能安装目录，命令参数路径相对当前工作目录。验证只校验源；render 写生成页；修改内容回到 XSU。

- `validate/render --warnings-as-errors` 把质量警告提升为失败，不能靠编造内容消警告。
- `validate/render --diagnostics-json diagnostics-new.json` 创建结构化诊断；**只允许新文件，不覆盖已有报告**，也不能覆盖源码、导航或资源。
- `render --check` 在内存重编译并逐字节比对输出，缺失或不同退出 4，不写 HTML。需保留同版本编译器、模板与全部输入才有可复现前提。
- 默认不覆盖人工文件；同 preset/documentId 的带标记生成物可重建。`render --force` 仅允许显式替换人工输出，不跳过校验、安全和输入保护，不与 --check 同用。
- 退出码：0 成功；1 用法/I/O；2 语法、组件、领域或资源错误；3 内部错误；4 输出漂移。诊断指向作者 XSU，不应修生成页掩盖错误。

## 离线与联网能力

默认 `--network offline`：仅系统字体、内联可信运行时和嵌入资源，不加载外部字体、脚本、JSON，也不热刷新导航。内容中的普通外链是读者主动点击的链接，不是页面自动联网资源。

Pele 图表必须显式 `--network connected`；offline 下相关输入报 `XSU_NETWORK_REQUIRED`，不静默联网或丢图。connected 仅在实际用图时加载锁定的 Pele 1.6.0 远程脚本，不表示可添加任意外部脚本，也不宣称全离线、完整 Mermaid 支持或完成供应链安全审计。图表拒绝 HTML、交互链接、初始化指令等危险能力；远程脚本有页面执行权限，版本锁定不等于完整性与供应链保证。失败时应保留可读源码与失败状态，实际图表渲染、打印与安全限制仍需验证。

## 审阅责任

编译通过只证明当前结构校验成功，不证明事实真实、Handoff 因果成立、发布已授权或视觉保真。截图、交互、安全和组件覆盖检查未实际执行时必须标为待验证。

## editorial 组件选择

根为 `Report(props, children)`，preset 仅 `editorial`。可选根元信息含 brand/subtitle/author/footer。先读 [可编译示例](../examples/example.xsu)，再按需选用组件；[旧 example.html](../examples/example.html) 保留为视觉 catalog，不是每篇正文。

| 内容       | 当前预设常用组件                                                                          |
| ---------- | ----------------------------------------------------------------------------------------- |
| 章节与布局 | Section({id,title}, children)、Row、Stack、Grid（columns 1/2/3/4）、Split、Details        |
| 刊头与判断 | Cover、Takeaway、Glance                                                                   |
| 正文与证据 | Markdown(text)、Quote、List、Sources、Code({language}, text)、Evidence                    |
| 指标与状态 | Metrics、Metric({label,value,...})、Progress、Badge、EvidenceLabel                        |
| 对比与决策 | Compare、CompareTable、Diff、Scorecard、Decision                                          |
| 图表与过程 | Table、Chart、Sparkline、Gauge、Heatmap、Quadrant、Roadmap、Timeline、Flow、Tree、Diagram |
| 素材与附录 | People、Gallery、Image、OpenQuestions、Callout                                            |

表格列与行宽度须一致；数值必须有限，不能在属性里手写公式、SVG path 或坐标。评分提交原始分与权重，让脚本计算，不手算未核对总分。通用 tone 为 `neutral/good/warn/bad/info`；任务 status 则按当前组件枚举（如 done/progress/blocked/plan）填写，二者不能互换。

Markdown 仅承诺明确子集（段落、列表、强调、行内代码与链接），不接受原始 HTML；表格、代码、图片、图表使用专用组件，不假设完整 CommonMark。图片使用沙箱内带正确文件头的 PNG/JPEG/WebP/GIF 并提供 alt；不允许远程热加载、作者 SVG 或任意 data URI。

```text
Report({ xsuVersion: 1, id: "weekly-example", preset: "editorial",
  title: "协议示例，不是实际进展", date: "2026-11-06", theme: "system" }, [
  Cover({ kicker: "示例", lead: "这里只展示声明式写法。" }),
  Section({ id: "facts", title: "事实与待办" }, [
    Markdown("只记录有来源的事实，未执行检查仍留作待办。"),
    Callout({ tone: "warn", title: "待验证" }, [Markdown("实际浏览器检查尚未执行。")])
  ])
])
```

## 命令

```bash
node <skill-dir>/scripts/xsu.mjs components --preset editorial
node <skill-dir>/scripts/xsu.mjs validate report.xsu --diagnostics-json diagnostics-new.json
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --check
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --warnings-as-errors
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --nav ../report-nav.json
```

新 XSU 合集快照由 render 的 `--nav` 输入生成；导航变更后逐篇用相同源码、选项重渲染，check 时也传相同导航。[导航协议](report-nav.md) 中的 sync-nav 仅服务旧 HTML，不改写 XSU 生成物。单篇不传 --nav。editorial 不支持 migrate-replay，也不接受 Replay 领域组件混入。
