---
name: plan-er
description: >
  编写、推进与归档顶层 plan/ 目录下的工程实施与迁移计划，覆盖活动态（draft → ready → in-progress，
  平铺于 plan/）与终态归档（done / cancelled / superseded，移入 plan/archive/）。当需要规划分阶段改造路线、
  存量兼容迁移、切流回滚步骤与任务拆解，或用户说「写个实施计划」「迁移方案」「演进路线图」
  「把计划归档」「/plan-er」时使用。
---

# plan-er · 实施计划模式（顶层 `plan/` 与 `plan/archive/`）

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

## 模式定位：与 `docs/` 同级的动态推进与迁移资产

- **为什么 `plan/` 独立于 `docs/engineering/`**：
  - `docs/engineering/` 存放「系统长什么样、守什么规矩、怎么运维」的**长期静态资产**；
  - `plan/`（与 `docs/` 同级）存放「**怎么从现状一步步改到目标态、分几期推进、存量怎么平滑迁移、做完即归档**」的**时间维动态计划**，避免已完结的历史排期污染长期设计文档。
- **目录与状态流转规则**：
  - **活动态（直接平铺于 `plan/NNNN-<scope>-<title>.md`，不设 `active/` 子目录）**：
    - `draft`（起草计划与阶段划分）→ `ready`（评审就绪待执行）→ `in-progress`（正在推进中）
  - **终态（移入 `plan/archive/NNNN-<scope>-<title>.md`）**：
    - `done`（全部阶段验收完成） / `cancelled`（计划取消） / `superseded`（被新计划替代）

## 操作流程

复制此清单并随做随勾：

```
实施计划进度：
- [ ] 1. 判定动作：新建计划（平铺于 plan/，初始状态 draft）、推进活动状态（ready / in-progress）或完结归档（改状态为 done/cancelled/superseded 并移入 plan/archive/）
- [ ] 2. 核对承接的 design / spec，明确起点现状、目标终态、前置条件与兼容风险
- [ ] 3. 按骨架拆解「分阶段计划」（每阶段含具体动作、交付物与阶段检查点）及「迁移与回滚」预案
- [ ] 4. 新建取号时，必须同时扫描 plan/ 根与 plan/archive/ 取合并最大编号 +1（防归档撞号），命名 NNNN-<scope>-<title>.md
- [ ] 5. 同步更新 plan/README.md 的「进行中计划」或「已归档计划」分表（若迁入 archive/，同时修正指向该文件的相对链接），回报路径与当前状态
```

## 文档骨架

```markdown
# 标题

> 状态：draft | ready | in-progress | done | cancelled | superseded · 日期：YYYY-MM-DD · Scope：<scope>
> 承接：[工程设计/规范标题](../docs/engineering/design/NNNN-scope-title.md)（归档至 plan/archive/ 后相对路径多一层 `../`）

## 目标与范围

本次实施或迁移要从什么现状推进到什么目标态；明确包含的工作项与不在本计划内的事项。

## 前置条件与风险

开工前必须就位的依赖、数据备份或环境条件；列出迁移过程中的关键风险点与兼容窗口。

## 分阶段计划

按先后顺序拆解阶段（Phase 1 / Phase 2 ...），每阶段写明：

- **改动范围与动作**：具体涉及的模块、文件或脚本；
- **阶段准出条件（Checkpoint）**：跑通什么命令或满足什么指标才允许进入下一阶段。

## 迁移与回滚

- **存量兼容与迁移**：旧数据、旧配置或已有调用方如何平滑过渡；
- **回滚预案**：任一阶段准出失败时，如何安全退回上一阶段。

## 验收与归档标准

全部阶段完成后的总体验收命令与核对项；全部打勾后将文首状态改为 `done`，文件移入 `plan/archive/` 并更新 `plan/README.md`。
```

## 计划纪律

1. **取号必扫两处**：新建计划时必须同时读取 `plan/` 与 `plan/archive/` 的编号取最大值 +1，绝不复用已归档编号；
2. **阶段必带准出条件**：禁止写「第一阶段：完成开发；第二阶段：完成测试」这种无准出标准的空洞排期；
3. **归档必搬目录且更新链接**：状态进入 `done` / `cancelled` / `superseded` 时，文件不能继续留在 `plan/` 根目录，必须移入 `plan/archive/`，并同步将文内指向 `../docs/` 的相对链接调整为 `../../docs/`。

## 好坏对照

动笔前读 [references/example.md](./references/example.md)，检查分阶段计划是否具备可验证的阶段准出条件与真实的回滚路径。

## 成品样例

需要完整颗粒度时读 [examples/sample.md](./examples/sample.md)，按本次实施与迁移任务改写。
