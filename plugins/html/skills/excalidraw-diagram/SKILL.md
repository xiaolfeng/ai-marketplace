---
name: excalidraw-diagram
description: 生成可交互、可导出的 Excalidraw 手绘白板风格流程图与拓扑图（单文件 HTML+SVG 与原生 .excalidraw）。适用于业务流程、系统拓扑、泳道活动、思维导图、时序图与数据流图可视化；先规划业务走向与走廊，再计算图元尺寸与坐标，支持深浅双主题、平移缩放及 SVG/PNG/PDF/Excalidraw 源码导出。
license: MIT
metadata:
  version: "0.0.3"
---

# Excalidraw Diagram

产出高保真 Excalidraw 手绘白板风格图表与单文件独立 HTML 网页。页面提供深浅双主题无缝切换、视口平移滚轮缩放、纯画布矢量导出以及原生 `.excalidraw` 源码下载，支持在 Excalidraw 官网或 VS Code 中无缝二次编辑。

## 资源地图

| 资源 | 位置 | 说明 |
| --- | --- | --- |
| 空白 HTML 起手模板 | [references/template.html](references/template.html) | 提供自适应视口、双主题、交互与全格式导出的独立单文件壳层 |
| 白板手绘设计与几何规范 | [references/excalidraw-design.md](references/excalidraw-design.md) | 图元比例、粗糙度、语义色彩、走线与文字排版计算指南 |
| 页面壳层、交互与浏览器验证 | [references/html-scaffolding.md](references/html-scaffolding.md) | 视口平移缩放、主题切换机制、全格式导出与移动端约 390px 验收标准 |
| 图元类型规范指南 | [references/element-types.md](references/element-types.md) | 矩形、椭圆、菱形、箭头、连线与独立文本图元规范速查 |
| JSON 数据结构参考 | [references/excalidraw-schema.md](references/excalidraw-schema.md) | 原生 `.excalidraw` 数据协议与字段说明 |
| 端到端实战示例页面 | [examples/example.html](examples/example.html) | 电商订单结算与风控履约完整业务流示例 |
| 示例业务说明 | [examples/sample-flow.md](examples/sample-flow.md) | 示例图表覆盖维度与交付验收对照 |
| 典型图表模板库 | [references/templates/](references/templates/) | 包含流程图、泳道图、类图、ER图、时序图、导图等 8 种原生模板 |
| 辅助工具脚本 | [scripts/](scripts/) | 包含 HTML 转换生成、连线注入、图标库拆解等自动化脚本 |

## 执行流程

### 1. 意图解析与图表类型规划

根据用户自然语言需求确定最适合的白板图表类型：

- **业务流程图 (Flowchart)**：顺序步骤、审批流向、判定分支（使用矩形步骤 + 菱形分支 + 椭圆起止）；
- **系统架构拓扑 (Architecture)**：分层微服务、API网关、外部系统、存储与消息总线（使用手绘圆角矩形 + 正交走线）；
- **泳道业务流 (Swimlane)**：跨部门、跨系统协作流程（顶部角色列头 + 纵向泳道容器 + 跨泳道指向箭头）；
- **思维导图 (Mind Map)**：核心议题居中，3-6 个主分支向四周辐射扩散；
- **时序交互图 (Sequence)**：顶部水平平铺参与角色，向下垂直延伸生命线，水平箭头传递消息；
- **实体关系图 (ER Diagram)**：实体表矩形列出字段，连线标注 1:1、1:N 映射关系；
- **数据流图 (DFD)**：外部实体、数据处理过程、持久化数据存储与数据流动通道。

### 2. 计算白板要素与走廊坐标

生成坐标前完成核心规划：

1. **主流程直线优先**：核心业务主调用链优先采用水平从左到右或从上到下直线走向；
2. **分支走廊预留**：异常流、风控拦截或降级回滚向下方或侧边折弯，不侵占主流程正交直线；
3. **图元尺寸留白**：尺寸由文本行数与字号共同决定，四周保留至少 `16px` 内边距，严禁文字爆框或贴边；
4. **端点精准对齐**：箭头起点与终点严格贴合图元边框边界，相对坐标 `points` 数组计算准确；
5. **语义低饱和配色**：客户端/接入采用浅蓝 (`#a5d8ff`)，服务/执行采用浅绿 (`#b2f2bb`)，分支/缓存采用金黄 (`#ffd43b`)，异常/拦截采用绯红 (`#ffc9c9`)，存储/队列采用浅紫 (`#d0bfff`)。

### 3. 生成 Excalidraw 原生数据并构建独立 HTML 网页

1. 构建合法完整的 `.excalidraw` JSON 数据（含 `type: "excalidraw"`, `version: 2`, `elements` 数组与 `appState`）；
2. 复制 [references/template.html](references/template.html) 作为自由页面壳层；
3. 将生成的 JSON 数据嵌入到页面的 `<script type="application/json" id="excalidraw-data">` 节点中；
4. 替换页面的 `[PROJECT NAME]`、副标题、图例项与规格说明卡片；
5. 运行 [scripts/render-to-html.mjs](scripts/render-to-html.mjs) 可自动化执行上述包装生成流程；
6. 产出单文件独立 HTML 网页，同时可独立保存同名 `.excalidraw` 文件供二次编辑。

## 交付检查

### 白板手绘视觉与图元规范

- [ ] 图元边框自然手绘（`roughness: 1`），无机械僵硬感，无严重散架畸变
- [ ] 文本统一采用手写风格字体（Excalifont / Virgil），文字四周留白充分，无截断爆框
- [ ] 连线首尾精准吸附在对应卡片边缘，箭头进入卡片前保留至少 `20px` 缓冲
- [ ] 标签与线条保持自然呼吸间距（`12–16px`），不压线、不遮挡箭头
- [ ] 深色与浅色主题下图形描边、填充与文字对比度均清晰可读

### HTML 页面布局与自适应

- [ ] 桌面端（1260px 容器）各区域无错位，标题栏、工具栏、画板面板、图例与规格卡片完整
- [ ] 移动端（约 390px 视口）页面无横向滚动溢出，工具栏两列网格对齐，按钮无需横滑即可操作
- [ ] 画板自动根据所有图元计算最小包围盒并居中自适应，无图元超出初始可视区域

### 交互与视口控制

- [ ] 主题切换正常工作，并在 `localStorage` 中持久化用户选择
- [ ] 画板支持鼠标左键拖拽平移、滚轮以指针为焦点平滑缩放、双击或重置按钮快速还原 100%
- [ ] 移动端支持单指平移拖拽与双指捏合缩放

### 导出与多端分发

- [ ] 导出纯矢量 SVG：包含独立完整手绘路径与底板，无外部变量残留
- [ ] 导出高清 PNG：采用 2x 视网膜抗锯齿栅格化
- [ ] 导出保真 PDF：使用 jsPDF 生成横向高清白板工程图
- [ ] 导出原生 .excalidraw：完整输出标准 JSON，拖入 [excalidraw.com](https://excalidraw.com) 可继续二次编辑
- [ ] 环境支持时「复制图片」可正常将 PNG 写入系统剪贴板
