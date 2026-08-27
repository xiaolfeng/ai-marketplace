<!-- deep-init:synced@94e32fb -->

# charm 知识库

## 概述

魅力文学插件：让模型的文字像活人而非输出机器。双子星分工——
`like-a-human-writing` 管**成文的段落**（文章 / 博客 / README / 长回复），
`like-a-human-speaking` 管**回合制的对话**（IM 回复 / 群公告 / 客服话术）。
方法论的全部出处单点收录在 `_shared/human-sources.md`：
一半是人机文本差异实证（burstiness、立场标记、修复机制、填充词效应），
一半是经典写作准则（Orwell 六则、Zinsser 砍冗余）。

## 目录结构

```text
charm/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/                        # 双技能共用资产（不被当作技能发现）
    │   ├── slop-blacklist.md           # AI 腔黑名单：甲通用 / 乙书面 / 丙口语
    │   └── human-sources.md            # 参考文献库：W* 写作系 · S* 口语系编号
    ├── like-a-human-writing/           # 写作系：判级 → 诊断 → 重写 → 出稿
    │   ├── SKILL.md
    │   ├── references/craft.md         # burstiness · 具体性 · 立场回归 · 词语降级
    │   ├── examples/scenario.md        # AI 腔周报改造对照
    │   └── evals/evals.json
    └── like-a-human-speaking/          # 口语系：听诊 → 重建语感 → 控密度 → 出稿
        ├── SKILL.md
        ├── references/speech-signals.md  # CA 结论 → 中文文字消息转换规则
        ├── examples/scenario.md          # 客服腔群公告改造对照
        └── evals/evals.json
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 增删 AI 腔病灶 | `_shared/slop-blacklist.md` | 双技能共用的唯一诊断口径 |
| 追加写作手法 | writing `references/craft.md` | 新条目必须标注 W*/经典出处 |
| 追加口语特征 | speaking `references/speech-signals.md` | S* 编号对应，移植推断需显式声明 |
| 更新参考文献 | `_shared/human-sources.md` | 附取用纪律，先读再加 |
| 调整两技能边界 | 两份 frontmatter description | 互为对方的负向触发器 |

## 约定

- **诊断与修复分离**：病灶清单只在 `_shared/slop-blacklist.md`，修复手法分居
  各技能 references——手法治病、黑名单记病，混写会让双技能口径漂移；
- **实证移植有纪律**：英文口语实验（如填充词促记忆）移植到中文文字属外推，
  在 sources 与手册两处都要声明口径，禁止拿实证给自己的偏好站台；
- **文体分级是安全带**：技术规范与 API 文案走克制档只清病灶，法务口径、
  事故通报触发场合守门直接拒改（writing E3-E4 / speaking E3）；
- **特征是稀料**：speaking 密度红线 ≤3 处特征每条回复，超线即「表演随意」的
  反向 bot 腔——活人的标志是有结构的不规整，不是随机撒料。

## 反模式

- 把病句当人味移植：人类文本错字率更高是「初稿的人」，不是要模仿的对象
  （writing 铁律 2 有明确切分）；
- 堆 emoji 与感叹号制造热情——情绪浓度过高恰是 AI 文本的实证特征之一；
- 触发诊断前就直接改写：先打标签定位病灶是两条流程的第一步；
- 复制黑名单到任一技能目录——它是 `_shared/` 单点维护资产。

## 调试路径

1. 两技能互相抢触发 → 核对双方 description 的互斥负向触发器是否成对还在；
2. 手册里 W#/S# 编号失去着落 → 对照 `_shared/human-sources.md` 补链接或删条目；
3. 改完读着还是假 → 回 speech-signals §七密度红线复查，再做 craft §六终检三问。

## 引用

- [research](../research/AGENTS.md) — 同批四件套规格的姊妹插件，评测集体例一致
