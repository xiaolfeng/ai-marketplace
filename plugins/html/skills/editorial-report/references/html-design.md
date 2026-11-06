# 报告视觉规范

报告视觉由受版本管理的模板与组件渲染器提供。默认作者入口为 [XSU 语法](xsu.md) → [example.xsu](../examples/example.xsu) → `validate/render`；无需全文读取模板，禁止复制模板填槽或手改生成的 HTML/CSS/JS。下文 token、class 和 HTML 骨架用于视觉选型与维护者参考，不是单篇报告的手写 API。[旧 example.html](../examples/example.html) 仍是全量视觉组件目录，不等于每篇正文或全部 XSU API。

## 这是什么

一份给技术汇报、周报、复盘、调研、方案决策用的报告特刊。读起来像印出来的观察报告，不像 SaaS 产品站，也不像一屏一页的 PPT。

版式顺着报告本身的叙事走：刊头与期号、封面大标题、核心判断、事实条、分节论证、证据分层、未决事项。配色和圆角跟 replay-post-html 同源，是纸白墨蓝的正式报告气质；深色用来夜读和投屏，两种主题共用同一套模块。

## 主题

XSU 根 props 用 `theme: "system"`（默认）、`"light"` 或 `"dark"`。除用户明确要求外保持 system；读者手动选择由固定运行时持久化。不手改 HTML 的 data-theme。维护者保证主题首帧、存储失败降级与深浅色对比；不要用背景色过渡制造短暂低对比。

## 颜色

浅色：

| 变量            | 值        | 用途                                   |
| --------------- | --------- | -------------------------------------- |
| `--ink`         | `#16181d` | 正文与深色面板底                       |
| `--muted`       | `#464b55` | 次级文字、导语、表头                   |
| `--subtle`      | `#7a7f89` | 辅助说明                               |
| `--bg`          | `#f7f7f3` | 页面底色                               |
| `--paper`       | `#ffffff` | 卡片、表格、事实条底色                 |
| `--accent`      | `#2445c9` | 眉题、链接、强调、主数据系列           |
| `--accent-tint` | `#e9ecf9` | 强调浅底                               |
| `--mark`        | `#a85b0b` | 章节编号、序号、次数据系列、判断匣顶条 |
| `--mark-tint`   | `#f6ead9` | 次强调浅底                             |
| `--rose`        | `#c2485a` | 第三数据系列、高风险象限               |
| `--rule`        | `#e3e3dc` | 发丝线、卡片描边                       |
| `--rule-strong` | `#cdcdc4` | 刊头、章节分隔线                       |

深色：

| 变量            | 值        | 用途         |
| --------------- | --------- | ------------ |
| `--ink`         | `#e7e8eb` | 正文         |
| `--muted`       | `#b1b5bd` | 次级文字     |
| `--subtle`      | `#7d828c` | 辅助说明     |
| `--bg`          | `#0f1114` | 页面底色     |
| `--paper`       | `#16191e` | 抬起的卡片面 |
| `--accent`      | `#8fa5ff` | 强调         |
| `--accent-tint` | `#1c2238` | 强调暗底     |
| `--mark`        | `#f0b264` | 次强调       |
| `--mark-tint`   | `#2b2215` | 次强调暗底   |
| `--rose`        | `#e07a8a` | 第三系列     |
| `--rule`        | `#2a2e35` | 发丝线       |
| `--rule-strong` | `#3a3f48` | 分隔线       |

状态色随主题切换：`--color-success` / `--color-warn` / `--color-danger` / `--color-info`，各自带 `*-bg` 与 `*-border`。

## 形状

圆角层级与 replay 一致，统一写在模板的 Shape 区：

| 变量            | 值      | 用在哪里                                         |
| --------------- | ------- | ------------------------------------------------ |
| `--radius-lg`   | `14px`  | 事实条、核心判断匣、深底系统图、指标焦点面板     |
| `--radius-md`   | `12px`  | 各类卡片与 `*-box` 容器、提示框、表格、代码块    |
| `--radius-sm`   | `8px`   | 卡片内的子块：节点、象限、图例行、看板卡、问答项 |
| `--radius-xs`   | `6px`   | 涨跌标记、热力格                                 |
| `--radius-pill` | `999px` | 徽章、标签、进度条、主题切换器、头像             |

