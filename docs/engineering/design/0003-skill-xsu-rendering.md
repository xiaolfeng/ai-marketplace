# XSU：报告与复盘的声明式内容及确定性 HTML 渲染设计

> 状态：draft · 日期：2026-11-06 · Scope：skill
> 适用：`plugins/html/skills/editorial-report`、`plugins/replay` 的 HTML 产出链路。
> 已确认：源文件统一使用 `.xsu`（xiaolfeng skill ui）；采用受限组件 DSL。原讨论中的 `.msr` 为笔误，不引入第二种用户文件格式。
> 本文是设计稿，不作为实施完成或协议冻结的证明；当前实现与校验记录见 [实施计划](../../plan/0001-skill-xsu-compiler.md)。
> 实施授权：用户于 2026-11-06 通过设计并要求开始开发；采用本稿的独立分发入库例外与离线/联网分级建议。协议冻结及全部能力验收仍以实现记录为准。

## 目标与边界

### 需要解决的问题

让 AI 负责事实、叙事与组件选择，让受版本管理的 `.mjs` 负责 HTML、CSS、SVG 几何与交互装配。长会话、上下文压缩、换模型后继续修改时，只修改 `.xsu` 的内容，不再让 AI 重新理解和拼写数千行模板。

视觉保真的对象是现有三套页面：报告特刊、自己看的步进笔记本、对外的翻页复盘。共享协议与通用校验，不强行把三者改成同一套 DOM 或同一种视觉。稳定模板能消除自由手写样式导致的漂移，但不能保证任意长度内容都不溢出，也不能保证不同操作系统的系统字体具有完全相同的像素结果。

### 现状与规划分流

| 范围          | 当前工作树现状与证据                                                                                                                                                                                                                | 本次设计的目标行为                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 报告正文      | [editorial-report/SKILL.md](../../../plugins/html/skills/editorial-report/SKILL.md) 要求大纲、文案、复制模板填槽；[template.html](../../../plugins/html/skills/editorial-report/references/template.html) 第 4705–4740 行是内容槽位 | AI 写 `report.xsu`，脚本填槽；不允许 AI 修改生成的 HTML                               |
| 报告组件      | [components/README.md](../../../plugins/html/skills/editorial-report/references/components/README.md) 按八类组织片段，包含布局、图表、指标与状态变体                                                                                | 建立组件注册表、属性契约、旧片段到组件的覆盖清单；不把“60 余类”直接当作 60 个独立 API |
| 报告合集      | [sync-nav.mjs](../../../plugins/html/skills/editorial-report/scripts/sync-nav.mjs) 注入 `#report-nav-data`；模板还包含 HTTP 下导航刷新                                                                                              | 新页面由编译器按同一协议写入快照；旧页面继续使用同步工具                              |
| 两套复盘 HTML | 两份 `SKILL.md` 已要求只替换 `#replay-data` JSON 与标题；两份模板已经有固定渲染器                                                                                                                                                   | AI 改用组件 DSL；编译器先降低为现有领域数据并装入原模板，不先重写浏览器渲染器         |
| 复盘领域模型  | [_shared/step-chain-schema.md](../../../plugins/replay/skills/_shared/step-chain-schema.md) 定义五要素、证据、终局、glossary 与 publication                                                                                         | 保留领域含义并增加机器校验，不将普通 Section 当作 ReplayStep 的替代品                 |
| 复盘 Markdown | `replay-md`、`replay-post-md` 直接按共同方法论写 Markdown                                                                                                                                                                           | 保持原技能入口与 Node 非必需特性；HTML 的 Markdown 导出由同一模型派生                 |
| 图表          | 报告模板第 5099 行与复盘模板按需加载 Pele 1.6.0 CDN；“单文件”不等于带图表时完全离线                                                                                                                                                 | 明确区分 offline / connected 能力，禁止静默联网与静默丢图                             |
| 构建与测试    | [package.json](../../../package.json) 仅有 Cursor 清单 build/check，test 指向 agent-studio；未有 XSU 工具链                                                                                                                         | 增加零运行时依赖 Node >=18 编译、分发检查与回归测试；现有任务保持有效                 |

### 涉及与不涉及

- 直接升级三个 HTML 技能：`editorial-report`、`replay-html`、`replay-post-html`。Replay 的共享契约与两份 Markdown 技能只同步必要的边界说明和链接。
- 不改变报告的事实核验、大纲确认、角色口吻规则，也不改变 Replay 的逆向收敛、因果咬合、读者识别和脱敏责任。
- 不要求 `replay-md`、`replay-post-md` 先生成 XSU 才能写 Markdown：用户只要文本时不应额外依赖 Node；未来若要统一入口，另行评估。
- 不升级 `architecture-diagram`、`excalidraw-diagram`，不自动迁移 `ms-html` 等其他插件；它们的视觉同源不构成本轮重写授权。
- 不实现通用 Web App 框架、富文本编辑器、在线服务、任意 JavaScript 执行、任意 CSS 注入或插件式第三方代码加载。
- 不把任意旧 HTML 逆向恢复成 XSU：旧 HTML 未必保有可恢复的语义。只为已知旧 Replay JSON 提供显式迁移入口。

### 建议的核心约束

| AI 可以决定                                         | AI 不再决定                                              |
| --------------------------------------------------- | -------------------------------------------------------- |
| 标题、正文、事实、证据、章节顺序、组件类型、显式 ID | HTML 标签与属性、CSS class、样式 token、脚本、事件处理器 |
| 白名单枚举：tone、status、layout variant、图表类型  | 任意颜色、任意像素位置、style、className、innerHTML      |
| 已支持的组件组合与受控分片文件                      | 修改渲染器、模板或浏览器运行时来适配单篇报告             |

