<!-- init-deep:synced@293803c -->

# replay 知识库

## 概述

逆向复盘与因果走读插件：解决「AI 在长会话里猛猛推进、人类一路点同意却在事后陷入认知迷雾」的问题。
双技能分工明确——`replay-md` 产出结构化、可线性走读的 Markdown 复盘报告；
`replay-html` 产出「步进闯关 + 全景链路联动」的单文件自包含 HTML 交互复盘页。
两者的逆向拆解方法论与步进数据契约单点存放在 `skills/_shared/`。

## 目录结构

```text
replay/
├── .claude-plugin/plugin.json
├── README.md
├── INITDEEP.md
└── skills/
    ├── _shared/                              # 双技能共用契约（不被当作技能发现）
    │   ├── reverse-methodology.md            #   终局倒推法 · 噪音折叠 · 迷雾概念对提炼
    │   └── step-chain-schema.md              #   全景背景 + 步进五要素 + 收尾移交 Schema
    ├── replay-md/                            # Markdown 复盘走读稿
    │   ├── SKILL.md
    │   ├── references/markdown-structure.md  #   排版规范 · ASCII 链路图 · 折叠证据块
    │   ├── examples/scenario.md              #   网关生命周期补审与多实例演练对话复盘示范
    │   └── evals/evals.json
    └── replay-html/                          # HTML 交互步进复盘页
        ├── SKILL.md
        ├── references/
        │   ├── html-interaction-spec.md      #   三栏联动 · 步进状态机 · 深浅双主题规范
        │   └── template.html                 #   单文件自包含步进复盘 HTML 起手模板
        ├── examples/example.html             #   网关生命周期补审与多实例演练交互复盘完整示例
        └── evals/evals.json
```

## 导航指南

| 任务                   | 位置                                         | 说明                                         |
| ---------------------- | -------------------------------------------- | -------------------------------------------- |
| 改触发词与路由边界     | 两份 `SKILL.md` frontmatter                  | 明确区分 Markdown 文档诉求与 HTML 交互页诉求 |
| 改逆向拆解与降噪规则   | `_shared/reverse-methodology.md`             | 从终局倒推因果链、合并试错噪音的唯一事实源   |
| 改每步五要素字段与结构 | `_shared/step-chain-schema.md`               | MD 章节与 HTML `REPLAY_DATA` JSON 共用结构   |
| 改 Markdown 排版细节   | `replay-md/references/markdown-structure.md` | 含 ASCII 链路导航与当前定位标记规范          |
| 改 HTML 交互壳与样式   | `replay-html/references/template.html`       | 数据与视图解耦，只改 `#replay-data` 即可渲染 |
| 补触发评测             | 各技能 `evals/evals.json`                    | 含双技能互跳与近似干扰负样本                 |

## 约定

- **先逆向收敛，再正向叙事**：严禁按会话行号做流水账翻译。必须先盘点终局产物，倒推「为什么会有这一步」，将 50 次工具调用收敛为 5–9 个有明确因果咬合的关卡（Step）；
- **步步咬合（Handoff Hook）**：Step $k$ 的「引申到哪里（Next Trigger）」必须精确等于 Step $k+1$ 的「第一步看什么（Entry Anchor）」，断链即视为复盘失败；
- **迷雾雷达（Confusion Buster）**：只要原会话中用户出现追问、撤回（revert）、打断或连点同意，必须在对应 Step 提炼「直觉误区 vs 真实机制」；
- **HTML 单文件零依赖**：`replay-html` 交付的 HTML 必须完全内联 CSS/JS 与 JSON 数据，双击即可在浏览器运行，支持深浅主题切换、键盘 `←`/`→` 步进、证据抽屉展开与 Markdown/打印导出。

## 反模式

- 把 `Bash` / `Read` / `Edit` 的每次调用原样列成时间线流水账；
- 只写「AI 做了 X」，不写「为什么要看这里」和「怎么引申到下一步」；
- 在 `replay-md` 与 `replay-html` 各自复制一份步进字段定义——统一链回 `_shared/`；
- 生成需要本地启动服务器或外部 JSON 文件才能打开的 HTML。

## 调试路径

1. 两个技能触发混淆 → 检查用户是否提及 `HTML / 网页 / 交互 / 可视化 / 点下一步`，未指定格式时默认询问或按场景路由；
2. 复盘读起来像日志摘要 → 核对是否执行了 `_shared/reverse-methodology.md` 的「四类噪音折叠」与「首尾咬合检查」；
3. HTML 页面打不开或切换卡死 → 检查 `<script id="replay-data" type="application/json">` 是否为合法 JSON（无未转义控制字符）。

## 引用

- [html](../html/INITDEEP.md) — 遵循一致的「外硬内柔」双主题单文件 HTML 工程美学
- [research](../research/INITDEEP.md) — 四件套技能目录体例参考