层级主要靠发丝线和字号建立，阴影只给指标卡、对比卡、要点卡和判断匣这类需要浮起来的元素，用 `var(--shadow)`。彩色顶条统一 3px，只用来标出语义（判断、风险、推荐），不再给每张卡片加中性墨色粗顶条。列表点、时间线节点、图例点都用圆点。

## 字体与排印

- 标题、导语、大数字：系统衬线 `"Songti SC", "Noto Serif SC", "Source Han Serif SC", ...`；
- 正文：系统无衬线 `-apple-system, "PingFang SC", "Noto Sans SC", ...`，16px，行高 1.72；
- 刊头、期号、标签、表头：系统等宽 `"SF Mono", "JetBrains Mono", ui-monospace, ...`，字距 0.04–0.14em，标签可以全大写；
- 封面标题 `clamp(2.35rem … 4.6rem)`，字距 -0.03em，行高 1.08；
- 开启 `font-synthesis: none` 与 `line-break: strict`，标题 `text-wrap: balance`，正文 `pretty`。

不引用外部 Web 字体。XSU 默认 `--network offline`，禁止外部字体、脚本、JSON 请求与导航热刷新，图表优先原生 SVG 组件。Pele/Mermaid 仅显式 `--network connected` 时按需加载锁定的 Pele 1.6.0，离线遇到该能力应报错，不静默丢图。connected 不宣称全离线、完整 Mermaid 兼容或供应链安全保证；拒绝 HTML、交互链接与初始化指令，失败保留可读源码，详见 [XSU 参考](xsu.md)。

## 二次元点缀

模板样式末尾有一段独立的「ACCENT · 二次元点缀」，只借漫画的表达语法，不放角色素材：樱粉点缀色 `--sakura` / `--sakura-tint`、用 CSS 遮罩画的 ✦ 四角星 `--sparkle`、从角落径向淡出的极淡网点 `--tone`、平涂错位阴影（`box-shadow: 5px 5px 0 var(--sakura-tint)`）。点缀全部集中在这一段，生成页面时整段保留、不要另加；删掉整段即回到素版。打印时网点与错位阴影自动关闭。

| 点缀     | 落在哪里                                                                       |
| -------- | ------------------------------------------------------------------------------ |
| ✦ 四角星 | 刊名、封面眉题、章节编号、判断匣标题、本文目录标题、`ul.bits` 列表点、页脚收尾 |
| 网点     | 封面右上角、指标卡 / 对比卡 / 要点卡右下角                                     |
| 荧光笔   | 封面标题 `.title-copy` 下方的樱粉底纹                                          |
| 格号小签 | `.block-no` 胶囊小签，事实条每格右上角 `#01 / #02 / #03`                       |
| 对话气泡 | `.quote` 圆角气泡 + 尾巴 + 错位阴影                                            |
| 错位阴影 | 核心判断匣、指标焦点面板                                                       |
| 当前节点 | 时间线 `.timeline-dot.current` 樱粉外环                                        |

## 图标

UI 图标统一用内联 Lucide 线性图标：`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ...>`，`.ic` 默认 1em、继承文字颜色。不用 emoji 当图标，状态一律走 `.badge` / `.label` / `.callout`。终端会话这类「原样展示的输出」里的字符不算图标，照原文保留。

## 完整参考模板

[`../examples/example.html`](../examples/example.html) 是组件参考，不是一份模拟报告：

- 基于 `template.html`，包含封面、判断匣、事实条和下表全部组件；
- 业务正文全部是 `【替换：…】` 占位，不代表任何项目事实；
- 同时展示状态变体、移动端 `data-label`、进度宽度和双主题切换；
- 正式产物由 `report.xsu` 经技能自带编译器生成，按事实选择组件，不把 example 整页当成固定正文；
- 模板、组件样式与旧 catalog 由维护者同步验证；作者不为单篇报告修改这些资源。