## 工作方式

### 内容到页面的链路

```text
事实与材料 → outline.md / copy.md 或复盘因果模型
                           ↓ AI 编写
                   report.xsu / replay.xsu
                           ↓
             词法解析 → 语法树（带源位置）
                           ↓
             分片展开 → 组件/领域/引用校验
                           ↓
              规范化 DocumentModel（内存）
                    ↙              ↘
       editorial 槽位适配器       replay 领域适配器
               ↓                       ↓
       固定组件 HTML/SVG         兼容 #replay-data JSON
                    ↘              ↙
              固定模板 + 受控浏览器运行时
                           ↓
                  完整单文件 index.html
```

内部 AST 和 DocumentModel 是编译器实现细节，不要求用户保存 `.msr`，不暴露第二套手写协议。可通过诊断模式输出内存模型快照到私有调试文件，但它不是默认交付物。

### 职责与模块

| 模块                 | 输入 → 输出                     | 责任                                                           |
| -------------------- | ------------------------------- | -------------------------------------------------------------- |
| lexer / parser       | UTF-8 XSU → SyntaxNode          | 识别有限语法，保留 file/line/column/span；不求值               |
| resolver             | Include → 展开的节点树          | 本地分片、循环检测、沙箱根目录与读取上限                       |
| registry / validator | 节点树 → 已验证节点             | 调用签名、props、合法父子关系、preset 能力、ID 与引用          |
| normalize            | 已验证节点 → DocumentModel      | 补默认值、统一状态、生成目录、派生页序；不改写事实             |
| editorial adapter    | DocumentModel → HTML 槽位       | 使用固定组件函数生成标签、表格移动端标签和 SVG 几何            |
| replay adapter       | DocumentModel → 兼容领域模型    | 组装已有 `meta/background/steps/endState/glossary/publication` |
| template / runtime   | 槽位或领域模型 → 页面           | 现有视觉、主题、目录、翻页、打印、导出；模板由维护者修改       |
| CLI / writer         | 输入与选项 → HTML / diagnostics | 确定性序列化、输出冲突检查、临时文件与原子替换                 |

首版优先保留 Replay 的浏览器渲染链路，而不是为了“都由 mjs 产 HTML”先改写整套翻页 UI。mjs 负责装配完整 HTML，浏览器执行受控的内嵌 JS 仍然合理。若以后需要无 JS 完整正文或 SEO，再单独设计预渲染，不混入这次保真迁移。

“保留渲染链路”不等于模板绝对零改动。编译入口需要显式注入受控运行时配置，并做少量带夹具的修改：网络模式开关、语义 hash 别名、存储/复制失败降级，以及 Self 图表证据分支。每项改动单独验证，既不让作者文件指定任意脚本，也不以整体重构掩盖行为变化。

### 三个预设

| preset          | 页面骨架                                                | 固定的关键能力                                                   |
| --------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `editorial`     | 刊头、封面、正文、附录、双侧栏                          | 纸白墨蓝、系统衬线标题、章节目录、合集导航、响应式表格、原有打印 |
| `replay-self`   | 开场 → 因果步骤 → 终点                                  | 暖纸笔记本、一屏一步、五要素、证据展开、词典气泡、底栏与数字键   |
| `replay-public` | 封面 → 背景 → 时间线 → 各阶段 → 决策 → FAQ → 现状与经验 | 正式复盘口吻、TL;DR、影响数据、章节定位、Markdown 导出、分页打印 |

预设固定壳层与默认组合，不是仅切换颜色。根 `preset` 决定合法根组件和结构；不允许通过改一个字符串把 Self 私人材料自动变为可发布稿。

### AI 工作流变更

报告仍先落盘 `outline.md` 与 `copy.md`；编排阶段把已确认的文案转成 XSU。后续正文修改以 XSU 为可编译事实源，大纲/文案作为前置审阅记录；若重新打开文案评审，必须同步 XSU 并重渲染，不建立双向自动同步的错觉。

Replay 仍先提炼因果链与终局，再写 XSU。AI 只需要读取技能流程、XSU 语法速查、当前预设的组件目录和示例，不必每次把数千行模板 CSS/JS 读入上下文。跨上下文继续时先运行 `validate`，阅读报错对应分片，再修改源文件。

建议报告产物为 `outline.md`、`copy.md`、`report.xsu`、可选 `sections/*.xsu` 与 `index.html`。Replay 为 `replay.xsu`、可选分片及 `index.html`。用户指定 HTML 位置时严格遵从，源文件放在同目录或用户指定的源码目录；不写进技能安装目录。

## 数据与接口

### 1. XSU v1 语法

XSU 借鉴 GenUI 的组件组合，不照搬宿主 Inline UI 的执行模型。它是描述文档的有限语言，不是把 JavaScript 改一个扩展名。

```ebnf
Document = Call, EOF ;
Value    = String | Number | Boolean | Null | Object | Array | Call ;
Call     = Identifier, "(", [Value, {",", Value}, [","]], ")" ;
Object   = "{", [Key, ":", Value, {",", Key, ":", Value}, [","]], "}" ;
Array    = "[", [Value, {",", Value}, [","]], "]" ;
Key      = Identifier | String ;
```

