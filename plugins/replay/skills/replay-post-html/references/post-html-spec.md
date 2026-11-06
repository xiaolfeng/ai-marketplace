# 对外发布的翻页复盘报告规范（Post HTML Spec）

本规范定义 replay-post-html 的页面结构、视觉与交互验收目标。默认作者入口为 [XSU](xsu.md) 与 [构建示例](../examples/example.xsu)，AI 不必全文读取模板，禁止手改生成 HTML/CSS/JS。下文 publication/#replay-data 是编译器降低后的内部模型，不是手工注入入口。[Self 兄弟规范](../../replay-html/references/html-interaction-spec.md)仅用于可选比较，不是独立安装必读依赖。

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
| 3 | `#timeline` | 时间线 | Publication.timeline；XSU 的每项 stepRef 引用稳定步骤 ID，编译器转换为旧数字定位；未关联步骤的计划不要伪造引用 | 无数据时不生成此页 |
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

## 五、领域组件与旧组件目录

默认内容入口是 Replay(preset: "replay-public")：Context、Actors、ReplayStep、五要素、Evidence、EndState、Questions、Publication。Publication 保留摘要、真实影响、时间线、带备选方案的决策、经验与脱敏记录；必须确认 audience、authors 和 authorsConfirmed，不能只把 self 的 preset 改名，不允许 Glossary 或私人笔记隐藏字段混入。

具体签名查 [XSU](xsu.md) 与 components --preset replay-public。不混排 editorial 的 Section/Grid/Markdown 等通用组件。主题用根 props theme: system/light/dark，默认 system。

[template.html](template.html) 是维护者管理的固定视觉；[components/README.md](components/README.md) 和 [旧 example.html](../examples/example.html) 保留为 catalog，不是每篇正文。缺少组件能力应报告，不手取 HTML 片段或加 CSS/JS 定制生成页。发布前仍须独立核验事实、受众与脱敏，结构校验不代表获得授权。

## 六、Pele 图表与网络模式

- 默认 --network offline，不引用外部字体、脚本、JSON，不自动联网。编译使用 Node >=18 且零第三方 npm 运行依赖，浏览器阅读无需 Node。
- 图表通过 Evidence({kind: "diagram", title, content: "Mermaid 源码"}) 表达；需要显式 --network connected，否则报 XSU_NETWORK_REQUIRED，不静默联网或丢图。
- connected 仅实际用图时按需加载锁定的远程 Pele 1.6.0（obsidianmd/pele，MIT），容器、--pele-* 主题绑定与源码展示由渲染器提供，不手拼 DOM。
- 不承诺完整 Mermaid 12.1.0 支持，拒绝 HTML、交互链接与初始化指令等能力。远程脚本有页面执行权限，版本锁定不是供应链安全证明；该模式不宣称全离线。
- 解析或加载失败保留源码和失败状态。Markdown 导出保留 mermaid 代码块；打印前应确认图表已实际渲染，失败回退源码不等于图表验收通过。未执行的截图、安全、交互或覆盖检查标为待验证。
