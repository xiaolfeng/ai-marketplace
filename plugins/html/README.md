# html

HTML+SVG 技术可视化、手绘白板图表与报告特刊插件套件。

## 技能列表

### 1. architecture-diagram（系统全景拓扑图）

基于 huashu-design 设计规范生成高保真工业级系统架构全景图（单文件 HTML+SVG）。

主要能力：

- 先分析同步、异步、安全、部署边界、外部依赖和预留节点，再计算坐标；
- 节点按文字、职责和连接数量使用不同尺寸；
- 连线标签独立成层，线路首尾端点精准贴合节点边框；
- 中性 SVG 组件位于 `references/components/`，可独立打开或复制 `<g>` 复用；
- 桌面与约 `390px` 移动视口自适应响应式；
- 纸白墨蓝配色与系统字体栈，深浅主题跟随系统并可手动切换；平移、缩放和重置；
- SVG、PNG、PDF、Copy 纯画布导出。

### 2. excalidraw-diagram（手绘白板流转图）

生成高保真 Excalidraw 手绘白板风格图表与独立单文件 HTML 网页。

主要能力：

- 覆盖流程图、架构拓扑、泳道图、思维导图、时序图、ER 图与数据流图等 9 类白板图表；
- 纯手绘自然质感（Roughness 1），手写风格字体（Excalifont / Virgil），语义粉彩低饱和色板；
- 单文件独立 HTML 网页内嵌原生数据与轻量 Rough.js 渲染引擎，开箱即用；
- 暖纸笔记本配色与系统字体栈，深浅双主题跟随系统并可手动切换，画布自动根据图元极值计算最优 ViewBox；
- 鼠标滚轮缩放、拖拽平移、双击自适应还原；
- 支持导出纯矢量 SVG、2x 视网膜 PNG、高清 PDF，并可一键导出原生 `.excalidraw` 源码文件或一键在 Excalidraw 官网打开继续二次编辑。

### 3. editorial-report（HTML 报告特刊）

把周报、日报、月报、项目进展、复盘简报和指标简报写成单文件 HTML 报告。

默认写作只需 [XSU 作者参考](skills/editorial-report/references/xsu.md)、当前预设组件输出与 [example.xsu](skills/editorial-report/examples/example.xsu)，不要求全文读模板。[旧 example.html](skills/editorial-report/examples/example.html) 保留为视觉 catalog。html 插件版本 **0.4.0**，editorial-report 技能版本 **0.3.0**；另外两个图表技能不在本次 XSU 升级范围。

主要能力：

- 先核验事实、策划大纲与文案，再由 AI 写受限 report.xsu，经技能自带 scripts/xsu.mjs 校验和渲染；outline.md、copy.md、XSU 与 HTML 落盘到 `reports/<日期>-<slug>/` 或用户指定位置，后续只编辑 XSU，不手改生成 HTML/CSS/JS；
- 正文口吻沿用用户设定的角色（如 `CLAUDE.md` 里的人设），没有设定时用中性同事口吻；
- 纸白墨蓝配色与系统字体栈，圆角层级与 replay 一致，深浅主题跟随系统并可手动切换；
- 旧视觉库保留 60 余类组件与状态参考；当前 XSU 可用组件与字段以 components --preset editorial 为准，不把旧 catalog 等同于全量 XSU 覆盖，也不把全部组件铺进每篇正文；
- 渲染需 Node >=18，零第三方 npm 运行依赖；浏览器打开生成的单文件 HTML 无需 Node 或本地服务。默认 offline 禁止外部字体、脚本和 JSON；Pele 图表需显式 --network connected，此模式有图表能力与供应链限制，不宣称全离线；
- 双侧栏：右栏自动生成 h2/h3 本文目录，左栏由共享 report-nav.json（最高两级）驱动；新页用 render --nav 编译快照，改导航后重建并 --check，offline 不热刷新；sync-nav.mjs 仅维护旧 HTML，不修改 XSU 生成页。

## 安装

```bash
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install html@ai-marketplace

# 或安装单个技能
npx skills add xiaolfeng/ai-marketplace --skill architecture-diagram
npx skills add xiaolfeng/ai-marketplace --skill excalidraw-diagram
npx skills add xiaolfeng/ai-marketplace --skill editorial-report
```