- 标识符限 ASCII 字母开头、后续字母数字下划线；组件名区分大小写。对象键同时可用 JSON 双引号形式。
- 普通字符串使用 JSON 双引号及转义；数值使用 JSON 有限数值语法，不接受 NaN、Infinity、十六进制和计算表达式。
- 增加三双引号原始多行字符串：起止 `"""` 必须各占一行，仅允许缩进空白；正文保留字节与缩进，不插值、不自动去缩进、不解码转义。正文若包含独立的结束分隔行，改用普通 JSON 字符串。换行统一为 LF，分隔行本身不进入正文。
- 字符串外支持 `//` 与 `/* ... */` 注释，允许尾逗号；一个文件只允许一个根调用，禁止多段脚本或分号语句。
- 不支持 `$state`、赋值、变量、函数、成员访问、import/export、模板插值、展开、条件表达式、循环、网络 Load、计算公式和用户事件回调。派生值由组件或脚本计算；AI 提交原始数值与单位。
- parser 只创建语法树；禁止 `eval`、`new Function`、`vm` 执行和动态 import 用户输入。对象使用无原型字典，拒绝重复键及 `__proto__`、`constructor`、`prototype`。
- 语法允许 Call 作为 Value，具体哪个字段接受节点由注册表限制。不能在数值属性里藏一个组件，也不能通过 props 自定义调用目标。

### 2. 报告示例

```text
Report({
  xsuVersion: 1,
  id: "weekly-2026-11-06",
  preset: "editorial",
  title: "本周交付与待办",
  date: "2026-11-06",
  theme: "system"
}, [
  Cover({ kicker: "工程周报", lead: "说明本周完成了什么，以及哪些事项仍在等待。" }),
  Section({ id: "delivery", title: "本周交付" }, [
    Metrics({}, [
      Metric({ label: "已完成", value: 12, unit: "项", tone: "good" }),
      Metric({ label: "待验证", value: 2, unit: "项", tone: "warn" })
    ]),
    Markdown("完成项与待验证项分开列示，不把计划写成事实。"),
    Chart({
      kind: "bar", labels: ["已完成", "待验证"],
      series: [{ name: "事项", values: [12, 2] }], unit: "项"
    })
  ]),
  Section({ id: "next", title: "接下来" }, [
    Callout({ tone: "warn", title: "尚未完成" }, [
      Markdown("两项回归仍待实际运行。")
    ])
  ])
])
```

本例数值只用于协议演示，不是本仓库的实际进展。`theme` 支持 `system/light/dark`，默认 system；手动选择与系统变化的优先级由固定运行时实现。

### 3. Replay 领域组件

Replay 根采用 `Replay(props, children)`。根 props 包含 `xsuVersion/id/preset/title/date`，可选 subtitle/repo/branch/sessionName/status；`preset` 仅可为 `replay-self` 或 `replay-public`。

```text
Replay({
  xsuVersion: 1, id: "order-check", preset: "replay-self",
  title: "库存预扣为什么需要补验证", date: "2026-11-06"
}, [
  Context({
    originGoal: "验证库存预扣行为",
    whyConfusing: "配置变更与运行结果来自不同版本",
    readingGuide: "沿着每一步的证据和因果关系往后看。"
  }),
  Actors({ items: [{ name: "订单服务", role: "业务仓", detail: "承担预扣逻辑" }] }),
  ReplayStep({ id: "check-config", title: "先核对配置", phase: "定位", summary: "确认运行时实际采用的配置", status: "completed" }, [
    LookAt({ target: "部署配置", anchors: ["deploy/config.yaml:12"] }),
    Why("先确认实际开关，避免只凭提交记录判断运行行为。"),
    Actions({ items: [{ type: "discovery", label: "发现配置差异", detail: "部署值与预期不一致。" }] }),
    Insight({ myth: "代码合入就代表线上开启", reality: "线上行为还取决于部署配置" }),
    Handoff({ next: "check-runtime", hook: "配置已确认，接着检查实际运行结果。" }),
    Evidence({ kind: "code", title: "实际开关", content: "FEATURE_ENABLED=false" })
  ]),
  Include("steps/02-check-runtime.xsu"),
  EndState({
    completedItems: [{ item: "确认配置", ref: "deploy/config.yaml:12", note: "已核对" }],
    pendingHandoffs: [{ task: "运行回归", owner: "维护者", when: "配置修正后" }]
  }),
  Glossary({ items: [{ term: "部署配置", plain: "服务启动时真正读取的那份设置。" }] })
])
```

这个片段用于说明写法，不是可以独立通过所有质量门禁的完整复盘；引用的后续分片必须存在，正式示例需给足因果步骤与词典。领域组件约束如下：

