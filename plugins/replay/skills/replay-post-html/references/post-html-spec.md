# 对外发布的翻页复盘报告规范（Post HTML Spec）

本规范定义 `replay-post-html` 单文件 HTML 的页面结构、交互与视觉约束。交互骨架与自己看的 [replay-html](../../replay-html/references/html-interaction-spec.md) 保持一致，差别在于内容组织（报告骨架）与视觉口吻（克制、正式）。

---

## 一、 设计哲学：像翻一份装订好的报告

长滚动页对外分享时有两个问题：读者很难判断「还有多少」，也很难把某一节单独转给别人。翻页形式把报告切成一张张「纸」：

1. **一页一节**：每页是一张带页眉（栏目 · 页码）的白纸卡片，版心 860px；
2. **封面即结论**：第一页放标题、导语、署名、TL;DR 与影响数字，只读封面也能拿走结论；
3. **页尾承上启下**：每页底部用一句斜体过渡语（来自 `leadsToNext.hook`）+「继续：〈下一页标题〉→」按钮衔接；
4. **每页可单独分享**：URL hash 精确到页（`#cover`、`#background`、`#timeline`、`#step-3`、`#decisions`、`#faq`、`#status`）。

## 二、 页面清单

| 顺序 | hash          | 页面              | 内容来源 | 缺省处理 |
| ---- | ------------- | ----------------- | -------- | -------- |
| 1    | `#cover`      | 封面与摘要        | `publication.headline/dek/authors/readingTime/tldr/impact`、`meta.date/repo/status` | `headline` 缺省用 `meta.title`，`dek` 缺省用 `meta.subtitle` |
| 2    | `#background` | 背景              | `background.originGoal`、`background.whyConfusing`（自动拆分「1) 2)」）、`actorsAndRepos` 表 | — |
| 3    | `#timeline`   | 时间线            | `publication.timeline`，带 `stepRef` 的条目可点击翻到对应步骤页，无 `stepRef` 的视为计划项（虚线圆点） | 无数据时不生成此页 |
| 4…   | `#step-<id>`  | 过程详述，每阶段一页 | `steps[]`：标题、summary、切入点（`lookAt`）、背景（`whyLookHere`）、发现与行动、常见误解（误解 / 实际情况并排）、证据图（图 k-n） | `status` 为 `decision` / `blocked` 时页眉显示「关键决策」「受阻」 |
| …    | `#decisions`  | 关键决策          | `publication.decisions`，选项与 `choice` 一字匹配时标「采纳」，其余标「未采纳」 | 无数据时不生成此页 |
| …    | `#faq`        | 常见问题          | `confusionMatrix` | 无数据时不生成此页 |
| 末页 | `#status`     | 现状、后续与经验  | `endState` 两张表、`publication.lessons`、`publication.redactionNote` 与来源说明 | — |

## 三、 交互契约

| 操作 | 行为 |
| ---- | ---- |
| `→` / `l` / `PageDown`、底栏「下一页」、页尾「继续」 | 翻到下一页并回到顶部 |
| `←` / `h` / `PageUp`、底栏「上一页」 | 翻到上一页 |
| `Home` / `End` | 回到封面 / 跳到末页 |
| `t`、顶栏 ≡ | 打开或关闭目录抽屉（按「概览 / 过程详述 / 结论」分组） |
| `Esc` | 关闭抽屉与菜单 |
| 菜单 | 复制本页链接、导出 Markdown（按 replay-post-md 骨架拼装）、打印 / 存为 PDF（每页一张纸，证据完整展开） |

阅读位置与已读页存入 `localStorage`（读写包在 `try/catch` 中），底栏短横条标示当前页与已读页。

## 四、 视觉约束

- **配色**：底色 `#f7f7f3`，纸张纯白，墨色正文 `#16181d`，唯一强调色墨蓝 `#2445c9`；状态色只用于「修复」（绿）与「待执行 / 关键决策」（琥珀）；深色模式为 `#0f1114` 底、`#16191e` 纸，强调色 `#8fa5ff`；
- **字体**：标题系统衬线、正文系统无衬线、代码等宽；不引用外部字体；
- **克制**：不使用 emoji、霓虹色与发光效果；区块标签用小号大写字距标题（「切入点」「发现与行动」「证据」）；
- **数字**：影响指标用衬线大号数字 + 指标名 + 口径说明三行，等宽数字对齐；
- **响应式**：640px 以下纸张边距收窄，「误解 / 实际情况」改为上下排列，时间线改为左侧单轴，宽表格在容器内横向滚动，保证 390px 宽度页面本身不出现横向滚动；
- **动效**：翻页 0.36s 上浮淡入，遵守 `prefers-reduced-motion`。
