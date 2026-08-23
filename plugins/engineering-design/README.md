# engineering-design

工程设计文档管理插件。四个写作技能分管全链路四个阶段，外加一个目录初始化器——
每个技能自带好坏对照示例与可复制操作清单。

## 包含技能

| 技能 | 阶段 | 一句话定位 |
| --- | --- | --- |
| [`draft-er`](./skills/draft-er/) | 草案 | 链首：钉住困惑与初步想法，允许粗糙 |
| [`research-er`](./skills/research-er/) | 调研 | 只记现状与证据，判断标「倾向」不拍板 |
| [`rfc-er`](./skills/rfc-er/) | 提案 | 给评审人拍的：采用什么、不做什么、哪些没定 |
| [`adr-er`](./skills/adr-er/) | 定稿 | 冻结长期约束，每条可单独引用 |
| [`docs-init`](./skills/docs-init/) | 初始化 | Python 脚本幂等创建五段式文档目录 |

## 设计

- **调用链**：`draft ──► research ──► rfc ──► adr`，方向已接受后可分叉 `design`；
- **渐进披露**：SKILL.md 只放操作清单和文档骨架；好坏对照示例在各自的 `references/example.md`，动笔前才读；
- **共享约束**：编号命名、业务域词表、状态机流转、输出语言纪律收在 [`skills/_shared/`](./skills/_shared/)，四技能一份事实源；
- **自由度分级**：编号与状态是死命令，文档骨架按模板，行文语气按原则；
- **反 AI 腔**：内置空话词禁用表、「删减测试」与万能句式黑名单——文档写给人看，不是写给汇报看的。

## 安装

```bash
# Claude Code
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install engineering-design@xiaofeng-plugins

# 或任意支持 Agent Skills 的工具（78+）
npx skills add xiaolfeng/ai-marketplace --skill draft-er --skill research-er --skill rfc-er --skill adr-er --skill docs-init
```

## 使用

| 场景 | 说的话 | 触发技能 |
| --- | --- | --- |
| 想法还没想清楚 | 「先记个草案」 | `draft-er` |
| 需要摸清现状 | 「调研一下 X」 | `research-er` |
| 方案要评审 | 「写个 RFC 提议 X」 | `rfc-er` |
| 决定要定稿 | 「把这个决定记下来」 | `adr-er` |
| 新项目搭文档骨架 | 「初始化文档」 | `docs-init` |

也可显式调用：

```bash
/draft-er
/research-er
/rfc-er
/adr-er
/docs-init
```

## 结构

```text
engineering-design/skills/
├── _shared/
│   ├── scope-manage.md     # 业务域词表对接（公共）
│   ├── conventions.md      # 五阶段目录 + 编号命名（公共）
│   ├── lifecycle.md        # 流转方向 + 状态机（公共）
│   └── writing-style.md    # 输出语言纪律（公共）
├── draft-er/SKILL.md
├── research-er/
│   ├── SKILL.md
│   └── references/example.md
├── rfc-er/
│   ├── SKILL.md
│   └── references/example.md
├── adr-er/
│   ├── SKILL.md
│   └── references/example.md
└── docs-init/
    ├── SKILL.md
    └── scripts/init_docs.py
```
