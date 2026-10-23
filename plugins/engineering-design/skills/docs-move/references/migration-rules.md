# 旧版与不规范文档迁移规则（Migration Rules）

本文件定义 `docs-move` 将历史遗留目录、不规范命名、旧状态值与散乱章节整理为当前规范样式的精确映射规则。

## 1. 目录与模式分流规则

| 旧路径 / 不规范形态                                                                | 目标目录                                                       | 判定依据与迁移方式                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 顶层 `plan/`（含 `plan/archive/`、`plan/README.md`）                               | `docs/plan/`（含 `docs/plan/archive/`、`docs/plan/README.md`） | 直接迁入 `docs/plan/`（与 `docs/engineering/` 同级）；文内指向 `../docs/engineering/` 的相对链接统一修正为 `../engineering/`（`archive/` 内修正为 `../../engineering/`） |
| `docs/draft/`、`docs/rfc/`、`docs/adr/` 或 `docs/engineering/{draft,rfc,adr}/`     | `docs/engineering/design/` 或 `docs/engineering/spec/`         | 旧版把过程阶段当成了目录。按正文内容分流：讲具体模块/系统实现进 `design/`，讲跨模块标准/协议/红线进 `spec/`；原目录名转为文首状态 `draft` / `rfc` / `adr`                |
| 同一主题在旧版拆成了 `draft/0001`、`rfc/0002`、`adr/0003` 多份文件                 | `docs/engineering/{design,spec}/`                              | 若历史脉络无需独立保留，合并为最新阶段的一篇单文件；若需保留演进历史，均迁入同模式目录按序编号，旧文状态标为 `superseded` 并双向互链                                     |
| 散落的调研对比、外部标准分析、竞品拆解（如 `docs/research/`、`docs/notes/`）       | `docs/engineering/research/`                                   | 迁入 `research/`，按独立序列取号 `NNNN-<scope>-<title>.md`，文首只保留 `调研日期` 与 `Scope`，删除过程状态字段                                                           |
| 散落的运维手册、部署步骤、排障 SOP（如 `docs/ops/`、`docs/runbooks/`）             | `docs/engineering/runbook/`                                    | 迁入 `runbook/`，按独立序列取号，状态设为 `draft`（待验证）或 `active`（已线上使用）                                                                                     |
| 散落的 `.html` 报告、架构图、复盘网页或 `.svg` 高级渲染图                          | `docs/reader/`                                                 | 先通过 `docs-adventure-init` 启用 `docs/reader/`，文件改名为 `<kebab-case>.{html,svg}`，在 `docs/reader/README.md` 登记                                                  |
| AI 留存的实现备忘、调试脉络、深水区踩坑笔记（不宜归入 `engineering` 四大正式模式） | `docs/develop/`                                                | 先通过 `docs-adventure-init` 启用 `docs/develop/`，文件改名为 `<kebab-case>.md`，**移除任何过程状态字段**，在 `docs/develop/README.md` 登记                              |

## 2. 状态值归一化映射表

| 旧状态值 / 缺失情况                                 | 目标模式             | 归一化后的规范状态                  | 说明                                                   |
| --------------------------------------------------- | -------------------- | ----------------------------------- | ------------------------------------------------------ |
| 任意状态值（如 `status: done`、`状态：draft`）      | `research`           | **删除状态字段**                    | `research` 是直接事实结果，只记 `调研日期：YYYY-MM-DD` |
| 任意状态值                                          | `develop` / `reader` | **删除状态字段**                    | `develop` 与 `reader` 明确不保留记录状态               |
| `open`、`wip`、`todo`、`init`、或缺失状态           | `design` / `spec`    | `draft`                             | 映射为起草初始态                                       |
| `proposed`、`review`、`in-review`、`discussion`     | `design` / `spec`    | `rfc`                               | 映射为提案描述/评审态                                  |
| `accepted`、`approved`、`final`、`frozen`、`locked` | `design` / `spec`    | `adr`                               | 映射为定稿约束态（须确认原文档确已拍板定稿）           |
| `open`、`wip`、或缺失状态                           | `runbook`            | `draft`                             | 映射为编写待验态                                       |
| `valid`、`online`、`production`、`approved`         | `runbook`            | `active`                            | 映射为现行有效态                                       |
| `obsolete`、`archived`、`retired`                   | `runbook`            | `deprecated`                        | 映射为已停用态                                         |
| `open`、`todo`、`proposed`                          | `plan`               | `draft`（留在 `docs/plan/`）        | 起草态计划                                             |
| `approved`、`scheduled`                             | `plan`               | `ready`（留在 `docs/plan/`）        | 就绪待执行计划                                         |
| `doing`、`active`、`wip`、`running`                 | `plan`               | `in-progress`（留在 `docs/plan/`）  | 进行中计划                                             |
| `completed`、`finished`、`closed`、`archived`       | `plan`               | `done`（移入 `docs/plan/archive/`） | 已完结归档计划                                         |

## 3. 各模式标准章节骨架对齐表

在规范化正文结构时，将旧文档的章节归拢到对应模式的标准二级标题下，**保留全部原始技术细节、表格、代码块与证据链接**：

| 目标模式   | 文首元信息格式                                                                | 标准二级标题骨架（按序）                                                                                        |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `research` | `> 调研日期：YYYY-MM-DD · Scope：<scope>`                                     | `## 背景` → `## 发现` → `## 结论` → `## 参考`                                                                   |
| `design`   | `> 状态：draft\|rfc\|adr · 日期：YYYY-MM-DD · Scope：<scope>`                 | `## 目标与边界` → `## 工作方式` → `## 数据与接口` → `## 异常与兼容` → `## 备选与取舍` → `## 验证` → `## 待确认` |
| `spec`     | `> 状态：draft\|rfc\|adr · 日期：YYYY-MM-DD · Scope：<scope>`                 | `## 适用范围与背景` → `## 规范条款` → `## 正反例与边界` → `## 合规与后果` → `## 否决项` → `## 待确认`           |
| `runbook`  | `> 状态：draft\|active\|deprecated · 日期：YYYY-MM-DD · Scope：<scope>`       | `## 触发条件与现象` → `## 前置检查` → `## 执行步骤` → `## 止血与回滚` → `## 恢复验证`                           |
| `plan`     | `> 状态：draft\|ready\|in-progress\|done · 日期：YYYY-MM-DD · Scope：<scope>` | `## 目标与范围` → `## 前置条件与风险` → `## 分阶段计划` → `## 迁移与回滚` → `## 验收与归档标准`                 |
| `develop`  | `> 更新日期：YYYY-MM-DD · 关联模块：<module>`（无状态字段）                   | 自由结构（推荐：`## 背景与问题` → `## 核心机制与脉络` → `## 踩坑与关键细节`）                                   |
