# html 知识库

## 概述

HTML 视觉与架构图表插件。`architecture-diagram` 生成可交互、可导出的通用 HTML+SVG 架构图，提供深浅双主题、视口平移缩放、自适应响应式布局与纯画布矢量导出。

## 目录结构

```text
html/
├── .claude-plugin/plugin.json
├── README.md
├── AGENTS.md
└── skills/
    └── architecture-diagram/
        ├── SKILL.md
        ├── references/
        │   ├── svg-design.md
        │   ├── html-scaffolding.md
        │   ├── template.html
        │   └── components/
        │       ├── README.md
        │       ├── node-and-flow.svg
        │       ├── stream-flow.svg
        │       ├── layered-services.svg
        │       ├── event-flow.svg
        │       └── security-flow.svg
        └── examples/
            ├── example.html
            └── sample-architecture.md
```

## 导航指南

| 任务 | 位置 |
| --- | --- |
| 修改语义布局、节点尺寸、标签与走线规则 | `references/svg-design.md` |
| 修改响应式、交互与导出规则 | `references/html-scaffolding.md` |
| 修改空白起手模板 | `references/template.html` |
| 增加中性可复用 SVG 图元 | `references/components/` |
| 查看通用完整示例 | `examples/example.html` |

## 约定

- 只写通用能力；示例和图元使用中性、可替换名称；
- 坐标前先做语义布局规划，不套固定四列；
- SVG 图层固定为边界、折线、直线、标签、节点；
- 标签使用 `data-label-for` 与线路关联，线路使用 `data-from` / `data-to` 关联起止节点并把端点吸附到节点边界；
- 节点使用 `data-node` / `data-node-box`，分区使用 `data-partition` / `data-partition-box`；
- 节点尺寸由内容、职责与连接数量决定；
- SVG、PNG、PDF、Copy 只导出 `#main-diagram-svg`。
