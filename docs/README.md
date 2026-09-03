# 文档中心

工程文档统一落在 [`engineering/`](./engineering/) 下，按「草案 → 调研 → 提案 → 决策」的生命周期分块：

| 目录 | 定位 | 何时写入 |
| --- | --- | --- |
| [`engineering/draft/`](./engineering/draft/) | 草案——钉住困惑与初步想法 | 想法未收敛、证据不足时先记一笔 |
| [`engineering/research/`](./engineering/research/) | 调研笔记——记录「现状是什么」 | 需要摸清外部标准、竞品或技术机制时 |
| [`engineering/rfc/`](./engineering/rfc/) | 提案——主张「建议怎么做」，尚待讨论收敛 | 方案方向基本成形、需要评审与反馈时 |
| [`engineering/design/`](./engineering/design/) | 设计——方向已接受后写清具体怎样工作 | 预留目录，写作技能待补 |
| [`engineering/adr/`](./engineering/adr/) | 架构决策记录（ADR）——沉淀「最终定了什么、为什么」 | 提案被接受后冻结为长期约束时 |

## 命名规范

所有文档统一命名为 `NNNN-<scope>-<title>.md`：

- **`NNNN`**：四位编号，每个阶段目录各自一条递增序列（rfc 有 rfc 的号，adr 有 adr 的号，其余同理），取**该目录**现有最大编号 +1；目录为空从 `0001` 起；
- **`<scope>`**：业务域英文单词，取自 [Scope 总账](./scope-manage.md) 词表（目录名表达的是生命周期阶段，与 scope 正交）；
- **`<title>`**：kebab-case 英文短标题。

示例：树洞匿名提案 → `engineering/rfc/0003-treehole-anonymous.md`；
同主题定稿可以是 `engineering/adr/0001-treehole-anonymous.md`（两条序列互不续号）。

## 流转规则

一篇内容沿 `draft → research → rfc → adr` 单向流动：草案钉住想法，
调研为提案供证据，提案收敛后固化为决策；需要写实施方式时进 design。
同一主题在相邻阶段于目标目录内单独取号，不沿用上一阶段编号，也不跨目录续号——
承接关系写在文首链接里。
已被取代的旧文不删除，保留讨论上下文并在文首标注去向。

日常写作由 AI 依照 **engineering-design** 插件的技能执行（含编号分配与模板约束）；
整理编号、引用和错位走 **doc-clean**。

## 现有内容

### research/

1. [插件标准全景调研](./engineering/research/0001-plugin-standards.md)
2. [npx 安装器深度拆解](./engineering/research/0002-marketplace-installers.md)
3. [插件 Logo 展示机制](./engineering/research/0003-plugin-logos.md)
4. [ZCode 兼容性分析](./engineering/research/0004-marketplace-zcode.md)
5. [Skill 编写规范与 AI 输出可读性](./engineering/research/0005-skill-authoring.md)

### 其他

- [插件编写规范](./plugin-guidelines.md) — 向本市场提交插件的唯一标准
- [项目 Scope 总账](./scope-manage.md) — Git 提交与工程文档共用的业务域词表（含提交模式决议）
