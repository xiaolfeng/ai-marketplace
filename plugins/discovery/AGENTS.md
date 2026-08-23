<!-- deep-init:synced@b43b534 -->

# discovery 知识库

## 概述

项目探索与知识库构建插件，当前只含一个技能 `deep-init`：为任意项目生成分层
`AGENTS.md` 知识库。v0.0.2 起定型为「脚本保底 + AI 只做判断」的执行器形态——
确定性操作（采集现状、增量 diff、结果校验）全部由脚本完成，AI 只负责两件需要
判断力的事：决定哪些目录值得分层、把每份知识库写到真实可信。

## 目录结构

```text
discovery/
├── .claude-plugin/plugin.json   # 插件 manifest（版本与 marketplace.json 同步）
├── README.md                    # 面向插件用户的功能说明
└── skills/
    └── deep-init/
        ├── SKILL.md             # 主流程执行清单（≤150 行）
        ├── scripts/
        │   ├── scan.mjs         # 采集 git 状态、存量盘点与增量 diff 摘要
        │   └── validate.mjs     # 校验标记、必备段落、链接可达性与编码
        ├── references/          # 下沉资料：模板、边界手册、可选文档目录
        ├── examples/            # 黄金样例：对齐产出质量与口吻
        └── evals/
            └── evals.json       # 官方 skill-creator 基线对比与触发率测试
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 改扫描或校验逻辑 | `skills/deep-init/scripts/*.mjs` | 保持零依赖 Node ≥18 |
| 改同步标记格式或正文模板 | `references/templates.md` | 标记定义、模板与字段速查都在此 |
| 加边界情况处置 | `references/edge-cases.md` | E1~E7 编号条目式追加 |
| 增加可选文档候选 | `references/optional-docs.md` / `ai-rules.md` | 信号 → 候选速查表各管一类 |
| 对齐产出口吻 | `examples/root-agents.md` 等 | 动笔前先读黄金样例 |
| 调整触发词 | `SKILL.md` frontmatter 的 `description` | 触发匹配的唯一依据 |

## 约定

- **执行器分工不可倒置**：能脚本化的确定性操作必须走脚本，因为 AI 手搓采集与
  校验会随会话漂移且无法回归测试；新增能力时先问「这步能否写成 `.mjs`」。
- **渐进披露是硬结构**：`SKILL.md` 只留主流程，细节下沉 `references/`，
  质量基准放 `examples/`——正文膨胀会挤占执行上下文，直接拉低生成质量。
- **同步标记是增量协议的唯一依据**：格式改动必须三处同改——`templates.md`
  （定义）、`scan.mjs`（解析）、`validate.mjs`（校验），漏一处协议即失效。
- **人工内容保护优先于生成**：无同步标记的存量文件视为人工维护，改写前必须走
  问询；`CLAUDE.md` 永不静默覆盖。

## 反模式

- 在 `SKILL.md` 里内联完整模板正文——模板属于 `references/`，按需加载；
- 跳过 `validate.mjs` 直接宣称生成完成——校验闭环是流程第 4 步，不是可选项；
- 让脚本引入第三方依赖——脚本会在任意用户项目里运行，环境不可控。

## 调试路径

1. `scan.mjs` 输出异常 → 对照 `templates.md` 的输出字段速查表核对
   `knowledgeBase[].marked` 与 `diffSinceMarker` 语义；
2. 技能未被触发 → 核对 frontmatter `description` 的触发短语覆盖面；
3. `validate.mjs` 误报 → 先确认文件编码 UTF-8、换行 LF，再查必备段落标题是否被改写。
