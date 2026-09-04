# Excalidraw 模板目录 (Templates)

这里存放预置的 8 类典型白板图表起手模板（原生 `.excalidraw` 格式），可直接在 Excalidraw / VS Code 中打开，或作为生成图表的结构参考底稿。

| 模板文件 | 图表类型 | 适用场景与结构特点 |
| --- | --- | --- |
| [flowchart-template.excalidraw](flowchart-template.excalidraw) | 流程图 | 包含开始/结束椭圆、处理矩形、条件判定菱形与分支箭头 |
| [business-flow-swimlane-template.excalidraw](business-flow-swimlane-template.excalidraw) | 泳道业务流 | 包含用户、网关、订单系统等列头横幅与纵向泳道流转 |
| [relationship-template.excalidraw](relationship-template.excalidraw) | 组件关系图 | 网格化排列的实体卡片与带标签双向连接箭头 |
| [mindmap-template.excalidraw](mindmap-template.excalidraw) | 思维导图 | 中心辐射型主题核心与发散分支子节点 |
| [sequence-diagram-template.excalidraw](sequence-diagram-template.excalidraw) | 时序交互图 | 水平参与者角色卡片、纵向虚线生命线与水平时序箭头 |
| [class-diagram-template.excalidraw](class-diagram-template.excalidraw) | 类图 | 包含类名、属性列表与方法列表的三段式手绘矩形结构 |
| [data-flow-diagram-template.excalidraw](data-flow-diagram-template.excalidraw) | 数据流图 (DFD) | 外部实体、处理过程与开放式数据存储通道 |
| [er-diagram-template.excalidraw](er-diagram-template.excalidraw) | 实体关系图 (ER) | 标明主键 PK 与外键 FK 的数据表卡片及基数关系线 |

## 使用约定

1. 模板提供的是基础图元组织形态与间距示例，实际生成时按业务复杂度自由扩展；
2. 图元文字修改后，需根据文本量重新计算卡片宽高，保持内边距至少 `16px`；
3. 可通过 `node scripts/render-to-html.mjs <template-path>` 将任意模板快速转为交互式 HTML 页面进行预览。
