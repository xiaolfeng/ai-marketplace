# 报表组件库 (Report Components)

本目录收纳报告特刊的标准组件片段。样式全部由 [`../template.html`](../template.html) 提供，浅色/深色、自适应与打印都走同一套壳。图表类组件统一放在 [`charts/`](./charts/) 子目录。

## 目录索引

### 1. 封面与刊头

| 文件                                     | 模块名称                | 适用场景                                         |
| ---------------------------------------- | ----------------------- | ------------------------------------------------ |
| [`hero-banner.html`](./hero-banner.html) | **大题图/专题横幅封面** | 年度大刊、技术调研、重大故障复盘顶部展板         |
| [`hero-metric.html`](./hero-metric.html) | **数据焦点型封面**      | 以单一突破性大数字（99.99%、1.2M QPS）主导的汇报 |
| [`takeaway.html`](./takeaway.html)       | **核心判断匣**          | 放进 `.hero` 做封面右侧定调；或作通栏判断        |
| [`glance.html`](./glance.html)           | **事实条 (01/02/03)**   | 周报首屏（做成 / 卡住 / 下一步）                 |
| [`block-head.html`](./block-head.html)   | **特刊章节头**          | `03 / 生产` 编号 + 大标题                        |

### 2. 图表组件（[`charts/`](./charts/) 子目录）

| 文件                                                                       | 模块名称                 | 适用场景                                                                      |
| -------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| [`charts/chart-bar.html`](./charts/chart-bar.html)                         | **SVG 柱状与分组条形图** | 耗时分布、调用量对比、资源占用分析                                            |
| [`charts/chart-line.html`](./charts/chart-line.html)                       | **SVG 趋势折线与面积图** | QPS 变化曲线、错误率趋势、极值标注                                            |
| [`charts/chart-donut.html`](./charts/chart-donut.html)                     | **SVG 环形占比分布图**   | 流量来源构成、错误分类占比                                                    |
| [`charts/chart-gauge.html`](./charts/chart-gauge.html)                     | **SVG 仪表盘**           | 单一指标水位、健康度、达成率                                                  |
| [`charts/chart-heatmap.html`](./charts/chart-heatmap.html)                 | **热力格矩阵**           | 时段×维度密度、发布日历、故障频次                                             |
| [`charts/chart-scatter.html`](./charts/chart-scatter.html)                 | **散点分布图**           | 双变量相关性、耗时散点、离群标注                                              |
| [`charts/chart-stacked-bar.html`](./charts/chart-stacked-bar.html)         | **堆叠条形图**           | 构成随时间变化、多段占比对比                                                  |
| [`charts/chart-sparkline-table.html`](./charts/chart-sparkline-table.html) | **迷你趋势表格**         | 表格行内 sparkline 走势                                                       |
| [`charts/gantt-roadmap.html`](./charts/gantt-roadmap.html)                 | **甘特与路线图**         | Mermaid `gantt`（Pele 渲染）：双时间标尺、阶段泳道框、`vert` 竖线标记与里程碑 |
| [`charts/matrix-quadrant.html`](./charts/matrix-quadrant.html)             | **2x2 四象限决策矩阵**   | 收益/代价分析、风险与紧急度优先级排序                                         |
| [`charts/pele-diagram.html`](./charts/pele-diagram.html)                   | **Pele 图表容器**        | Mermaid 语法文本由 Pele 渲染成 SVG                                            |

### 3. 指标与进度

| 文件                                 | 模块名称                 | 适用场景                                               |
| ------------------------------------ | ------------------------ | ------------------------------------------------------ |
| [`stat-grid.html`](./stat-grid.html) | **KPI 与范围状态验收卡** | 大数字 KPI 看板，以及带状态顶条与徽章的 2×2 范围验收卡 |
| [`meter.html`](./meter.html)         | **进度条与议题强度**     | 完成度、水位、议题强度分析                             |

### 4. 对比与决策

| 文件                                         | 模块名称                | 适用场景                                 |
| -------------------------------------------- | ----------------------- | ---------------------------------------- |
| [`compare-cards.html`](./compare-cards.html) | **双栏对比卡**          | A vs B、改造前后对比，`.target` 突出推荐 |
| [`compare-table.html`](./compare-table.html) | **多维对比矩阵**        | 3+ 方案横向多维度选型评审                |
| [`compare-diff.html`](./compare-diff.html)   | **代码/配置 Diff 对照** | 配置文件变更、SQL 迁移、字段前后对比     |
| [`scorecard.html`](./scorecard.html)         | **多维加权评分卡**      | 方案选型量化打分、技术评审评分卡         |

### 5. 提示、标签与状态

| 文件                             | 模块名称         | 适用场景                                             |
| -------------------------------- | ---------------- | ---------------------------------------------------- |
| [`callout.html`](./callout.html) | **状态提示框**   | warn / danger / info / success；两栏用 `.split-note` |
| [`labels.html`](./labels.html)   | **证据口径标签** | 已确认 / 媒体转述 / 技术反推 / 未知                  |
| [`badges.html`](./badges.html)   | **任务状态徽章** | done / progress / warn / blocked / plan              |

### 6. 流程、时序与架构

| 文件                                   | 模块名称             | 适用场景                               |
| -------------------------------------- | -------------------- | -------------------------------------- |
| [`timeline.html`](./timeline.html)     | **时间线与里程碑**   | 日期在左、圆点与标题首行共用 32px 中轴 |
| [`system-map.html`](./system-map.html) | **深底系统流程图**   | 最小可行流程推断、阶段与反馈回路       |
| [`file-tree.html`](./file-tree.html)   | **目录拓扑与架构树** | 等宽字符目录树、增删改注释             |

### 7. 叙述、团队与排印

| 文件                                           | 模块名称           | 适用场景                           |
| ---------------------------------------------- | ------------------ | ---------------------------------- |
| [`split.html`](./split.html)                   | **左右分栏**       | 1.2fr 主叙述 + 0.8fr 侧注          |
| [`quote.html`](./quote.html)                   | **特刊引述**       | 左侧色条金句                       |
| [`personnel-grid.html`](./personnel-grid.html) | **干系人职责卡**   | 负责人、Reviewer、SRE 团队职责卡   |
| [`gallery-grid.html`](./gallery-grid.html)     | **物料与截图画廊** | 2列/3列圆角截图展位与 Caption 说明 |
| [`bits.html`](./bits.html)                     | **圆点事实清单**   | 并列事实要点（圆点）               |
| [`steps.html`](./steps.html)                   | **等宽序号步骤**   | 有依赖的有序行动计划               |

### 8. 数据、代码与附录

| 文件                                               | 模块名称           | 适用场景                               |
| -------------------------------------------------- | ------------------ | -------------------------------------- |
| [`data-table.html`](./data-table.html)             | **自适应数据表**   | 桌面整齐表格，移动端 `data-label` 叠卡 |
| [`code-block.html`](./code-block.html)             | **代码与配置块**   | 配置文件、命令调用示例                 |
| [`details-collapse.html`](./details-collapse.html) | **可折叠技术附录** | 详细日志、DDL、排障记录折叠            |
| [`open.html`](./open.html)                         | **未决事项**       | 待拍板开放问题（无未决时整段省略）     |

## 使用方式

复制 [`../template.html`](../template.html) 作为正式报告起点，在槽位里按需插入片段并填事实。需要查看全部组件、状态变体和组合顺序时打开 [`../../examples/example.html`](../../examples/example.html)；example 是参考目录，不是每篇报告都必须保留的固定结构。封面要右侧判断匣时，把 `takeaway.html` 放进 `.hero`。