- 根下 `Context`、`Actors`、`EndState` 各恰好一份；`ReplayStep` 按源顺序组成线性主链，至少一个。现有 5–9 步、词典 6–12 项作为质量警告，不能靠强行补写事实满足数量。
- 每个 ReplayStep 恰好一个 `LookAt`、`Why`、`Actions`、`Insight`、`Handoff`；Evidence 可多份，长证据默认折叠。关键文本不得为空；status 保留 `completed/decision/blocked`。
- `Handoff.next` 必须等于紧接下一步的 ID；末步固定为 `end`。终点 ID 保留，不得被步骤使用。编译器将下一步 `LookAt.target` 派生为旧模型 `nextTarget`，不让 AI 重复抄两处名称。
- 结构引用只能证明“指到下一步”，不能证明 hook 的因果论证真实，仍需内容审阅。
- 步骤作者 ID 使用稳定字符串。兼容适配器按源顺序派生旧模型数字 `id`，同时建立稳定 ID 与旧 `#step-N` 的映射；现有数字锚点保留，新增语义锚点不改变旧链接行为。
- Self 必须有 Glossary；Public 必须有 Publication，禁止带 Glossary 或私人笔记块进入发布模型。模型中任何未使用或未知字段均报错，不通过隐藏字段保存“私稿”。
- `Publication` props 承接现有 kicker/headline/dek/authors/readingTime/tldr/impact/timeline/decisions/lessons/redactionNote。`timeline.stepRef` 在 XSU 中引用稳定步骤 ID，适配器转换为数字引用；`decisions.choice` 必须精确命中 options，options 至少两项；没有真实影响数字时 impact 允许为空。
- 公共版必须有非空的受众范围、署名确认与 `redactionNote` 记录，作为发布检查字段，不当作自动脱敏证明。脚本不能推断真实授权、识别全部人名或确认事实来源。
- `Questions({ items: [{ question, shortAnswer, deepExplanation }] })` 在根下恰好一份，可空数组，映射为旧模型 `confusionMatrix`，避免丢失高频追问与公共版 FAQ。`meta.distilledSteps` 从步骤数派生；`totalRawTurns` 允许作为根可选事实字段，不能由脚本捏造。
- Evidence 的 kind 固定为 `code/command/quote/table/diagram`；diagram.content 是 Mermaid 文本，必须经过同一联网能力检查，不能因它位于领域证据里绕过 Diagram 限制。
- 现有 Self 模板第 1697–1703 行仅对 quote 特判，diagram 会落成普通 pre；Public 模板第 1450–1453 行已经有 diagram 分支。两者能力并不对等。Self 增加受控 diagram 分支、复用已有 Pele 容器和失败提示，是本轮必要的功能补齐，不是仅靠 DSL 到 JSON 映射就能实现。分支完成且实际 SVG 夹具通过前，Self 必须拒绝 diagram，而不是返回编译成功；connected 的许可与安全门禁对两套预设同样有效。

### 4. 组件注册表与覆盖清单

每个注册项声明 `name/signatures/propsSchema/allowedParents/allowedChildren/presets/features/render/lowerToReplay/toMarkdown`。Schema 是受限的本地数据描述，由零依赖 validator 执行，不声称实现完整 JSON Schema 标准。文档与组件速查从同一注册表派生，避免 prose、校验器与渲染器出现三份字段定义。

v1 的通用布局与内容组件默认仅对 editorial 开放。Replay 根只接受上文领域组件；步骤内部只接受五要素和 Evidence，不接受任意 Section/Grid/Markdown 混入。这样才能确定地降低为现有 JSON 渲染器，禁止把无法消费的组件偷偷丢弃。若要在 Replay 中自由嵌入通用组件，须先扩展领域模型及两套浏览器渲染器，再通过覆盖与保真验收，不列为首版默认能力。

| 组件组      | 建议公开组件与主要字段                                                                                                                   | 对应旧片段或行为                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 根与布局    | Report、Replay、Section(id/title)、Row(variant)、Stack、Grid(columns)、Split(variant)、Details(title)                                    | 页面壳、block-head、split、details-collapse；columns 只接受白名单 1/2/3/4 |
| 刊头封面    | Cover(variant/kicker/lead)、Takeaway(title/text)、Glance(items)                                                                          | hero-banner、hero-metric、takeaway、glance；variant 不是任意 class        |
| 正文与引用  | Markdown(text)、Quote(text/source)、List(items/ordered)、Sources(items)、Code({ language }, text)                                            | bits、steps、quote、code-block；Markdown 只支持明确的子集                 |
| 指标与状态  | Metrics、Metric(label/value/unit/note/tone)、Progress(value/max/label)、Badge(text/status)、EvidenceLabel(kind)                          | stat-grid、meter、badges、labels；状态到旧 CSS class 由适配器映射         |
| 对比与决策  | Compare(items)、CompareTable(columns/rows)、Diff(before/after/language)、Scorecard(criteria/options)、Decision(options/choice/rationale) | compare-cards/table/diff、scorecard 与 Public decision                    |
| 数据与图表  | Table(columns/rows)、Chart(kind/labels/series/unit)、Sparkline(values)、Gauge(value/min/max)、Heatmap、Quadrant、Roadmap                 | 现有 charts 下原生 SVG 图表与 data-table；几何由数据计算                  |
| 流程与时间  | Timeline(items)、Flow(nodes/edges)、Tree(items)、Diagram(engine/source)                                                                  | timeline、system-map、file-tree、pele-diagram；Flow 不承诺任意图自动排版  |
| 人员与物料  | People(items)、Gallery(items)、Image(src/alt/caption)                                                                                    | personnel-grid、gallery-grid；资源读取走独立解析器                        |
| 附录与未决  | OpenQuestions(items)、Callout(tone/title)、Evidence(kind/title/content)                                                                  | open、callout、证据折叠与附录                                             |
| Replay 专用 | Context、Actors、ReplayStep、LookAt、Why、Actions、Insight、Handoff、EndState、Glossary、Questions、Publication                                     | 五要素、词典、终局和对外发布结构；不暴露 dock/drawer/topbar 等固定壳组件  |

