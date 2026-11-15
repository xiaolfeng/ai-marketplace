# 报告视觉规范（v2 淡雅无衬线特刊）

报告视觉由受版本管理的 [`template.html`](./template.html) 与组件渲染器统一驱动。默认作者入口为 [XSU 语法](xsu.md) → [example.xsu](../examples/example.xsu) → `validate/render`；无需全文读取模板，禁止手改生成的 HTML/CSS/JS。

## 定位与阅读质感

面向技术汇报、周报、复盘、调研与架构决策的阅读型特刊（Knowledge-base Editorial 风格）。版式顺着报告叙事推进：刊头与期号、无衬线大标题、淡雅浅底核心判断卡、三栏独立事实卡、统一节奏（Owl 选择器）的分节论证、架构与治理图示、未决事项与尾声。全量去除了旧版衬线体、标题荧光笔底纹、深色反白判断框及厚重投影，依靠细描边（`1px solid var(--line)`）、留白阶梯与柔和马卡龙语义色建立层次。

## 主题与主色切换

- **深浅主题**：XSU 根 `theme: "system" | "light" | "dark"`，默认 `"system"`（首帧前同步系统深浅色，支持右上角胶囊开关手动切换并写入 `localStorage`）。
- **主色调色板**：XSU 根 `accent: "teal" | "slate" | "indigo"`，默认 `"teal"`（编译期写入 `<html data-accent="...">`）。浅色与深色所有正文及徽章前景均满足 WCAG AA（对比度 ≥ 4.5:1）。

### 主色调色板

| 主色枚举       | 浅色 `--accent` / `--accent-tint` | 深色 `--accent` / `--accent-tint` | 气质定位           |
| -------------- | --------------------------------- | --------------------------------- | ------------------ |
| `teal`（默认） | `#0f766e` / `#e8f5f3`             | `#6fd1c4` / `#15302d`             | 清透架构与工程特刊 |
| `slate`        | `#3d5c80` / `#edf1f6`             | `#9db4d1` / `#1e2735`             | 沉稳技术复盘与周报 |
| `indigo`       | `#4c5fd5` / `#eef0fc`             | `#9aa8f5` / `#1f2438`             | 方案评审与决策简报 |

### 基础语义令牌

| 变量                       | 浅色值                | 深色值                | 用途                             |
| -------------------------- | --------------------- | --------------------- | -------------------------------- |
| `--bg` / `--paper`         | `#f6f7fb` / `#ffffff` | `#12141a` / `#181b22` | 页面底色（含顶部淡晕染）与卡片面 |
| `--surface-2`              | `#f8f9fc`             | `#1c2028`             | 表头、图示衬底与次级面板         |
| `--ink` / `--read-ink`     | `#1f2937` / `#27303f` | `#e6e8ec` / `#dfe2e8` | 标题与高可读性正文               |
| `--muted` / `--read-muted` | `#525b6b`             | `#a3a9b5`             | 导语、表头、图注与辅助说明       |
| `--line` / `--line-soft`   | `#e6e9ef` / `#eef1f6` | `#262a33` / `#1f232b` | 卡片细描边与行间分隔线           |
| `--ok` / `--ok-tint`       | `#24784d` / `#edf7f1` | `#6fcf97` / `#14261c` | 达成、就绪与正向状态             |
| `--mark` / `--mark-tint`   | `#99580a` / `#fdf5ea` | `#e3b071` / `#2a2318` | 注意、排队与待核实状态           |
| `--rose` / `--rose-tint`   | `#b83d56` / `#fcf0f2` | `#e58d9c` / `#2a171c` | 拒绝、限流与风险红线             |

## 排印、间距与无障碍

- **全无衬线栈**：标题、导语、正文与卡片统一使用 `--font-sans`（`-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", ...`）；编号、标签、代码与指标后缀使用 `--font-mono`。
- **单一字号阶梯**：`--fs-xs: 12px`、`--fs-sm: 13px`、`--fs-md: 14px`、`--fs-base: 15px`、`--fs-body: 16px`、`--fs-lg: 18px`。
- **间距与圆角阶梯**：`--s-1: 4px` 至 `--s-7: 48px`；外层卡片与面板统一 `--radius: 12px`，内嵌子块 `--radius-sm: 8px`，胶囊徽章与进度条 `--pill: 999px`。
- **章节垂直节奏**：`main > section` 内通过相邻兄弟选择器统一控制块间距（普通块间距 `24px`，章节头后 `32px`，小标题前 `48px`），模板中无任何 `!important` 覆盖补丁层。
- **交互与动效无障碍**：所有链接、按钮、折叠摘要与可聚焦控件具备 `:focus-visible` 双像素主题色外框；遵守 `@media (prefers-reduced-motion: reduce)` 自动收敛过渡与动画时长。

