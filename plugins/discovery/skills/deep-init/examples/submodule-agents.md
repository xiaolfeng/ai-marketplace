<!-- deep-init:synced@76c9216 -->

# git-manage 知识库

> 本文件是 deep-init 黄金样例（节选），展示子模块 AGENTS.md 应有的信息密度与口吻。

## 概述

Git 工作流插件集：把提交、合并、变基三类高频操作封装成可触发的技能，
只操作本地分支，绝不触碰远端。

## 目录结构

```text
git-manage/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/          # 跨技能共享约定（下划线前缀 = 不作为技能发现）
    │   ├── branch-safety.md
    │   └── scope-manage.md
    ├── git-commit/       # 提交执行器：diff 分析 → 规范信息 → 直接 commit
    ├── need-merge/       # 分支合并执行器
    └── need-rebase/      # 分支变基执行器
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 生成并执行提交 | `skills/git-commit/SKILL.md` | 铁律与问询协议都在正文内 |
| 合并 A 到 B | `skills/need-merge/SKILL.md` | 仅本地分支 |
| 变基更新基座 | `skills/need-rebase/SKILL.md` | 会改写历史，须用户明确要求 |
| 查 scope 词表规则 | `skills/_shared/scope-manage.md` | 全项目一套业务域词表 |

## 约定

- 技能名与目录名一致（kebab-case），因为跨工具发现按目录名匹配；
- 共享内容放 `_shared/` 而非复制进各技能，避免多处版本漂移；
- 版本号改动必须同步 plugin.json 与 marketplace.json 两处，漏一处用户收不到更新。

## 反模式

- 执行 `git push`：本插件定位是本地工作流，推送必须由用户显式发起；
- 在提交信息中添加 Co-Authored-By：提交作者就是用户本人。

## 调试路径

1. 技能未被触发 → 先核对 SKILL.md frontmatter 的 description 与触发短语；
2. `npx skills add . --list` 缺失该技能 → 检查目录是否嵌套或 name 不匹配；
3. 校验报错 → 运行 `claude plugin validate .` 定位 manifest 问题。

## 引用

- [engineering-design](../engineering-design/AGENTS.md) — 文档体系插件，共享 scope 词表约定
