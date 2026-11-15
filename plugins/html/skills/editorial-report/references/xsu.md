# XSU v1 · editorial 写作参考（v2 视觉与扩展组件）

本页是可维护的作者指南，精确字段、枚举与父子限制以本技能 `node <skill-dir>/scripts/xsu.mjs components --preset editorial` 输出为准。

## 受限语法

XSU v1 是受限声明式数据语言，不是可执行 JavaScript。每文件一个根调用 `Report(props, children)`，组件名区分大小写，常见签名为 `Component(props, children)`、`Component(props)`、`Component(props, text)` 或 `Component(text)`。

- 值仅允许 JSON 双引号字符串、有限数值、布尔、`null`、数组、对象和已注册组件调用；对象键可写 ASCII 标识符或双引号字符串。
- 字符串外允许 `//`、`/* ... */` 注释与尾逗号。原始多行字符串以三双引号 `"""` 起止，分隔符各占独立一行；正文不插值、不解码转义、不自动去缩进。普通字符串沿用 JSON 转义。
- 不允许变量、赋值、函数、条件、循环、成员访问、展开、模板插值、`import`/`export`、事件回调或计算表达式；提交原始事实数据，百分比与布局位置由编译器计算。
- 禁止重复键与原型污染键（`__proto__`、`constructor`、`prototype`）。除受安全清洗器保护的 `CustomHtml` 外，普通文本与 Markdown 字段不接受原始 HTML。
- 根组件 `Report` 必填 `xsuVersion: 1`、稳定 `id`、`preset: "editorial"`、`title`、事实日期 `date`（`YYYY-MM-DD`）；可选 `theme: "system" | "light" | "dark"`（默认 `"system"`）与主色 `accent: "teal" | "slate" | "indigo"`（默认 `"teal"`），以及 `brand`、`subtitle`、`author`、`footer`。
- 分片写 `Fragment([组件...])`，主文件用 `Include("sections/01.xsu")`。路径相对引用它的 XSU，真实路径必须留在入口目录沙箱内，禁止 URL、绝对路径、符号链接逃逸和循环引用。

## 编译、诊断与输出保护

使用 **Node >=18**，零第三方 npm 运行依赖；生成 HTML 在浏览器直接打开即可阅读。技能内 `scripts/xsu.mjs`、`references/xsu-components.json` 与 `examples/example.xsu` 均由构建脚本从 `scripts/xsu/` 生成，禁止手改。

```bash
node <skill-dir>/scripts/xsu.mjs components --preset editorial
node <skill-dir>/scripts/xsu.mjs validate report.xsu --diagnostics-json diagnostics-new.json
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --check
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --warnings-as-errors
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --nav ../report-nav.json
```

- `validate/render --warnings-as-errors` 将长文本等质量警告提升为失败。
- `validate/render --diagnostics-json <new-file>` 输出结构化诊断 JSON，只创建新文件，不覆盖已有文件或输入源。
- `render --check` 在内存重编译并逐字节比对目标文件，漂移或缺失返回退出码 `4`，不改写磁盘。
- 默认拒绝覆盖无 `XSU_GENERATED` 归属标记的人工文件；显式替换需传 `--force`（不与 `--check` 同用）。

## CDN 增强、离线降级与联网图表

### 始终启用的 Tailwind v4 + Lucide 多级兜底 CDN

所有编译产出的报告页面内置非阻塞多级兜底脚本加载器，按顺序尝试（单源 `onerror` 或 `4500ms` 超时自动切换下一镜像，带 SHA-384 SRI 完整性校验）：

1. **首选国内源**：`https://registry.npmmirror.com/...`
2. **一级兜底**：`https://cdn.jsdelivr.net/npm/...`
3. **二级兜底**：`https://fastly.jsdelivr.net/npm/...`
4. **三级兜底**：`https://unpkg.com/...`

