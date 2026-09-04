# html

HTML+SVG 技术可视化插件。

## architecture-diagram

生成可交互、可导出的通用架构图，覆盖整体关系、组件拓扑、流式处理、事件流、安全通道与部署边界。

主要能力：

- 先分析同步、异步、安全、部署边界、外部依赖和预留节点，再计算坐标；
- 节点按文字、职责和连接数量使用不同尺寸；
- 连线标签独立成层，线路首尾端点精准贴合节点边框；
- 中性 SVG 组件位于 `references/components/`，可独立打开或复制 `<g>` 复用；
- 桌面与约 `390px` 移动视口自适应响应式；
- 主题切换、平移、缩放和重置；
- SVG、PNG、PDF、Copy 只导出纯架构画布。

## 安装

```bash
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install html@ai-marketplace

# 或安装单个技能
npx skills add xiaolfeng/ai-marketplace --skill architecture-diagram
```