## Tailwind v4 + Lucide 增强与层级隔离

模板通过 `@layer theme, base, template, utilities` 管理样式优先级：

1. 内联核心模板置于 `@layer template`，完全离线或屏蔽外网时独立承担全部组件排版；
2. 异步加载的 `@tailwindcss/browser@4.3.5` 仅导入 `theme.css` 与 `utilities.css`（不启用 Preflight），并通过 `@theme inline` 将 `accent`、`accent-tint`、`ink`、`muted`、`paper`、`surface`、`line`、`success`、`warn`、`danger` 绑定至模板 CSS 变量；
3. Lucide（`lucide@1.72.0`）在 DOM 就绪后自动将 `<i data-lucide="...">` 替换为继承 `currentColor` 的线性 SVG，深浅色切换即时生效。

## 核心与 v2 扩展模块清单

单组件最小参考片段见 [`components/README.md`](./components/README.md)，全量可编译示例见 [`../examples/example.xsu`](../examples/example.xsu) 与 [`../examples/example.html`](../examples/example.html)。

| 模块名称             | XSU 组件             | HTML 结构 / 类名                          | 适用场景                                           |
| -------------------- | -------------------- | ----------------------------------------- | -------------------------------------------------- |
| **封面与判断卡**     | `Cover` + `Takeaway` | `.hero` + `.takeaway`                     | 刊头眉题、无衬线大标题、右侧淡雅核心判断卡         |
| **三问事实卡**       | `Glance`             | `.glance` + `.glance-item`                | 首屏三张独立圆角事实卡（右上 `#01`～`#03` 角标）   |
| **图示容器**         | `FigureBox`          | `.pele-box` + `.sw-fig` + `figcaption`    | 顶栏胶囊标签 + 右侧元信息 + 图示主体 + 底部图注    |
| **泳道时序图**       | `Swimlane`           | `.sw-*`（默认）/ `.sq-*`（紧凑）          | 2～8 参与者、阶段分组框、正反向实虚线箭头、自注释  |
| **分层容量流**       | `CapacityFlow`       | `.cap-flow` + `.cap-card` + `.cap-second` | 各层并发上限、箭头串联、超出行为胶囊与旁路补充行   |
| **双区状态机**       | `QueueZones`         | `.qa-states` + `.qa` + `.qa-rule`         | 等待区/执行区双栏卡片、双向流转指示与底部红线条    |
| **预算条**           | `BudgetBars`         | `.dl` + `.dl-row` + `.dl-bar`             | 延迟预算、配额或耗时分段比例条与注释               |
| **编号原则卡**       | `Principles`         | `.principles` + `.principle`              | 自动编号设计原则与治理公理三栏卡片                 |
| **评审进度与影响卡** | `ReviewProgress`     | `.rv-summary` + `.rv-bar` + `.rv-card`    | 评审计数、彩色比例条与带「影响说明」的结论卡片     |
| **左键右文双栏表**   | `KeyValueTable`      | `table.data.kv-table` + `col.col-key`     | 左列标题+徽章+归属小字，右列多段「现状/目标/边界」 |
| **自定义增强视图**   | `CustomHtml`         | `.custom-html`（可选 `.pele-box` 外框）   | 受安全清洗保护的 Tailwind 工具类 + Lucide 定制块   |

## 双侧栏

- **左侧 `.rail-nav` 文档集导航**：由 `render --nav <report-nav.json>` 编译注入内嵌快照，单篇不传 `--nav` 时自动隐藏；
- **右侧 `.rail-toc` 本文目录**：自动提取正文 `h2` / `h3`（满 3 条时显示），桌面端 `≥1240px` Sticky 常驻，窄屏自动收纳进顶部抽屉开关，打印时自动隐藏。
