---
name: replay-html
description: >
  交互式 HTML 步进复盘页面生成（/replay-html）。当用户说「生成 HTML 复盘」「做个可视化复盘页面」
  「可以点下一步一步步走的复盘」「把这段复杂对话做成交互式走读网页」「replay-html」，
  或需要将 AI 猛猛执行的长对话、跨仓改动、复杂演练逆向拆解为带「上一步/下一步」闯关交互的可视化网页时使用。
  产出单文件离线可运行的 HTML 页面，具备因果链路全景轨道、左侧步进导航、中央五要素闯关舞台（看哪里→为什么看→做了什么→认知破雾→引申到哪）、右侧原始证据抽屉与深浅双主题。
  若用户只需静态 Markdown 走读文档，转交 replay-md；纯系统架构拓扑图走 architecture-diagram。
---

# Replay HTML —— 交互式步进闯关复盘生成器

当面对几千行 AI 操作记录、十几个跨仓 PR/Issue 和曲折的排障过程，静态长文仍然容易让人视线失焦时，本技能将逆向拆解出的因果链路渲染为一个**可一步一步点击推进的单文件交互式 HTML 闯关页面**。

读者每次只聚焦当前一步的「先看什么 → 为什么要看这里 → 做了什么 → 认知破雾 → 引申到下一步」，通过点击 **「下一步 →」**（或按键盘方向键 `←` / `→`）沿着因果绳索顺畅走完全程。

与 [replay-md](../replay-md/SKILL.md) 的分工：
两者共用 [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md) 的逆向拆解法与 [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md) 的五要素数据模型；`replay-md` 输出静态 Markdown 文档，本技能输出**单文件交互式 HTML 页面**。

## 资源地图

| 资源                                       | 位置                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| 逆向拆解与四类噪音折叠方法论               | [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md)     |
| 步进五要素与 `#replay-data` JSON 数据契约  | [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md)         |
| 交互式步进页面视觉、三栏联动与状态机规范   | [references/html-interaction-spec.md](references/html-interaction-spec.md) |
| 单文件 HTML 起手模板（数据驱动壳层）       | [references/template.html](references/template.html)                       |
| 完整实战示例（网关生命周期演练对话复盘页） | [examples/example.html](examples/example.html)                             |

## 铁律

1. **先逆向收敛，再填数据。** 严禁把原始会话行号直接塞进网页做成聊天记录回放器！必须先按 [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md) 从终局倒推，折叠试错噪音，提炼为 **5–9 个因果咬合的关卡（Step）**。
2. **单一事实源驱动（`#replay-data`）。** 页面所有内容由内嵌的 `<script type="application/json" id="replay-data">` 驱动渲染；基于 [references/template.html](references/template.html) 构建时，只需替换该 JSON 数据块与页面 `<title>`，严禁破坏步进状态机与键盘交互逻辑。
3. **步步咬合可视化。** 当前 Step 底部的「🔗 从这里引申到哪里（Next Trigger）」卡片必须内置**「点击进入下一步：`<下一关锚点>` →」**交互按钮，让读者直观感受到「因为这一步发现了 X，所以不得不点进下一步看 Y」。
4. **单文件零依赖、外硬内柔双主题。** 交付的 `.html` 必须双击即可在任意现代浏览器离线打开，不依赖本地服务器或外部 JSON；外层框架与顶栏遵循工业级硬朗边框，内部步进卡与因果节点保持清晰层次，原生支持深色/浅色主题一键切换。

## 执行步骤

### 1. 逆向拆解与结构化建模

1. 读取目标会话记录、Git 历史或上下文材料，盘点**终局账单**与**初始起因**；
2. 逆向推导因果链，识别用户在原过程中的**追问点、撤回点（Revert）与高频混淆概念对**；
3. 按照 [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md) 组织完整的 JSON 数据对象（包含 `meta`、`background`、`actorsAndRepos`、`steps`、`confusionMatrix`、`endState`）。

### 2. 注入单文件交互壳层

1. 复制 [references/template.html](references/template.html) 作为基础壳层；
2. 将构建好的 JSON 数据写入 `<script type="application/json" id="replay-data">...</script>`（注意转义代码块或字符串中的 `</script>` 为 `<\/script>`）；
3. 核对三视图切换是否完整可用：
   - **🎮 步进闯关模式（默认主视图）**：顶部因果轨道 + 左侧关卡列表 + 中央五要素聚焦舞台 + 右侧原始证据与灵魂破雾抽屉；
   - **🗺️ 全景因果链模式**：一屏纵览所有关卡的「看哪里 → 做了什么 → 引申钩子」与四仓/环境角色矩阵；
   - **📋 终局账单与破雾表模式**：集中展示「高频混淆概念破雾问答卡」「已落袋成果」与「下一步接力表」。

### 3. 交付检查

- [ ] 双击 HTML 是否能直接渲染出第 1 步，无控制台 JSON 解析报错？
- [ ] 点击顶栏/底栏「上一步 / 下一步」、点击「引申到下一步」横幅、按键盘 `←` / `→` 键，是否都能丝滑切换关卡并同步高亮顶部轨道与左侧导航？
- [ ] 每个 Step 的五要素（📍第一步看什么、💡为什么要看这里、🛠️发现了什么&做了什么、⚡认知破雾、🔗从这里引申到哪里）是否全部非空且首尾咬合？
- [ ] 深色模式与浅色模式切换是否正常，移动端/窄屏下是否自动收敛为单列可操作布局？
