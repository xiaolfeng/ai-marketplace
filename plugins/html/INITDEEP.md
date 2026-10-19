<!-- init-deep:synced@293803c -->

# html 知识库

## 概述

HTML 视觉、架构图表与报告插件套件。包含三个技能：

1. `architecture-diagram`：遵循 huashu-design 设计规范生成高保真工业级系统架构拓扑图（单文件 HTML+SVG），强调曼哈顿正交长线、45° 米字折线与边界隔离；
2. `excalidraw-diagram`：生成手绘白板草图风格业务流程图与拓扑图（单文件 HTML+SVG 与原生 `.excalidraw`），具备粗糙度自然质感、手写字体与自适应视口；
3. `editorial-report`：把周报、项目进展、复盘简报等从大纲、文案写到单文件 HTML 报告特刊，内置 60 余类组件与双侧栏（合集导航 + 本文目录），正文口吻沿用用户设定的角色。

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
        │   ├── template.html       # 双主题报告空壳（复制后填槽，含双侧栏）
        │   ├── components/         # 组件片段（图表类在 charts/ 子目录，含 Pele 容器）
        ├── scripts/
        │   ├── README.md
        │   └── sync-nav.mjs        # 导航快照注入与漂移校验
        └── examples/
            └── example.html        # 全部组件与状态变体的占位参考（双侧栏演示）
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
| 报告模板与组件片段           | `skills/editorial-report/references/template.html` / `references/components/`                           |
| 报告合集导航与双侧栏         | `skills/editorial-report/references/report-nav.md` / `scripts/sync-nav.mjs`                             |
| 查看完整实战示例             | `skills/architecture-diagram/examples/example.html` / `skills/excalidraw-diagram/examples/example.html` |

## 约定

- **单一文件自由壳层**：生成的 HTML 文件必须完全自包含，双击或任意浏览器均可直接打开交互，不依赖 Node/本地构建服务；
- **外壳柔和、画布守规**：页面外层容器与工具栏使用 `--radius-*` 圆角 token（与 replay 一致：徽标胶囊、按钮 8px、卡片 12px、画板 14px），内部架构图/白板保留原有节点圆角或自然手绘糙度（`roughness: 1`）；
- **单一事实源驱动**：
  - `architecture-diagram` 以 `#main-diagram-svg` 及其结构化图层为事实源；
  - `excalidraw-diagram` 以内嵌 `<script type="application/json" id="excalidraw-data">` 为事实源，经 Rough.js 动态渲染进 SVG；
  - `editorial-report` 合集导航以共享 `report-nav.json`（最高两级）为唯一编辑源，页面内嵌快照由 `sync-nav.mjs` 注入，禁止手抄；
- **配色与字体对齐 replay**：`architecture-diagram` 采用 replay-post-html 的纸白墨蓝，`excalidraw-diagram` 采用 replay-html 的暖纸笔记本；只用系统字体栈（标题衬线），不引入外部 Web 字体；
- **二次元点缀统一**：三个技能与 replay 的 HTML 模板末尾都有同构的「ACCENT · 二次元点缀」样式段（樱粉 `--sakura`、✦ 四角星、角落网点、对话气泡、平涂错位阴影），只借漫画语法、不放角色素材，改点缀时几处同步；
- **多端与双向兼容**：深浅双主题默认跟随系统并可手动切换持久化（深浅模式下文字与描边清晰）、桌面与约 `390px` 移动视口自适应；
- **完整导出矩阵**：SVG、PNG (2x)、PDF 与剪贴板复制；白板技能额外支持原生 `.excalidraw` 导出与在线打开；
- **报告先大纲后文案后套壳**：`editorial-report` 三步各自落盘到 `reports/<日期>-<slug>/`（或用户指定位置），视觉只来自 `template.html`，配色与 replay-post-html 同源，不在单篇报告里另写 `<style>`；不内置角色，口吻沿用用户的设定。

## 反模式

- 把导出后的 SVG 当作白板技能的编辑源——原生图元数据位于 HTML 内嵌的 `excalidraw-data`，应从这里更新并重渲染；
- 生成依赖本地构建服务才能打开的页面——三个技能的交付物均应为可独立打开的单文件 HTML；
- 跳过大纲直接写长报告 HTML，或照搬 `editorial-report/examples/example.html` 的全部模块凑篇幅。

## 调试路径

1. 白板 HTML 无法生成 → 检查 `.excalidraw` 输入与 `skills/excalidraw-diagram/scripts/README.md` 中的 `render-to-html.mjs` 用法；
2. 架构图走线、标签越界 → 查 `skills/architecture-diagram/references/svg-design.md` 与组件库；
3. 白板导出结果不符 → 核对内嵌 `excalidraw-data`、模板与导出代码路径；
4. 报告页面变成另一套配色或圆角 → 查 `index.html` 是否另写了 `<style>`，视觉只许来自 `editorial-report/references/template.html`；
5. 报告合集左栏不一致或缺失 → 先跑 `skills/editorial-report/scripts/sync-nav.mjs <report-nav.json> --check`，再看页面 `#report-nav-data` 槽是否为空 `{}`。
