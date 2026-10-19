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
- **二次元点缀**：模板样式末尾有一段独立的「ACCENT · 二次元点缀」，只借漫画的表达语法，不放角色素材：樱粉点缀色 `--sakura` / `--sakura-tint`、用 CSS 遮罩画的 ✦ 四角星 `--sparkle`、从角落径向淡出的极淡网点 `--tone`、平涂错位阴影（`box-shadow: 5px 5px 0 var(--sakura-tint)`）。点缀全部集中在这一段，生成页面时整段保留、不要另加；删掉整段即回到素版。打印时网点与错位阴影自动关闭。正式报告只放最轻的几处：页眉章节名前的 ✦、纸张右上角网点、大标题樱粉荧光笔下划线、TL;DR 错位阴影；
- **字体**：标题系统衬线、正文系统无衬线、代码等宽；不引用外部字体；
- **克制**：不使用 emoji、霓虹色与发光效果；区块标签用小号大写字距标题（「切入点」「发现与行动」「证据」）；
- **数字**：影响指标用衬线大号数字 + 指标名 + 口径说明三行，等宽数字对齐；
- **响应式**：640px 以下纸张边距收窄，「误解 / 实际情况」改为上下排列，时间线改为左侧单轴，宽表格在容器内横向滚动，保证 390px 宽度页面本身不出现横向滚动；
- **动效**：翻页 0.36s 上浮淡入，遵守 `prefers-reduced-motion`。

## 五、 组件片段

套壳与扩写时从 [`components/`](./components/) 取片段：每组件一个 kebab-case HTML 文件，顶部一行注释写组件名与适用场景，索引见 [`components/README.md`](./components/README.md)。

- `references/template.html` 仍是视觉唯一事实源：片段不带 `<style>`，生成页里不要另写 `<style>` 或内联样式，颜色、字体、圆角一律落回模板 token；
- 片段给的是结构与 `data-*` 契约（`data-go` 翻页、`data-act` 菜单动作、`data-component` 组件标识），占位文案用真实事实替换；
- 常规报告直接替换 `replay-data` JSON 即可由渲染器自动生成全部结构，只在扩写或定制区块时才需要手取片段。

## 六、 图表（Pele）

- **语法与渲染器**：图表文本用 Mermaid 语法，渲染器是 Pele 1.6.0（obsidianmd/pele，MIT），兼容 Mermaid 12.1.0 语法；
- **容器约定**：外层 `.pele-box`、文本节点 `pre.pele`（内容为 Mermaid 源码）。数据侧给步骤证据加 `evidence[].kind: "diagram"`，渲染器自动套用该结构；
- **按需加载**：页面出现 `pre.pele` 才注入 CDN（`https://cdn.jsdelivr.net/npm/pele@1.6.0/dist/pele.global.js`，全局 `window.pele`）；加载完成后对每个 `pre.pele` 执行 `pele.mount(el, el.textContent.trim())`，解析错误由 mount 自行展示，外层 `try/catch` 不抛页面级异常；
- **主题**：`--pele-*` 变量在模板 token 区映射到既有 token（如 `--pele-fg: var(--ink)`），深浅切换自动生效、无需重渲染；渲染后源码可用 `<details class="pele-src">` 折叠留底（克制使用）；
- **导出与打印**：导出 Markdown 时 diagram 证据以 mermaid 代码块输出；打印时若 CDN 尚未加载完成会退化为源码文本（建议先翻阅过图表页再打印）。