锁定版本为 `@tailwindcss/browser@4.3.5` 与 `lucide@1.72.0`。模板通过 `@layer theme, base, template, utilities` 仅引入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`（关闭 Preflight 全局重置），并把模板语义变量映射为 Tailwind 颜色令牌：`bg-accent`、`bg-accent-tint`、`text-accent`、`text-ink`、`text-muted`、`text-subtle`、`bg-bg`、`bg-paper`、`bg-surface`、`border-line`、`bg-success-bg`、`text-success`、`bg-warn-bg`、`text-warn`、`bg-danger-bg`、`text-danger` 均随深浅主题与 `accent` 主色实时响应。Lucide 在加载完成后于 `DOMContentLoaded` 自动调用 `lucide.createIcons()`。当处于完全离线环境或全部 CDN 被拦截时，版式与所有内置组件完全由内联 CSS 驱动，页面照常可读。

### Pele 图表联网门禁

`Diagram`（及 `Evidence({ kind: "diagram" })`）仍受 `--network` 门禁约束：默认 `--network offline` 下遇到 `Diagram` 报 `XSU_NETWORK_REQUIRED`；显式 `--network connected` 时按需加载锁定的 Pele `1.6.0` 脚本，失败时保留原始图表文本与可见告警。优先使用原生结构化组件 `Swimlane`、`CapacityFlow`、`QueueZones`、`Architecture`、`StateMachine`、`Flow`、`Roadmap` 与 `Chart`，它们无需 `--network connected` 即可离线精确渲染。

## editorial 组件总览

| 类别           | 组件                                                                                                                                                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 根与刊头       | `Report`（支持 `theme`、`accent`）、`Cover`、`Takeaway`、`Glance`                                                                                                                                                                                                                                         |
| 章节与布局容器 | `Section`、`FigureBox`、`Row`、`Stack`、`Grid`、`Split`、`Details`、`Callout`                                                                                                                                                                                                                             |
| v2 架构与治理  | `Swimlane`、`CapacityFlow`、`QueueZones`、`BudgetBars`、`Principles`、`ReviewProgress`、`KeyValueTable`、`CustomHtml`                                                                                                                                                                                     |
| 正文与证据     | `Markdown`、`Quote`、`List`、`Steps`、`Sources`、`Code`、`Evidence`、`FAQ`、`Glossary`、`Interview`、`Json`、`Terminal`                                                                                                                                                                                   |
| 指标与对比决策 | `Metrics`、`Metric`、`Progress`、`Badge`、`EvidenceLabel`、`Compare`、`CompareTable`、`Diff`、`Scorecard`、`Decision`、`ProsCons`、`DecisionLog`、`Takeaways`                                                                                                                                             |
| 图表与工程视图 | `Table`、`Chart`、`Sparkline`、`Gauge`、`Heatmap`、`Quadrant`、`Roadmap`、`Timeline`、`Flow`、`Tree`、`Diagram`、`Architecture`、`Sequence`、`ServiceMesh`、`VisualCompare`、`StateMachine`、`Kanban`、`ReleaseNotes`、`Incident`、`RootCause`、`People`、`Gallery`、`Image`、`OpenQuestions`、`Colophon` |

通用 `tone` 枚举为 `"neutral" | "good" | "warn" | "bad" | "info"`；v2 架构图示组件额外兼容 `"ink" | "accent" | "ok"` 语气简写。任务 `status` 枚举为 `"done" | "progress" | "warn" | "blocked" | "plan" | "info"`。支持行内富文本的字段可使用 `**加粗**`、`*斜体*`、`` `code` `` 与 `[文本](https://...)` 安全链接。

## v2 新增组件详解与示例

### 1. 主色切换（`Report.accent`）

根组件 `Report` 支持 `accent: "teal" | "slate" | "indigo"`，省略时默认 `"teal"`（青绿特刊色），深浅色均满足 WCAG AA（正文对比度 ≥ 4.5:1）。

```text
Report({
  xsuVersion: 1,
  preset: "editorial",
  id: "arch-weekly",
  title: "网关容量治理双周简报",
  date: "2026-11-06",
  theme: "system",
  accent: "teal",
  brand: "INFRA · 架构简报"
}, [
  Cover({ kicker: "双周进展", lead: "聚焦单点公平队列与耗时预算收敛。" }),
  Section({ id: "s1", number: "01 / 概览", title: "核心原则" }, [
    Markdown("正文段落。")
  ])
])
```

### 2. 图示容器（`FigureBox`）

统一承载顶栏胶囊标签（`tag`）、右侧辅助说明（`meta`）、内嵌图示子组件与底部图注（`caption`）。

```text
FigureBox({
  tag: "TOPOLOGY / 四层削峰路径",
  meta: "青色 = 准入 · 绿色 = 持久缓冲",
  caption: "突发流量统一收敛至持久调度队列，避免下游配额被打穿。"
}, [
  Principles({
    items: [
      { title: "单一排队点", detail: "上下游只做持久受理与回执。" },
      { title: "引用传递", detail: "控制面不流转大体积原始载荷。" },
      { title: "超时对账", detail: "未知状态进入后台对账而非盲目重发。" }
    ]
  })
])
```

### 3. 泳道时序图（`Swimlane`）

支持 2～8 个参与者（`actors`）、阶段分组框（`kind: "band"`）、正反向实虚线步骤箭头（`kind: "step"`，`from > to` 自动反向，`dashed: true` 虚线）、单列或跨列自注释（`kind: "note"`）与底部图例（`legend`）。`variant` 支持 `"default"`（卡片消息框）与 `"compact"`（紧凑无框消息），窄屏自动展示横向滑动提示。传 `title` / `meta` / `caption` 时自动包裹 `pele-box` 外框。

```text
Swimlane({
  title: "SEQUENCE / 异步导出时序",
  meta: "实线 = 调用 · 虚线 = 回执",
  caption: "落库即回，不阻塞客户端连接。",
  variant: "default",
  actors: [
    { name: "客户端", subtitle: "发起请求" },
    { name: "调度网关", subtitle: "持久受理", tone: "accent" },
    { name: "对象存储", subtitle: "归档产物", tone: "ok" }
  ],
  rows: [
    { kind: "band", title: "阶段一 · 持久受理", subtitle: "毫秒级回执", tone: "accent" },
    { kind: "step", number: "1", from: 1, to: 2, text: "提交任务（带 `idempotency_key`）", detail: "仅传筛选快照", tone: "ink" },
    { kind: "step", number: "2", from: 2, to: 1, text: "返回受理编号", tone: "accent", dashed: true },
    { kind: "note", from: 2, text: "按租户配额公平排队", tone: "warn" },
    { kind: "step", number: "3", from: 2, to: 3, text: "流式上传归档包", tone: "ok" }
  ],
  legend: [
    { label: "同步调用", tone: "ink" },
    { label: "异步回执", tone: "accent", dashed: true }
  ]
})
```

### 4. 分层容量流（`CapacityFlow`）

展示 N 层处理容量、连接箭头（`arrows` 默认在 ≤5 列单行时自动开启，6 张卡自动切换 3 列网格）、超出策略胶囊（`pill` / `pills`，`kind` 支持 `"queue" | "reject" | "wait" | "admit" | "pass"`）以及可选旁路补充行 `secondary`（`card` + `note`）。

```text
CapacityFlow({
  title: "CAPACITY / 各层容量与超限反应",
  items: [
    { role: "INGRESS", title: "边缘网关", detail: "单实例 200 并发连接", tone: "accent", pill: { text: "超出：返回 Retry-After", kind: "admit" } },
    { role: "QUEUE", title: "持久队列", detail: "按租户公平轮询", tone: "ok", pill: { text: "超出：排队等待", kind: "wait" } },
    { role: "STORAGE", title: "外部归档", detail: "每分钟 120 次配额", tone: "bad", pill: { text: "超出：429 退避", kind: "reject" } }
  ],
  secondary: {
    card: { role: "AUDIT", title: "旁路对账", bullets: ["异步核对文件摘要", "扫描超时未决记录"], tone: "warn", pill: { text: "旁路异步消费", kind: "pass" } },
    note: "压测峰值下通过持久队列削峰，端到端成功率保持在 **99.94%**。"
  }
})
```

### 5. 双区状态机（`QueueZones`）

展示顶部状态流转胶囊链（`states`）、左区与右区卡片列表（`left` / `right`）、中间双向流转指示（`transfer`）与底部红线约束条（`rule`）。

```text
QueueZones({
  title: "STATE BOUNDARY / 等待区与执行区",
  states: [
    { label: "QUEUED", tone: "warn", event: "配额富余" },
    { label: "DISPATCHED", tone: "accent" },
    { label: "SUCCEEDED", tone: "ok", divider: "slash" },
    { label: "FAILED", tone: "bad" }
  ],
  left: {
    title: "等待区 · 尚未占用下游配额",
    subtitle: "支持随时取消",
    tone: "accent",
    cards: [{ step: "1", title: "幂等入队", items: ["校验唯一幂等键", "仅保存对象引用"] }]
  },
  transfer: { forward: "领取租约并派发", backward: "429 未受理退回" },
  right: {
    title: "执行区 · 每次外发独立审计",
    subtitle: "超时绝不盲目重发",
    tone: "ok",
    cards: [{ step: "2", title: "受控执行", items: ["记录尝试编号", "心跳续期租约"] }]
  },
  rule: { label: "设计红线", text: "网络断连或超时一律转入后台对账，严禁自动重试。" }
})
```

### 6. 预算条（`BudgetBars`）

多行分段比例预算条，编译器按每行各段 `share`（正数）自动归一化计算百分比宽度。

```text
BudgetBars({
  title: "LATENCY BUDGET / 端到端耗时预算",
  meta: "P99 ≤ 400ms",
  rows: [
    {
      label: "实时查询链路",
      segments: [
        { label: "鉴权 40ms", share: 40, tone: "accent" },
        { label: "聚合 260ms", share: 260, tone: "ok" },
        { label: "序列化 100ms", share: 100, tone: "warn" }
      ]
    }
  ],
  note: "聚合超过 260ms 时自动回退缓存快照。"
})
```

### 7. 编号原则卡（`Principles`）

自动编号卡片网格（`columns` 支持 `1 | 2 | 3`，默认 `3`，窄屏自动单列）。

```text
Principles({
  items: [
    { title: "全链路单一排队点", detail: "只在离配额最近的一层持有等待队列。" },
    { title: "未知状态绝不重发", detail: "超时请求统一进入后台对账单。" },
    { title: "大载荷走引用传递", detail: "控制面只流转短效只读签名地址。" }
  ]
})
```

### 8. 评审进度（`ReviewProgress`）

顶部统计卡（`stats` 可选；省略时按 `items` 自动汇总）+ 彩色比例进度条 + 双列结论卡片（含状态徽章与 `impact` 影响说明）。

```text
ReviewProgress({
  stats: [
    { label: "已达成共识", count: 5, status: "done" },
    { label: "待补充压测", count: 2, status: "warn" }
  ],
  items: [
    {
      title: "单点持久队列模型",
      status: "done",
      badgeText: "已达成共识",
      summary: "消除跨层重复排队与超时错配。",
      impactLabel: "对本方案",
      impact: "锁定任务表与尝试表结构。"
    }
  ]
})
```

### 9. 左键右文双栏表（`KeyValueTable`）

左列固定窄栏展示模块名、状态徽章组（`badges`）与归属说明（`owner`），右列分段展示带粗体前缀的「现状 / 目标 / 超出时」说明（`sections`）。

```text
KeyValueTable({
  title: "LAYER MATRIX / 模块职责对照",
  headers: ["模块 / 层级", "现状、目标与边界"],
  rows: [
    {
      key: "接入网关",
      badges: [{ text: "已就绪", status: "done" }],
      owner: "归属：接入基础组",
      sections: [
        { label: "现状", text: "固定连接池上限，突发流量直接返回 503。" },
        { label: "目标", text: "按内存预算平滑准入并返回 `Retry-After`。" }
      ]
    }
  ]
})
```

### 10. 自定义 HTML（`CustomHtml`）与安全边界

当标准组件无法表达特定定制局部布局时，可用 `CustomHtml(props, htmlString)`（或 `CustomHtml({ ..., html: htmlString })`）编写带 Tailwind CSS 工具类与 Lucide 图标（`<i data-lucide="...">`）的片段。支持可选 `title`、`meta`、`caption` 自动套用 `pele-box` 图示外框。

**编译期安全清洗边界（强制执行）**：

- 自动移除 `<script>`、`<iframe>`、`<object>`、`<embed>`、`<applet>`、`<style>`、`<base>`、`<meta>`、`<link>` 标签及其危险内嵌内容，移除 HTML 注释与未闭合尾部残缺标签；
- 引号感知扫描全部标签属性，剥离所有 `on*` 内联事件处理器（如 `onclick`、`onload`、`onerror`）与 `srcdoc`；
- 对 `href`、`src`、`xlink:href`、`action`、`formaction`、`poster`、`data` 做 HTML 实体解码与控制字符清洗，自动剥离 `javascript:`、`vbscript:` 以及 `data:text/html` / `data:application/xhtml` / `data:image/svg` 等可执行 URL；
- 对行内 `style` 属性剥离 `expression(...)`、`javascript:` 与 `@import`。

```text
CustomHtml({
  title: "CUSTOM VIEW / 实时健康度卡片",
  meta: "Tailwind v4 + Lucide",
  caption: "使用主题映射工具类（bg-accent-tint / text-accent），切换主题或主色时自动同步。"
}, """
<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
  <div class="flex items-start gap-3 p-4 rounded-xl bg-paper border border-line">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-tint text-accent">
      <i data-lucide="shield-check"></i>
    </span>
    <div>
      <div class="text-xs font-mono text-muted">AVAILABILITY</div>
      <div class="text-base font-semibold text-ink">99.98% 准入成功率</div>
    </div>
  </div>
  <div class="flex items-start gap-3 p-4 rounded-xl bg-paper border border-line">
    <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-success-bg text-success">
      <i data-lucide="zap"></i>
    </span>
    <div>
      <div class="text-xs font-mono text-muted">P99 LATENCY</div>
      <div class="text-base font-semibold text-ink">38ms 受理延迟</div>
    </div>
  </div>
</div>
""")
```
