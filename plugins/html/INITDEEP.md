<!-- init-deep:synced@293803c -->

# html 知识库

## 概述

HTML 视觉、架构图表与报告插件套件。包含三个技能：

1. `architecture-diagram`：遵循 huashu-design 设计规范生成高保真工业级系统架构拓扑图（单文件 HTML+SVG），强调曼哈顿正交长线、45° 米字折线与边界隔离；
2. `excalidraw-diagram`：生成手绘白板草图风格业务流程图与拓扑图（单文件 HTML+SVG 与原生 `.excalidraw`），具备粗糙度自然质感、手写字体与自适应视口；
3. `editorial-report`：先事实、大纲与文案，再编写受限 report.xsu，经技能内 scripts/xsu.mjs 确定性生成单文件报告；固定纸白墨蓝视觉与双侧栏，口吻沿用用户设定。

两类图表技能均提供深浅双主题无缝切换、视口平移缩放、纯画布矢量导出（SVG/PNG/PDF/剪贴板），且 `excalidraw-diagram` 原生支持双向 `.excalidraw` 源码导入导出。

## 目录结构

```text
html/
├── .claude-plugin/plugin.json
├── README.md
├── INITDEEP.md
└── skills/
    ├── architecture-diagram/
    │   ├── SKILL.md
    │   ├── references/
    │   │   ├── svg-design.md
    │   │   ├── html-scaffolding.md
    │   │   ├── template.html
    │   │   └── components/
    │   │       ├── README.md
    │   │       ├── node-and-flow.svg
    │   │       ├── stream-flow.svg
    │   │       ├── layered-services.svg
    │   │       ├── event-flow.svg
    │   │       └── security-flow.svg
    │   └── examples/
    │       ├── example.html
    │       └── sample-architecture.md
    └── excalidraw-diagram/
        ├── SKILL.md
        ├── references/
        │   ├── excalidraw-design.md
        │   ├── html-scaffolding.md
        │   ├── template.html
        │   ├── element-types.md
        │   ├── excalidraw-schema.md
        │   └── templates/
        │       ├── README.md
        │       ├── flowchart-template.excalidraw
        │       ├── relationship-template.excalidraw
        │       ├── mindmap-template.excalidraw
        │       ├── business-flow-swimlane-template.excalidraw
        │       ├── class-diagram-template.excalidraw
        │       ├── data-flow-diagram-template.excalidraw
        │       ├── er-diagram-template.excalidraw
        │       └── sequence-diagram-template.excalidraw
        ├── scripts/
        │   ├── README.md
        │   ├── render-to-html.mjs
        │   ├── add-arrow.mjs
        │   ├── add-icon-to-diagram.mjs
        │   └── split-excalidraw-library.mjs
        └── examples/
            ├── example.html
            └── sample-flow.md
    └── editorial-report/
        ├── SKILL.md
        ├── references/
        │   ├── voice.md            # 口吻：沿用用户设定的角色，三档温度
        │   ├── outline.md          # 大纲怎么策划
        │   ├── copy.md             # 文案怎么写
        │   ├── html-design.md      # 视觉规范与模块清单（含双侧栏）
        │   ├── report-nav.md       # 合集导航 report-nav.json 结构与同步
        │   ├── template.html       # 维护者视觉源；作者不复制填槽
        │   ├── xsu.md              # 可维护的受限语法与 editorial 作者指南
        │   ├── components/         # 组件片段（图表类在 charts/ 子目录，含 Pele 容器）
        ├── scripts/
        │   ├── README.md
        │   ├── xsu.mjs             # 构建生成的独立 CLI（禁止手改）
        │   └── sync-nav.mjs        # 仅旧 HTML 导航注入与漂移校验
        └── examples/
            ├── example.xsu         # 从 scripts/xsu/fixtures 构建复制
            └── example.html        # 保留旧全量视觉 catalog，不是每篇正文
```

## 导航指南

