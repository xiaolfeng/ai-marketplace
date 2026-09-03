<!-- deep-init:synced@b43b534 -->

# docs 知识库

## 概述

文档中心：`plugin-guidelines.md` 与 `scope-manage.md` 两份项目级规范，加上
`engineering/` 五阶段工程文档目录。写作行为由 engineering-design 插件的技能
执行；本知识库管的是「文件放哪、叫什么、怎么流转」。

## 目录结构

```text
docs/
├── README.md              # 文档中心索引：阶段定义、命名规范、流转规则
├── plugin-guidelines.md   # 向本市场提交插件的唯一标准
├── scope-manage.md        # Scope 总账：Git 提交与工程文档共用业务域词表
└── engineering/
    ├── draft/             # 草案（空，待写入）
    ├── research/          # 调研笔记（0001~0005 已有）
    ├── rfc/               # 提案（空，待写入）
    ├── design/            # 设计（预留，写作技能待补）
    └── adr/               # 架构决策记录（空，待写入）
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 写调研笔记 | `engineering/research/` | 只记现状与证据 |
| 写提案 | `engineering/rfc/` | 方向已收敛、需评审时 |
| 定稿长期决策 | `engineering/adr/` | 从被接受的 RFC 冻结 |
| 登记新业务域 Scope | `scope-manage.md` | 三列一次填齐 |
| 修改插件上架标准 | `plugin-guidelines.md` | 全平台实测结论，改动需附依据 |

## 约定

- **编号按阶段分列**：`NNNN-<scope>-<title>.md` 的四位编号在 draft / research /
  rfc / design / adr 各自独立递增。写 RFC 只看 `rfc/` 的最大号，写 ADR 只看
  `adr/`——拿「全部子目录全局最大号」续号会把 RFC 和 ADR 拧成一条序列。
- **阶段与 Scope 正交**：目录名（draft/research/…）表达生命周期阶段，Scope 是
  文件名里的业务域段，取自 `scope-manage.md` 词表英文单词列——两者不可互相替代。
- **单向流动，不回改旧文**：draft→research→rfc→(adr|design)；同一主题跨阶段
  在目标目录内单独取号，承接靠文首链接；被取代的旧文保留原文并在文首标注去向。
- **词表三列一次填齐**：2 字中文、4 字中文、英文单词即使当前只用一列也照填，
  防未来切换提交模式出现歧义。

## 反模式

- 删除已被取代的旧文档——讨论上下文是流程的一部分；
- 在 `docs/` 根散放未登记的新文档——现有两个根级文件是登记过的特例，
  新增同类文件应先进 `engineering/` 流转或在 README 挂索引；
- 绕过 engineering-design 技能手写工程文档——编号分配与模板约束由技能保证。

## 调试路径

1. 编号疑似冲突或引用打空 → 跑 engineering-design 的 `doc-clean`，
   不要手算跨目录编号；
2. Scope 拿不准 → 查 `scope-manage.md` 词表，任一名字列语义命中即视为同域复用；
3. 阶段选择困惑 → 对照 `README.md` 流转规则与 `_shared/lifecycle.md` 状态机。

## 引用

- [engineering-design](../plugins/engineering-design/AGENTS.md) — 本目录写作技能的宿主插件