这张表是 API 方向，不是已经逐个实现的组件目录。实施时必须建立 `component-coverage.json`，逐个登记现有片段及其状态变体对应哪个 XSU 组件、fixture 与截图基线。一个组件可覆盖多个变体，但不能用“已有 Metric”宣称 stat-grid 所有状态卡已兼容。未映射的旧组件不能静默删除；在覆盖未完成前保留旧技能版本作为可选路径，不宣称全量切换完成。

通用 tone 采用 `neutral/good/warn/bad/info`，任务 status 采用对应领域枚举，二者不能混用。各预设把语义枚举映射到已有 class 与 token。样式保真不要求三份模板的内部 class 名相同。

核心模块建议以纯函数为主：`parseXsu(source, file) → SyntaxNode`、`validateDocument(tree, registry, options) → diagnostics`、`normalizeDocument(tree, options) → DocumentModel`、`lowerReplay(model) → ReplayData`、`renderEditorial(model, assets) → slots`、`assembleHtml(preset, payload, assets) → html`。文件读取由 `resolveDocument(entry, policy)` 统一管理，写入仅由 CLI 调用 `writeHtmlAtomic(output, html, policy)`；纯渲染函数不直接访问文件系统或网络，便于同输入重复执行与单元测试。

### 5. 受控 Markdown、数据与图表

Markdown 首版只承诺段落、显式列表、加粗、斜体、行内代码与链接；表格、代码块、图片及图表优先使用专用组件。拒绝原始 HTML，不允许 Markdown 绕过组件安全规则。解析器按 token 渲染和上下文转义，不采用一串正则替换后直接作为任意 HTML 注入。脚注、嵌套列表和其他 CommonMark 扩展若未支持必须给诊断，不能假装完全兼容。

图表接收有限数值，不接受用户提供的 SVG path、坐标计算表达式或 style。统一处理：空数据提示、单点序列、全零、负值、同值区间、超长标签、缺值、百分比、非有限值与系列长度不一致。不能把负数裁成零后装作原始数据；不支持某种数据域时明确报错。表格列数与每行单元格数量必须一致，移动端 `data-label` 自动派生。

Scorecard 接受权重与原始评分，脚本按文档化公式计算总分；禁止同时接受一个未核对的“AI 手算总分”。所有组件若有自动舍入，导出模型保留原始值，显示精度是固定选项。

### 6. 分片与跨上下文续写

首版可先完成单文件解析，再加入 `Include("sections/01-summary.xsu")`。分片文件根为 `Fragment([节点...])`，不带第二份文档元信息；Include 仅能出现在允许节点序列的位置，展开后使用同一父子校验规则。文件中不能执行命令、设置主题或覆写根版本。

解析路径相对引用文件；最终 `realpath` 必须位于入口文档目录沙箱内。拒绝绝对路径、URL、越界 `..`、目录、符号链接逃逸与循环引用。允许沙箱内正常相对引用，不以禁止所有 `..` 替代真实边界检查。同一分片重复展开按每次计入节点额度，重复 ID 报错。

建议默认限制：入口及所有实际读取文本/资源总计 20 MiB；单 XSU 文件 2 MiB；Include 最深 8 层、最多 100 个不同分片；语法树深度 64、展开后节点 10,000；单图表数据点 5,000；生成 HTML 25 MiB。具体阈值在真实样本测试后调整，超过即报错，不截断内容。这些是设计初值，不是已测量的容量承诺。

### 7. CLI

以下命令均为拟新增接口，目前不能直接运行：

```bash
node <skill-dir>/scripts/xsu.mjs validate report.xsu
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --check
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --force
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --nav ../report-nav.json
node <skill-dir>/scripts/xsu.mjs components --preset editorial
node <skill-dir>/scripts/xsu.mjs validate report.xsu --diagnostics-json diagnostics.json
node <skill-dir>/scripts/xsu.mjs migrate-replay legacy-replay.json --out replay.xsu
```

- 三个技能内均提供 `scripts/xsu.mjs`，只包含本技能预设；不依赖仓库 cwd、根 node_modules 或其他插件。命令从任何目录运行都以参数路径定位文档。
- `validate` 解析、展开、读取资源并校验语义，不写 HTML。`components` 输出当前注册表速查。`migrate-replay` 仅接收显式提供的合法旧 JSON，不执行或扫描任意旧 HTML 脚本；迁移输出仍需重新审阅。
- `render --check` 在内存重编译，与指定输出逐字节比较，缺失或不一致退出 4；不更新导航、不写 HTML。Node 版本、编译器版本、模板版本相同、所有输入相同才要求字节一致；不注入当前时间、随机 ID、绝对路径或机器信息。
- 默认拒绝覆盖非 XSU 生成文件；带生成标记的目标在其 preset/documentId 匹配时可重建。`--force` 只放开人工文件覆盖，不跳过校验或安全规则。输出不得覆盖任何输入、Include、导航或图片文件；`--force` 也不得绕过这一规则。
- 退出码：0 成功；1 CLI 用法或 I/O 失败；2 语法/组件/领域/资源错误；3 运行时或模板内部错误；4 漂移检查失败。警告默认不改变退出码，可用 `--warnings-as-errors` 提升。
- 诊断使用 `{code,severity,message,file,line,column,endLine,endColumn,nodeId,related,hint}`；JSON 诊断可被宿主展示。错误精确定位作者 XSU，而不是要求 AI 去修生成 HTML。
- 主 HTML 使用同目录独占临时文件写入，完成后原子 rename；失败清理临时文件且保留旧输出。默认不跟随目标符号链接；避免覆盖沙箱外文件。首版是单写进程模型，同目标并发构建拒绝或通过独占锁串行，不宣称多文件事务。