单个组件的最小片段在 [`components/`](./components/README.md)。

## 模块清单

以下是旧模板视觉模块目录，供按内容选型和维护参考。作者只使用 `components --preset editorial` 当前注册的 XSU 组件；未映射的变体不能凭本表手写 HTML 绕过。

| 模块名称                     | HTML 结构 / 类名                                           | 适用场景                                                       |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| **1. 封面**                  | `.hero` + `h1 .title-copy`                                 | 刊头眉题、大标题、导语                                         |
| **2. 大题图/横幅封面**       | `.hero.hero-banner`                                        | 年度大刊、技术调研、重大故障复盘顶部展板                       |
| **3. 数据焦点型封面**        | `.hero.hero-metric`                                        | 以单一突破性大数字（99.99%、1.2M QPS）主导的汇报               |
| **4. 核心判断匣**            | `.takeaway` / `.verdict`                                   | 一句话定调。放进 `.hero` 做封面右侧深色匣，或作通栏判断        |
| **5. 事实条**                | `.glance` + `.glance-item`                                 | 周报首屏（做成 / 卡住 / 下一步）                               |
| **6. 章节头**                | `.block-head` + `.block-no`                                | `03 / 生产` 编号 + 大标题                                      |
| **7. 多维指标与范围验收卡**  | `.stat-grid` + `.stat-card`（`.card-pass/.card-warn/...`） | KPI 大数字看板，或带 `Tag + 标题 + 状态 Badge` 的范围验收矩阵  |
| **8. 进度与议题强度**        | `.meter-row` + `.meter`                                    | 议题强度、完成度分析（胶囊进度条）                             |
| **9. SVG 柱状与条形图**      | `.chart-box` + `svg` (rect)                                | 耗时分布、调用量对比、资源占用分析                             |
| **10. SVG 趋势折线与面积图** | `.chart-box` + `svg` (polyline/polygon)                    | QPS 变化曲线、错误率趋势、极值标注                             |
| **11. SVG 环形占比分布图**   | `.donut-wrap` + `svg` (circle stroke)                      | 流量来源构成、错误分类占比                                     |
| **12. 双栏方案对比**         | `.compare-grid` + `.compare-card`                          | A vs B，`.target` / `.after` 高亮推荐                          |
| **13. 维度对比矩阵**         | `table.compare-table`                                      | 多方案表，`th.highlight` / `td.highlight`                      |
| **14. 代码/配置 Diff 对照**  | `.diff-box` + `.diff-line.add/.del`                        | 配置文件变更、SQL 迁移、字段前后对比                           |
| **15. 多维加权评分卡**       | `.scorecard-box` + `.scorecard-row`                        | 方案选型量化打分、技术评审矩阵                                 |
| **16. 2x2 四象限决策矩阵**   | `.matrix-box` + `.quadrant-grid`                           | 收益/代价分析、风险与紧急度优先级排序                          |
| **17. 状态提示框**           | `.callout`（`-info` / `-warn` / `-danger` / `-success`）   | 发丝线圆角框 + 左侧 4px 色条；两栏说明用 `.callout.split-note` |
| **18. 证据口径标签**         | `.label.confirmed/.reported/.inferred/.unknown`            | 已确认 / 媒体转述 / 技术反推 / 未知                            |
| **19. 任务状态徽章**         | `.badge.badge-done/.badge-progress/...`                    | done / progress / warn / blocked / plan                        |
| **20. 时间线与里程碑**       | `.timeline` + `.timeline-item`                             | 日期在左，圆点与标题首行共用 32px 中轴                         |
| **21. 深底系统流程图**       | `.system-map` + `.flow` + `.node`                          | 最小可行流程推断、阶段与反馈回路                               |
| **22. Pele 图表容器**        | `.pele-box` + `pre.pele`                                   | Mermaid 语法文本由 Pele 渲染成 SVG，源码折叠                   |
| **23. 目录拓扑与架构树**     | `.file-tree-box` + `pre`                                   | 等宽字符目录树、增删改注释                                     |
| **24. 左右分栏**             | `.split` + 2 个 `.block`                                   | 1.2fr 主叙述 + 0.8fr 侧注                                      |
| **25. 引述**                 | `.quote`                                                   | 左侧色条金句                                                   |
| **26. 干系人职责卡**         | `.personnel-grid` + `.personnel-card`                      | 负责人、Reviewer、SRE 团队职责卡                               |
| **27. 物料与截图画廊**       | `.gallery-wrap` + `.gallery-grid`                          | 2 列 / 3 列截图展位与说明                                      |
| **28. 圆点事实清单**         | `ul.bits`                                                  | 并列事实要点                                                   |
| **29. 等宽序号步骤**         | `ol.steps`                                                 | 有依赖的有序行动计划                                           |
| **30. 自适应数据表**         | `.table-wrap` + `table.data`                               | 手机端用 `data-label` 叠成卡片                                 |
| **31. 代码块**               | `.code-block`                                              | 配置、命令调用示例                                             |
| **32. 可折叠技术附录**       | `details.details-collapse`                                 | 详细日志、DDL、排障记录折叠                                    |
| **33. 未决事项**             | `.open`                                                    | 虚线框收录待决（没有未决就整段省略）                           |

