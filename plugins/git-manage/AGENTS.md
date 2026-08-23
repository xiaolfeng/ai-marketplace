<!-- deep-init:synced@b43b534 -->

# git-manage 知识库

## 概述

Git 工作流管理插件：把提交、合并、变基三类高频本地操作封装成可触发的技能。
`git-commit` 分析 diff 生成规范化中文提交信息并直接执行；`need-merge` 与
`need-rebase` 共用一份安全手册做前置检查。全程只操作本地分支，绝不触碰远端。

## 目录结构

```text
git-manage/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/
    │   ├── branch-safety.md   # need-merge / need-rebase 共用的安全手册（C1~C4）
    │   └── scope-manage.md    # 业务域词表对接
    ├── git-commit/            # 提交执行器：铁律 + 问询协议 + 直接执行
    │   ├── SKILL.md
    │   ├── references/edge-cases.md   # 特殊情况处置手册 E1~E8
    │   └── examples/messages.md · scenarios.md  # 好坏对照 + 端到端演练
    ├── need-merge/            # 合并执行器：源合入目标
    └── need-rebase/           # 变基执行器：源搬到目标之上，改写历史
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 改提交信息规范 | `skills/git-commit/SKILL.md` | 类型表、作用域优先级都在正文 |
| 加特殊提交场景处置 | `skills/git-commit/references/edge-cases.md` | 按 E 编号条目式追加 |
| 改分支操作安全规则 | `skills/_shared/branch-safety.md` | 两技能同时生效 |
| 调整触发词 | 各 `SKILL.md` frontmatter 的 `description` | 触发匹配的唯一依据 |
| 补示例 | `skills/git-commit/examples/` | 好坏对照必须成对出现 |

## 约定

- **五条铁律是硬约束**：只 commit 绝不 push、禁止 `Co-Authored-By`、中文提交信息、
  默认单次提交、分析完直接执行不反问——前两条是安全边界，后三条是交互契约，
  改动任何一条都要先想清楚破坏的是安全还是体验。
- **问询协议是封闭清单**：仅敏感文件、危险操作等少数情形允许停下来问，并给出
  标准话术；新增问询点等于收窄「直接执行」的承诺，须谨慎评估。
- **分支安全规则只此一份**：`need-merge` 与 `need-rebase` 都以 `_shared/branch-safety.md`
  为准做 C1~C4 前置检查与方向一致性检测——两处各写一套必然漂移。
- **scope 取词表 2 字中文列**：模式决议登记在 `docs/scope-manage.md`，提交前先查
  词表复用，确属新域才登记新行。

## 反模式

- 执行 `git push` 或任何远端操作——本插件定位是本地工作流，推送由用户显式发起；
- 提交信息添加 `Co-Authored-By`——提交作者就是用户本人；
- 用户未明确要求时建议 rebase——它会改写源分支历史，触发面在 description 里已收紧。

## 调试路径

1. 生成的提交信息不合规范 → 对照 `examples/messages.md` 好/坏样例与类型表复查；
2. 分支操作被中止 → 属预期：`branch-safety.md` 的可疑方向检测命中会先向用户确认；
3. 技能未被触发 → 核对 description 是否包含用户可能说出的短语。

## 引用

- [docs](../../docs/AGENTS.md) — scope 词表总账的落点目录知识库
- [engineering-design](../engineering-design/AGENTS.md) — 共享同一套业务域 scope 词表