### 8. 版本与可复现信息

- `xsuVersion: 1` 表达语法/内容协议主版本；新增可选字段可兼容升级，删除字段或改变语义必须升主版本。不支持的版本直接拒绝，不能自动猜测降级。
- 渲染器版本、模板版本、组件目录版本分别记录在受控 bundle 元信息中。生成 HTML 标记只保留不敏感的版本、preset、documentId 与输入内容摘要，必要时启用私有 build manifest 记录诊断。
- 规范化模型稳定序列化，数组保留作者顺序、对象键按约定排序，派生 ID 使用文档 ID、组件 ID 与稳定顺序，CSS/JS 来自固定资源。
- 同一主版本不等于永久相同视觉：模板有意升级会改变输出。精确重建须保留当时的技能发布版本；不允许运行时自动下载“最新皮肤”。

### 9. 源码与独立安装分发

建议开发源放在根 `scripts/xsu/`：共享 parser/resolver/validator/escape、注册表协议、打包器和测试。三个 preset 的适配器保持独立，模板继续以对应技能的现有 `references/template.html` 作为迁移期唯一视觉源，不再复制一份供人工双写。

仓库构建把核心、本技能适配器、模板与可信组件资源装成技能目录里的独立 `scripts/xsu.mjs`。这个 bundle 是分发副本，禁止手改；`build --check` 检查它与开发源一致。不要求用户安装一个新的 XSU 插件，不使用跨插件软链接，不在安装后临时寻找仓库根目录。

这里有一条需要明确批准的仓库约束变更：根 `INITDEEP.md` 当前说 `dist/cursor/` 是唯一入库生成物。技能内分发 bundle 必须作为有范围的例外写入项目约束，再实施，不得在本轮设计中偷偷扩大生成物惯例。若不接受该例外，备选是每个技能持有完整手写本地核心；代价是解析器和修复多处同步。

独立技能安装还可能丢失现有 `../_shared/` 方法论文档。因此分发不仅检查 JS：Replay 技能的必要方法论与领域契约应从唯一维护源生成技能本地只读参考副本，技能运行时链接改为本地路径。源仍在 `plugins/replay/skills/_shared/`；生成副本同样受上述例外与漂移检查约束。不能以“HTML 已经单文件”替代“技能本身能独立安装”。

开发依赖与运行依赖分开：使用者渲染只需 Node >=18 内置模块；不添加运行时 npm 包。浏览器截图工具若采用开发依赖，需在实施设计中明确锁定版本与 CI 安装方式，不得在交付时依赖 npx 临时下载。

## 异常与兼容

### 1. 样式与安全边界

所有文本按 HTML 文本、属性、URL、JSON script、Markdown、SVG 标签分别编码。内嵌 JSON 使用稳定 JSON 序列化后将 `<` 编码为 `\u003c`，并处理 U+2028/U+2029；不能仅替换字面 `</script>`。用户文本不得进入可执行脚本字符串或 CSS。

URL 先解析协议与目标类型，再编码属性。普通外链仅允许 https/http、明确的 mailto 与合法内部锚点；拒绝 javascript、file、未知协议及控制字符。相对报告链接须经过导航上下文校验。页面外链使用安全 rel，不开放用户传入事件属性。

Image 首版只读取沙箱内 PNG/JPEG/WebP/GIF，核对文件头与大小后转 data URI，必须有 alt；不允许外链热加载、任意 data URI 或作者 SVG。内联 SVG 仅由可信的图表/图标渲染器生成。若以后支持 SVG 导入，需要单独引入白名单解析与隔离方案，不能假装简单删除 script 即可安全。

禁止 RawHTML、RawCSS 和 RawJS 逃生口。不支持的视觉需求先报“缺少组件能力”，再由维护者补组件及测试，而不是给单篇内容加一段 style。Schema 校验与转义能约束输入面，但不能防范已被篡改的渲染器、所有浏览器缺陷或编译时文件被恶意并发替换；不把 CLI 当作隔离恶意本地进程的安全沙箱。

### 2. 离线、Pele 与导航联网

建议默认 `--network offline`，仅允许内联可信运行时、系统字体、内嵌资源和本地导航快照，不发起 fetch/CDN 请求。现有模板的导航 HTTP 刷新也须在此模式关闭。基础图表使用已有视觉语言的原生 SVG 组件。

保留显式 `--network connected` 兼容 Pele/Mermaid：只在文档实际需要时加载锁定的 Pele 1.6.0，输出声明其联网需求；失败展示可阅读的源文本和失败状态，不伪造成功。该模式不宣称完全离线。远程图表代码在页面具有执行权限，版本锁定不等于完整供应链保证；实施前须补齐来源、许可与可验证完整性策略，并在隔离夹具验证 Pele 对危险链接/HTML标签的限制。

默认 offline 遇到仅由 Pele 支持的 `Diagram` 或 Mermaid gantt，必须报 `XSU_NETWORK_REQUIRED`，不能生成丢图页面。离线路线图优先用 Roadmap 原生 SVG；对任意 Mermaid 不承诺零依赖等价重写。若要求“所有 Mermaid 均离线”，需批准引入锁定的随包渲染依赖或构建期转换；这会改变当前零第三方运行依赖边界，属于实现前的阻塞决策，不在设计里无声承诺。