| 任务                         | 位置                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| 架构拓扑几何、走线与标签规范 | `skills/architecture-diagram/references/svg-design.md`                                                  |
| 架构拓扑起手模板与页面规范   | `skills/architecture-diagram/references/template.html` / `html-scaffolding.md`                          |
| 白板手绘设计美学与几何规范   | `skills/excalidraw-diagram/references/excalidraw-design.md`                                             |
| 白板起手模板与交互规范       | `skills/excalidraw-diagram/references/template.html` / `html-scaffolding.md`                            |
| 白板原生 Schema 与图元规范   | `skills/excalidraw-diagram/references/excalidraw-schema.md` / `element-types.md`                        |
| 白板典型起手模板库           | `skills/excalidraw-diagram/references/templates/`                                                       |
| 白板 HTML 转换脚本与工具     | `skills/excalidraw-diagram/scripts/`                                                                    |
| 报告流程、口吻与视觉         | `skills/editorial-report/SKILL.md` / `references/voice.md` / `references/html-design.md`                |
| 报告作者语法与组件契约 | `skills/editorial-report/references/xsu.md` / `examples/example.xsu` / `components --preset editorial` |
| 报告合集导航与双侧栏 | `skills/editorial-report/references/report-nav.md`；新 XSU 用 render --nav，旧 HTML 才用 sync-nav.mjs |
| 查看完整实战示例             | `skills/architecture-diagram/examples/example.html` / `skills/excalidraw-diagram/examples/example.html` |

## 约定

- **单文件阅读边界**：生成 HTML 在现代浏览器可独立打开，无需 Node/本地服务；editorial 渲染需 Node >=18、零第三方 npm 运行依赖，默认 offline 不加载外部字体/脚本/JSON。Pele 须显式 connected，不宣称全离线或完整供应链保证；
- **外壳柔和、画布守规**：页面外层容器与工具栏使用 `--radius-*` 圆角 token（与 replay 一致：徽标胶囊、按钮 8px、卡片 12px、画板 14px），内部架构图/白板保留原有节点圆角或自然手绘糙度（`roughness: 1`）；
- **单一事实源驱动**：
  - `architecture-diagram` 以 `#main-diagram-svg` 及其结构化图层为事实源；
  - `excalidraw-diagram` 以内嵌 `<script type="application/json" id="excalidraw-data">` 为事实源，经 Rough.js 动态渲染进 SVG；
  - `editorial-report` 后续正文以 report.xsu 为可编译事实源，导航以 report-nav.json 为源；新页由 render --nav 派生快照，offline 禁用热刷新，sync-nav 仅维护旧 HTML；
- **配色与字体对齐 replay**：`architecture-diagram` 采用 replay-post-html 的纸白墨蓝，`excalidraw-diagram` 采用 replay-html 的暖纸笔记本；只用系统字体栈（标题衬线），不引入外部 Web 字体；
- **二次元点缀统一**：三个技能与 replay 的 HTML 模板末尾都有同构的「ACCENT · 二次元点缀」样式段（樱粉 `--sakura`、✦ 四角星、角落网点、对话气泡、平涂错位阴影），只借漫画语法、不放角色素材，改点缀时几处同步；
- **多端与双向兼容**：深浅双主题默认跟随系统并可手动切换持久化（深浅模式下文字与描边清晰）、桌面与约 `390px` 移动视口自适应；
- **完整导出矩阵**：SVG、PNG (2x)、PDF 与剪贴板复制；白板技能额外支持原生 `.excalidraw` 导出与在线打开；
- **报告先事实、大纲、文案，再 XSU 渲染**：产物留在 `reports/<日期>-<slug>/` 或用户指定目录；作者只读语法/当前组件/示例，不必全文读模板，不修改生成 HTML/CSS/JS。根 theme 为 system/light/dark。缺失组件报能力缺口，不手改模板逃生；

## 反模式

- 把导出后的 SVG 当作白板技能的编辑源——原生图元数据位于 HTML 内嵌的 `excalidraw-data`，应从这里更新并重渲染；
- 生成依赖本地构建服务才能打开的页面——三个技能的交付物均应为可独立打开的单文件 HTML；
- 跳过大纲直接写长报告 HTML，或照搬 `editorial-report/examples/example.html` 的全部模块凑篇幅。

## 调试路径

1. 白板 HTML 无法生成 → 检查 `.excalidraw` 输入与 `skills/excalidraw-diagram/scripts/README.md` 中的 `render-to-html.mjs` 用法；
2. 架构图走线、标签越界 → 查 `skills/architecture-diagram/references/svg-design.md` 与组件库；
3. 白板导出结果不符 → 核对内嵌 `excalidraw-data`、模板与导出代码路径；
4. 报告视觉或结构异常 → 先 validate report.xsu，查诊断定位的作者源；再用同版本 CLI render --check 核对漂移，不在生成页补样式；
5. 报告合集左栏不一致 → 新页用相同 --nav 输入重新 render 并 --check，默认 offline 不热刷新；只有旧 HTML 使用 sync-nav --check。
