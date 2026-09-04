---
name: architecture-diagram
description: 生成可交互、可导出的 HTML+SVG 系统架构图。适用于整体架构、组件关系、流式处理、事件流、安全通道与部署边界可视化；先分析真实依赖，再计算节点尺寸、走廊、标签与坐标，并保证桌面、移动端、交互和导出完整可用。
license: MIT
metadata:
  version: "0.0.3"
---

# Architecture Diagram

产出单文件 HTML+SVG 架构图。页面提供深浅主题、平移缩放和纯画布导出；SVG 使用中性视觉语法表达真实关系，不套固定业务模板。

## 资源地图

| 资源 | 位置 |
| --- | --- |
| 空白 HTML 起手模板 | [references/template.html](references/template.html)（只提供自由页面壳层，不规定组件与画布尺寸） |
| SVG 语义、几何、标签和密度规范 | [references/svg-design.md](references/svg-design.md) |
| 页面、移动端、交互和导出规范 | [references/html-scaffolding.md](references/html-scaffolding.md) |
| 中性 SVG 组件（模板内容从这里选） | [references/components/README.md](references/components/README.md) |
| 通用完整示例 | [examples/example.html](examples/example.html) |

## 执行流程

### 1. 语义布局规划

生成坐标前完成九步分析：

1. 找出同步主调用链；
2. 找出异步事件链；
3. 找出安全、鉴权和管理通道；
4. 找出同一部署边界内的节点；
5. 找出外部依赖和持久化节点；
6. 标记当前启用与未来预留节点；
7. 确定需要水平或垂直对齐的节点；
8. 为每类通道预留独立走廊；
9. 再计算节点尺寸、端口与坐标。

主调用链优先直线；直接依赖优先对齐；同一边界节点保持靠近。弱依赖、异步通道和预留节点不抢占主链层级。预留节点使用低饱和色与虚线。不为对称或填满画布虚构组件。

### 2. 计算节点与标签

节点尺寸由文字长度、职责数与连接数共同决定。叶子节点可紧凑，多职责节点可扩展并使用真实内部分区；扩展后内容仍整体居中，分区不挤压标题、说明或端口。

图层顺序固定为：

```xml
<g id="boundaries">...</g>
<g id="connections-bent">...</g>
<g id="connections-straight">...</g>
<g id="connection-labels">...</g>
<g id="nodes">...</g>
```

每条线路使用唯一 `id`，用 `data-from` / `data-to` 指向起止节点 `id`，且线路首尾坐标必须吸附在对应 `data-node-box` 边界；标签用 `data-label-for` 关联线路。标签占用自然留白，不默认添加背景框；位置和排版建议见 [references/svg-design.md](references/svg-design.md)。

### 3. 构建页面

复制 [references/template.html](references/template.html) 作为自由页面壳层。模板不规定组件类型、节点尺寸、布局列数或画布坐标；根据需求从 [references/components/README.md](references/components/README.md) 选取中性 SVG 组件，再依照语义关系重新组合。画布 `viewBox` 与 `data-export-viewbox` 由实际图形边界决定，可自由扩展。移动样式只调整页面阅读，不改导出坐标。

## 交付检查

### SVG 布局与视觉

- [ ] 节点文字无越界，内部分区无重叠或贴边
- [ ] 连线标签不被节点遮挡，标签之间无重叠
- [ ] 每条线路首尾端点准确吸附对应卡片边界
- [ ] 标签不压线、不贴箭头，并与节点保持舒适呼吸感
- [ ] 线路无非预期交叉，节点与边界和相邻节点间距充足

### 页面布局

- [ ] 桌面端无截断，标题、工具栏、画布、图例和规格卡片完整
- [ ] 移动端无页面级横向溢出，按钮无需横向滚动即可操作
- [ ] 标题正常换行，图例和规格卡片收敛为单列
- [ ] 深色和浅色主题均可读

### 交互

- [ ] 主题切换、放大、缩小、拖拽和平移重置均可正常工作
- [ ] SVG、PNG、PDF 已支持；环境支持时 Copy 可用

### 导出

- [ ] 导出只包含 `#main-diagram-svg`
- [ ] 导出使用当前架构图声明的 `data-export-viewbox`、`width`、`height`，不套固定尺寸
- [ ] 样式已实体化，不含未解析 CSS 变量
- [ ] 深浅主题结果正确，当前 pan/zoom 不污染导出