合集导航继续以 `report-nav.json` 为唯一编辑源，保留现有 `#report-nav-data` 槽位和相对 `data-src`。新 XSU 报告通过 `--nav` 编译快照；重复执行 `--check` 读取同一导航输入。兼容同步工具仅用于旧报告；对带 XSU 生成标记的页面，应提示重渲染而不是直接修改生成页，避免两套写入器相互覆盖。

编译新成员时不能沿用旧同步工具“所有 HTML 已存在”的前置校验：当前待生成目标允许尚不存在，其他成员按合集检查报告；整组合成采用先校验源和导航关系、再逐页渲染、最后合集校验的流程。多页构建中途失败不宣称原子成功，不覆盖报告成功清单；需要重跑并验收各页。

### 3. 内容错误和发布检查

| 场景                                          | 行为                                                               |
| --------------------------------------------- | ------------------------------------------------------------------ |
| 拼错组件/属性/枚举、未知参数                  | 编译失败，报告位置和受支持选项，不静默忽略                         |
| 非法父子嵌套、缺五要素、ID 重复、Handoff 断链 | 编译失败，关联到冲突节点与引用位置                                 |
| 证据文件缺失、资源越界、图片类型不符          | 编译失败，不从网络补材料                                           |
| 文本长、词典数偏少、步骤数超建议              | 警告并定位；实际浏览器验收决定能否交付，不截断正文                 |
| Public 没受众/署名确认/脱敏记录               | 编译失败；有记录仍需人工复核内容与确认授权                         |
| 疑似密钥、内部域名、Self 口吻                 | 针对明确模式给发布诊断；不可宣称能自动识别所有泄露                 |
| 本地存储不可用                                | 主题、阅读进度持久化降级为内存态，不阻断翻页与阅读                 |
| Clipboard API 不可用                          | 提供可选中文本复制的降级路径，不宣称复制成功                       |
| 无 JS 或运行时异常                            | 保留明确说明；首版 Replay 仍依赖 JS 生成正文，不承诺无 JS 完整阅读 |
| 编译或模板内部异常                            | 不覆盖已有 HTML，输出内部错误与版本信息；不建议 AI 现场 patch 模板 |

Public 的发布检查必须覆盖整个待分发 HTML：可见文本、隐藏 JSON、折叠证据、链接、alt/caption 和图片元数据风险。只嵌入发布所需的规范化模型，不把作者 AST、注释、原始分片、诊断路径或私人调试数据一并塞入 HTML。编译成功不等于可以公开发布，脚本也不替用户发送。

### 4. 兼容与修改入口

- 已交付的旧 HTML 保持可用，不批量回写。没有 XSU 的旧文档仍按旧版方式查看；迁移优先使用已有结构化 Replay JSON。
- 现有模板先冻结 token、圆角、字体栈、布局、二次元点缀和交互行为，用夹具记录。组件接入只改变内容生产者，不同时做视觉重设计。
- Replay 同时保留旧数字 hash 与新稳定 ID 映射；词典匹配不得进入 code、链接属性或脚本；最长词优先，重叠词与中文标点需要回归。
- 主题初始化与持久化要兼容 file://、无 localStorage、系统主题变化与手动覆盖；不能只测 HTTP 服务器环境。
- 源数据变化后重新运行 render；禁止让 AI 修改 HTML 后再从 HTML 反向同步内容。若生成文件出现人工改动，`--check` 应揭示漂移。
- 发布三个 HTML 技能时同步各自 SKILL、references、examples、evals、技能内版本、两个插件 manifest、marketplace 条目、根 README 与对应 INITDEEP，随后重导 Cursor；本轮只写设计，不提前变更版本或清单。

## 备选与取舍

| 方案                           | 优点                                             | 本稿选择或暂不采用的原因                                                   |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------- |
| 受限组件 DSL                   | 接近 GenUI，便于 AI 编排，文本比 JSON 组件树紧凑 | 用户已选择；代价是要维护明确且很小的 parser 与错误定位                     |
| 严格 JSON 组件树               | 可以直接 JSON.parse，Schema 与编辑工具成熟       | 是合理备选；本轮不同时开放双入口，避免协议和示例成本翻倍                   |
| 完整 JSX/JavaScript            | 生态成熟，表达式、复用和条件渲染直接可用         | 当前要锁定内容与模板职责，且零运行时依赖；任意求值与转译链不符合这个边界   |
| YAML 或 Markdown 指令块        | 长正文书写自然，现有生态支持丰富                 | 零依赖下正确解析 YAML 并不简单；复杂嵌套组件也需要第二套属性约定，暂不引入 |
| 保留 Replay JSON，完全不做 DSL | 改造小，复用现有模板即可稳定外观                 | 底层继续复用；但不能满足统一 XSU 作者体验与跨预设组件编排需求              |
| 三套页面重写成统一渲染框架     | 后续共用布局与组件可能更容易                     | 一次同时换内容协议、DOM 和视觉基础会削弱保真可验证性；先适配现有壳         |
| 仅靠更严格提示词禁止 AI 改 CSS | 无工具链维护成本                                 | 仍然要求每次复制并手工填大模板，缺少结构校验、可复现与漂移检查             |
| 单独发布共享 XSU runtime 插件  | 安装包重复少、统一更新方便                       | 技能可能独立安装，跨插件路径和版本依赖不可靠；采用开发源共享、交付自包含   |
| 第一版就统一四个 Replay 技能   | HTML/MD 可以统一从同源导出                       | 纯 Markdown 用例因此额外依赖 Node 和组件协议；先保留原入口                 |

