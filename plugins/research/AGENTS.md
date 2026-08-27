<!-- deep-init:synced@94e32fb -->

# research 知识库

## 概述

双模式调研插件：`research-normal` 开放式收集与对比，`research-adversarial`
以辩论攻击既有认知，产物由插件级终审子代理 `final-research-check` 收束。
本插件的立场写在两处铁律里——normal「只陈述不拍板」，adversarial
「结论不由辩论直接定稿」；共同的终点是把决定权干净地还给用户。

## 目录结构

```text
research/
├── .claude-plugin/plugin.json
├── README.md
├── agents/
│   └── final-research-check.md     # 终审官：复核胜负 → 核查悬置 → 出三要素报告
└── skills/
    ├── research-normal/            # 常规模式：三问立项 → 维度拆解 → 收集 → 矩阵 → 报告
    │   ├── SKILL.md
    │   ├── references/source-evaluation.md   # 信源优先级 · 置信度定级 · 垃圾过滤
    │   ├── examples/scenario.md              # monorepo 工具链选型全程示范
    │   └── evals/evals.json
    └── research-adversarial/       # 对抗模式：立题 → 分战线辩论 → 移交终审
        ├── SKILL.md
        ├── references/debate-playbook.md     # 攻击手法 · 弹药定级 · 认输协议
        ├── examples/scenario.md              # 大促超卖迁 TiDB 全程示范
        └── evals/evals.json
```

每个技能固定四件套（SKILL.md + references + examples + evals），
正文只留工作流骨架，细节按渐进披露下沉。

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 改触发词与路由边界 | 两份 SKILL.md frontmatter | 负向触发器是双模式互斥的关键 |
| 攻击手法与战线判定 | adversarial `references/debate-playbook.md` | 含认输协议的动作规范 |
| 信源取舍与置信度 | normal `references/source-evaluation.md` | 全仓库取证都要过它的分级 |
| 报告结构与输出契约 | `agents/final-research-check.md` | 六节模板的唯一事实源 |
| 补触发评测 | 各技能 `evals/evals.json` | 负样本必须是近似干扰项 |

## 约定

- **置信度口径跨技能统一**：normal 报告结论用「确定 / 倾向 / 存疑」，
  adversarial 弹药用「强 / 中 / 弱」，换算关系（强→确定 … 弱→存疑）登记在
  source-evaluation 第二节——改任何一侧必须检查另一侧是否仍能换算；
- **终审不可绕过**：最终报告只能出自 `final-research-check`；宿主无子代理能力时
  降级为会话内执行，且必须在报告开头标注「降级终审」；
- **战线台账三态闭环**：论点守住 / 盲区暴露 / 平局悬置——悬置项必须写明
  「裁决所需证据」并移交终审，静默丢弃视同造假；
- **对抗模式的人味**：动态立场要求 AI 用户占优时明确认输（话术格式见 playbook
  第四节），护短会让终审报告系统性失真。

## 反模式

- 跳过终审直接把辩论结论当调研结论交付；
- 把手法细节写回 SKILL.md 正文——章节留链接，细节住 references，引用一层深；
- 把 research-normal 写成需要踩坑经验才敢用的姿态——零基础用户是从 adversarial
  分流过来的主流入口；
- 幸存者偏差式取证：只报对结论有利的来源（normal 铁律 3 与反模式 E3 同责）。

## 调试路径

1. 触发串门（辩论诉求进了 normal）→ 核对两份 description 的正负触发器是否仍成对出现；
2. 消费端找不到终审 agent → `agents/*.md` 属平台扩展件，Codex 会忽略，
   属预期行为，SKILL.md 内有会话内降级路径兜底；
3. 报告结构走样 → 模板只有一处事实源（agents/final-research-check.md），
   出现第二份复制即违规。

## 引用

- [engineering-design](../engineering-design/AGENTS.md) — 报告转化工程动作的下游宿主（ADR 流程）
- [charm](../charm/AGENTS.md) — 同批上架的姊妹插件，同为四件套规格
