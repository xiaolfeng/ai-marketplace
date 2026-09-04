# html 知识库

## 概述

HTML 视觉与架构图表插件套件。包含两大核心技能：
1. `architecture-diagram`：遵循 huashu-design 设计规范生成高保真工业级系统架构拓扑图（单文件 HTML+SVG），强调曼哈顿正交长线、45° 米字折线与边界隔离；
2. `excalidraw-diagram`：生成手绘白板草图风格业务流程图与拓扑图（单文件 HTML+SVG 与原生 `.excalidraw`），具备粗糙度自然质感、手写字体与自适应视口。

两类图表均提供深浅双主题无缝切换、视口平移缩放、纯画布矢量导出（SVG/PNG/PDF/剪贴板），且 `excalidraw-diagram` 原生支持双向 `.excalidraw` 源码导入导出。

## 目录结构

```text
html/
├── .claude-plugin/plugin.json
├── README.md
├── AGENTS.md
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
```

## 导航指南

| 任务 | 位置 |
| --- | --- |
| 架构拓扑几何、走线与标签规范 | `skills/architecture-diagram/references/svg-design.md` |
| 架构拓扑起手模板与页面规范 | `skills/architecture-diagram/references/template.html` / `html-scaffolding.md` |
| 白板手绘设计美学与几何规范 | `skills/excalidraw-diagram/references/excalidraw-design.md` |
| 白板起手模板与交互规范 | `skills/excalidraw-diagram/references/template.html` / `html-scaffolding.md` |
| 白板原生 Schema 与图元规范 | `skills/excalidraw-diagram/references/excalidraw-schema.md` / `element-types.md` |
| 白板典型起手模板库 | `skills/excalidraw-diagram/references/templates/` |
| 白板 HTML 转换脚本与工具 | `skills/excalidraw-diagram/scripts/` |
| 查看完整实战示例 | `skills/architecture-diagram/examples/example.html` / `skills/excalidraw-diagram/examples/example.html` |

## 约定

- **单一文件自由壳层**：生成的 HTML 文件必须完全自包含，双击或任意浏览器均可直接打开交互，不依赖 Node/本地构建服务；
- **外硬内柔美学**：页面外层容器与工具栏遵循硬核直角（Sharp Edges），内部架构图/白板保留优雅圆角或自然手绘糙度（`roughness: 1`）；
- **单一事实源驱动**：
  - `architecture-diagram` 以 `#main-diagram-svg` 及其结构化图层为事实源；
  - `excalidraw-diagram` 以内嵌 `<script type="application/json" id="excalidraw-data">` 为事实源，经 Rough.js 动态渲染进 SVG；
- **多端与双向兼容**：支持深浅双主题切换（深浅模式下文字与描边清晰）、桌面与约 `390px` 移动视口自适应；
- **完整导出矩阵**：SVG、PNG (2x)、PDF 与剪贴板复制；白板技能额外支持原生 `.excalidraw` 导出与在线打开。