重新评估条件：若新需求必须有变量、条件、循环和自定义函数，停止扩展“小型 JS”，重新比较标准 JSON AST 加模板或成熟语言工具链；若 parser 连续两个发布周期成为主要缺陷来源，评估转向 JSON 作者层。若三个适配器的重复逻辑超过可清晰维护的范围，再以截图和交互基线为前提讨论统一渲染；不能为了代码整齐先牺牲原样式。若独立技能 bundle 或内嵌资源持续超出容量预算，评估版本化资源包，但不得静默改成联网下载。

## 验证

### 本轮设计文档检查

本轮只核对真实入口、链接、编号和设计一致性；没有编译器可运行，因此不能声称 HTML 保真、DSL 解析、安全边界或离线行为已经验证通过。现有 `npm run check` 只能验证 Cursor 导出物，没有覆盖 XSU。

### 实施必须具备的测试

| 层           | 用例与通过标准                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 语法         | JSON 转义、多行原始串、中文、注释、尾逗号、EOF、无效 token、重复键、危险键与深度上限；不支持的 JS 语法必须拒绝             |
| 组件与领域   | 所有签名、默认值、未知字段、非法嵌套、空值、Replay 五要素、连续链、末步 end、Public 选项命中和 timeline 引用               |
| 文件边界     | Include 成环/超深、软链接逃逸、资源额度、文件缺失、输出覆盖输入、同目标并发、写入失败保留原文件                            |
| 序列化与输出 | 两次 render 字节相同，--check 能发现手改与导航更新，JSON 中恶意闭合标签不逃逸，敏感调试信息不进入交付页                    |
| 图表和数据   | 空/零/负数/单点/同值/超长标签/缺值/溢出/单位/系列不齐；SVG 坐标有限，表格移动端标签正确                                    |
| 组件覆盖     | 逐条消费 component-coverage 清单，包含旧片段所有已登记状态与变体；未覆盖项阻止宣称全量迁移                                 |
| 视觉         | 同一固定内容在旧壳与新输出对比；三个 preset × 浅/深 × 桌面/390px，保留模板 token、圆角、侧栏、打印和点缀                   |
| 浏览器       | file:// 与 HTTP、键盘焦点、左右键/数字键、抽屉、词典、证据展开、hash、Markdown 导出、复制降级、系统主题与存储失败          |
| 离线与发布   | 浏览器阻断网络后基础页面完整可读；offline 不发请求，Pele 在 offline 明确失败；Self/Public 的 connected 图表都实际生成 SVG，加载失败时有源文与错误状态；Public 全 HTML 检查，不仅看可见页            |
| 独立安装     | 将单个技能目录复制到仓库外临时目录，从其他 cwd 执行；无根 node_modules、无兄弟插件、无网络仍可渲染基础文档；必读引用均存在 |
| 内容质量     | 多轮修改与压缩上下文续写只改 XSU；不编事实、未完成项仍可见、步骤因果合理；不能用机器校验替代内容评价                       |

视觉基线应先对旧模板填入固定事实，而不是把含占位符的全量 example 直接当作最终报告。固定浏览器、系统字体、视口、动画和时间相关内容后才可比较像素；首次差异阈值由基线实验确定，不捏造“100% 像素一致”。接受新旧差异必须逐项说明来源并由人确认，不能每次失败就自动刷新基线。

拟新增的自动化命令：

```bash
node --test scripts/xsu/tests/*.test.mjs
node scripts/xsu/build.mjs --check
node scripts/xsu/check-component-coverage.mjs
node scripts/xsu/check-isolated-install.mjs
```

这些脚本尚不存在，名称是实施接口建议。浏览器测试单独提供固定环境的运行说明；没有浏览器驱动时标记待验证，不能以快照字符串通过替代实际页面验收。最终合入前仍运行仓库要求的 `claude plugin validate .`、`npx skills add . --list`、`npm run build`、`npm run check`，并保留 `dist/cursor/` 导出物。

### 切换门槛

先保存三套旧壳的代表性内容与交互基线，再做最小 DSL、报告适配与 Replay 领域适配；最后覆盖全部既有组件变体并修改技能默认工作流。这是设计依赖顺序，不是已经承诺的实施排期，正式任务拆解另落 `docs/plan/`。

只有组件覆盖、三预设视觉交互、独立安装和安全/离线契约都通过后，才把三个技能默认写法切成 XSU。回退为安装上一发布版本并保留新源码，不在编译失败时自动回退到 AI 手写 HTML。

## 待确认

已确认的文件扩展名和作者语法不再作为开放问题。其余为本稿建议，未获得整体批准：

- **阻塞完整实现**：是否接受“开发源共享、三个技能内生成自包含 bundle 与必要参考副本”的入库例外；拒绝则需改用技能内手写核心并承担同步成本。
- **阻塞涉及 Mermaid 的交付**：是否接受“默认 offline、显式 connected 保留 Pele”的分级；若要求全部图表完全离线，必须另行决定第三方随包依赖/构建转换边界与许可、完整性和安全策略。
- **不阻塞最小核心**：多行字符串与 Include 的具体体验、数值/资源预算初值、Public 发布检查字段的最终命名，可在首个原型验证后收敛；不得在未支持时给出可运行承诺。
- **发布前阻塞**：完整组件 props 清单、coverage 映射与浏览器基线阈值必须形成可执行材料；本文目录不能替代逐组件契约与实际结果。

确认方案后，将稳定的跨技能 XSU 协议抽入独立 `spec`，实施阶段与回退步骤落入 `docs/plan/`；本设计保持 draft，未经人工决定不升级 ADR。