另外 30 余类扩展组件（故障头、5 Whys、看板、风险登记、FAQ 等）见 [`components/README.md`](./components/README.md)；图表类组件（含甘特、2x2 矩阵、Pele 容器）统一在 [`components/charts/`](./components/charts/)。

## 封面结构

默认封面是单栏标题。作者使用 Cover 与允许的子组件组合；以下为维护者理解旧视觉结构的示意，不复制到生成页：

```html
<header class="hero">
  <p class="kicker">…</p>
  <h1><span class="title-copy">…</span></h1>
  <p class="lede">…</p>
  <aside class="takeaway">
    <div class="takeaway-title">核心判断 / VERDICT</div>
    <p>一句定调。</p>
  </aside>
</header>
```

没有判断就不要硬塞，空匣比没有更假。

## 双侧栏

模板自带左右两条侧栏，都是「有数据才出现」的渐进增强，不需要在报告里写任何触发代码：

- **左侧 `.rail-nav` 文档集导航**：新 XSU 页面用 `render source.xsu --out index.html --nav <report-nav.json>` 派生内嵌快照，导航修改后重渲染；默认 offline 不热刷新，双击仍可使用快照。仅旧 HTML 用 sync-nav 注入，旧页面经 HTTP 的刷新行为不代表新页允许默认联网。当前页与上下篇由同一导航源计算，单篇不传 --nav；
- **右侧 `.rail-toc` 本文目录**：嵌套在 `.sheet-body` 内与 `<main>` 正文并排（刊头 `.top`、封面 `.hero` 与事实条 `.glance` 保持通栏），采用无框页边导轨边注样式（连续左侧发丝线 + 2px 蓝色激活滑块 + 章节编号与 h2/h3 树状嵌套缩进），不足 3 条不出现；随页面滚动 `sticky` 吸附并支持内部独立滑动，随正文结束自然滚走，点击后如目标在折叠的 `details` 里会自动展开；
- **断点**：≥1240px 左栏固定常驻、右栏在 `<main>` 旁 Sticky 浮动嵌套；以下收进刊头按钮组（与主题切换器同语言），点开为抽屉，Esc / 遮罩 / 跳转链接均可关闭；打印时侧栏与抽屉隐藏。

禁止在报告里手写左栏链接列表或手抄导航 JSON（示例页的演示数据除外）——那正是共享 JSON 要消灭的漂移源。

## 禁止

- 不在报告 HTML 里另写 `<style>` 覆盖主视觉；
- 不用 emoji 当 UI 图标；
- 不引入外部 Web 字体或模板以外的脚本；
- 不加满屏网点、高饱和撞色、霓虹发光、角色立绘或贴纸式装饰；
- 模块按实际内容取舍，不编造数字充数。
