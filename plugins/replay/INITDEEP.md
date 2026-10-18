<!-- init-deep:synced@293803c -->

# replay 知识库

## 概述

逆向复盘与因果走读插件：解决「AI 在长会话里猛猛推进、人类一路点同意却在事后陷入认知迷雾」的问题。
按「读者 × 格式」拆成四个技能：自己看的大白话版 `replay-md`（Markdown 走读手册）与 `replay-html`（暖纸笔记本式一屏一步页），对外发布的正式版 `replay-post-md`（Markdown 复盘报告）与 `replay-post-html`（翻页式正式报告）。
四者共用的逆向拆解方法论、步进数据契约与读者口吻规范单点存放在 `skills/_shared/`。

## 目录结构

```text
replay/
├── .claude-plugin/plugin.json
├── README.md
├── INITDEEP.md
└── skills/
    ├── _shared/                              # 四技能共用契约（不被当作技能发现）
    │   ├── reverse-methodology.md            #   终局倒推法 · 噪音折叠 · 迷雾概念对提炼
    │   ├── step-chain-schema.md              #   核心 Schema + glossary / publication 读者扩展
    │   └── audience-voice.md                 #   自己看 vs 对外发布的口吻与脱敏清单
    ├── replay-md/                            # 自己看 · Markdown 大白话走读稿
    │   ├── SKILL.md
    │   ├── references/markdown-structure.md  #   30 秒看懂 · ASCII 链路图 · 小词典
    │   ├── examples/scenario.md
    │   └── evals/evals.json
    ├── replay-html/                          # 自己看 · HTML 暖纸笔记本步进页
    │   ├── SKILL.md
    │   ├── references/
    │   │   ├── html-interaction-spec.md      #   一屏一步 · 词条气泡 · 键盘与 hash 定位
    │   │   └── template.html                 #   数据驱动单文件模板
    │   ├── examples/example.html
    │   └── evals/evals.json
    ├── replay-post-md/                       # 对外发布 · Markdown 正式复盘报告
    │   ├── SKILL.md
    │   ├── references/post-structure.md      #   摘要 · 影响 · 时间线 · 决策 · 经验骨架
    │   ├── examples/postmortem.md
    │   └── evals/evals.json
    └── replay-post-html/                     # 对外发布 · HTML 翻页式正式报告
        ├── SKILL.md
        ├── references/
        │   ├── post-html-spec.md             #   页面清单 · 翻页交互 · 报告视觉
        │   └── template.html                 #   数据驱动单文件模板
        ├── examples/example.html             #   订单服务对外复盘报告示例
        └── evals/evals.json
```

## 导航指南

| 任务                   | 位置                                          | 说明                                             |
| ---------------------- | --------------------------------------------- | ------------------------------------------------ |
| 改触发词与路由边界     | 四份 `SKILL.md` frontmatter                   | 同时区分读者（自己看 / 对外）与格式（MD / HTML） |
| 改口吻与脱敏规则       | `_shared/audience-voice.md`                   | Self 与 Post 的写法对照、发布前脱敏清单          |
| 改逆向拆解与降噪规则   | `_shared/reverse-methodology.md`              | 从终局倒推因果链、合并试错噪音的唯一事实源       |
| 改每步五要素字段与结构 | `_shared/step-chain-schema.md`                | MD 章节与 HTML `REPLAY_DATA` JSON 共用结构       |
| 改 Markdown 排版细节   | `replay-md/references/markdown-structure.md`  | 含 ASCII 链路导航与当前定位标记规范              |
| 改 HTML 交互壳与样式   | 两份 `references/template.html`               | 数据与视图解耦，只改 `#replay-data` 即可渲染     |
| 改对外报告骨架         | `replay-post-md/references/post-structure.md` | MD 报告与 HTML 翻页页清单保持同一顺序            |
| 补触发评测             | 各技能 `evals/evals.json`                     | 含双技能互跳与近似干扰负样本                     |

## 约定

- **先逆向收敛，再正向叙事**：严禁按会话行号做流水账翻译。必须先盘点终局产物，倒推「为什么会有这一步」，将 50 次工具调用收敛为 5–9 个有明确因果咬合的关卡（Step）；
- **步步咬合（Handoff Hook）**：Step $k$ 的「引申到哪里（Next Trigger）」必须精确等于 Step $k+1$ 的「第一步看什么（Entry Anchor）」，断链即视为复盘失败；
- **迷雾雷达（Confusion Buster）**：只要原会话中用户出现追问、撤回（revert）、打断或连点同意，必须在对应 Step 提炼「直觉误区 vs 真实机制」；
- **读者先于格式**：先判断给谁看（自己 / 对外），再判断格式；对外版本必须执行 `_shared/audience-voice.md` 的脱敏清单；
- **HTML 单文件零依赖**：两套模板完全内联 CSS/JS 与 JSON 数据，不引用外部字体，双击即可运行，支持深浅主题、键盘 `←`/`→` 翻页、目录抽屉、hash 定位与 Markdown/打印导出。
- **二次元点缀与 html 插件同构**：两套 HTML 模板末尾的「ACCENT · 二次元点缀」样式段与 html 插件同源（樱粉 `--sakura`、✦ 四角星、角落网点、对话气泡、平涂错位阴影），改点缀时两边同步。

## 反模式

- 把 `Bash` / `Read` / `Edit` 的每次调用原样列成时间线流水账；
- 只写「AI 做了 X」，不写「为什么要看这里」和「怎么引申到下一步」；
- 在各技能里各自复制一份步进字段定义或口吻规则——统一链回 `_shared/`；
- 把自己看的口语稿（「你拍板」「我懵了」、真实人名）原样放进对外版本；
- 生成需要本地启动服务器或外部 JSON 文件才能打开的 HTML。

## 调试路径

1. 四个技能触发混淆 → 先看读者信号（「我懵了 / 自己看」vs「发出去 / 对外 / 给老板」），再看格式信号（`HTML / 网页 / 翻页 / 点下一步`），都不明确时先问；
2. 复盘读起来像日志摘要 → 核对是否执行了 `_shared/reverse-methodology.md` 的「四类噪音折叠」与「首尾咬合检查」；
3. HTML 页面打不开或切换卡死 → 检查 `<script id="replay-data" type="application/json">` 是否为合法 JSON（无未转义控制字符）。

## 引用

- [html](../html/INITDEEP.md) — 单文件、深浅双主题的 HTML 交付约定
- [research](../research/INITDEEP.md) — 四件套技能目录体例参考
