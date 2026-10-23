# 公共约定：流转与状态机

写作技能、`docs-init`、`docs-adventure-init`、`docs-clean` 与 `docs-move` 共用本文件。

## 模式流转与过程阶段

在新架构中，**文档模式（写什么体裁）**与**过程阶段（走到哪一步）**正交解耦：

- `rfc`（提案描述/评审）与 `adr`（定稿约束/冻结）是文档内部的**演进阶段**，不再拆成独立目录或独立文件；
- 同一篇 `design` 或 `spec` 从起草到定稿始终留在原文件内，随评审推进文首状态与正文收敛度。

```text
research (调研模式 · 直接结果，无状态)
   │
   ├──► design  (设计模式 · 单文件原位演进：draft ──► rfc [描述/评审] ──► adr [约束/定稿])
   │       │
   │       ├──► plan    (实施计划 · docs/plan/ 平铺：draft ──► ready ──► in-progress ──► archive/: done)
   │       └──► runbook (运维手册 · 状态演进：draft ──► active ──► deprecated)
   │
   └──► spec    (规范模式 · 单文件原位演进：draft ──► rfc [描述/评审] ──► adr [约束/定稿])

[高级扩展 · 无状态流转]
  • develop (docs/develop/ · AI 工程信息备忘，不保留记录状态)
  • reader  (docs/reader/  · 用户直读 .html 界面与高级渲染图，无状态)
```

## 状态机

| 模式     | 合法状态                                                                | 新建默认 | 阶段与存储规则                                                                                                                       |
| -------- | ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| research | 无状态；头部记调研日期                                                  | —        | 直接沉淀客观事实与证据，方案判断写「倾向」，不设状态字段                                                                             |
| design   | `draft` → `rfc` → `adr` / `rejected` / `superseded`                     | `draft`  | 同文件演进：`draft` 起草 → `rfc` 提案评审 → `adr` 锁定约束                                                                           |
| spec     | `draft` → `rfc` → `adr` / `rejected` / `superseded`                     | `draft`  | 同文件演进：`draft` 起草 → `rfc` 提案评审 → `adr` 锁定约束                                                                           |
| runbook  | `draft` → `active` → `deprecated` / `superseded`                        | `draft`  | `draft` 编写待验 → `active` 经实测/演练现行有效 → `deprecated` 停用                                                                  |
| plan     | `draft` → `ready` → `in-progress` → `done` / `cancelled` / `superseded` | `draft`  | 活动态（`draft` / `ready` / `in-progress`）平铺于 `docs/plan/`；终态（`done` / `cancelled` / `superseded`）移入 `docs/plan/archive/` |
| develop  | 无状态；不保留记录状态                                                  | —        | AI 保留有价值的工程脉络/机制备忘（不便归入 `engineering` 四模式的部分），严禁写过程状态字段                                          |
| reader   | 无状态                                                                  | —        | 放置面向用户直读的 `.html` 页面或高级渲染图                                                                                          |

## 阶段演进细则（`design` 与 `spec` 的三阶段）

1. **`draft`（起草阶段）**：
   - 允许存在并列候选思路、待验证假设和留白；重点是把问题边界与初步设计/规则骨架搭起来。
2. **`rfc`（提案描述阶段）**：
   - 方案已收敛为单一主推方向，面向评审人完整描述「做什么、不做什么、备选对比（遵循最强反驳原则）与待确认项」。还有并列方案未决时，先回 `research` 补证据或留在 `draft`。
3. **`adr`（约束定稿阶段）**：
   - 经用户或评审人明确拍板后升级为 `adr`；清零阻塞性「待确认」项，固化长期约束条款、后果、验证口径与重评退出条件。
   - **冻结纪律**：状态一旦进入 `adr`，正文核心决定不可直接篡改；后续若推翻或发生破坏性变更，必须新建一篇同模式文档，并将旧文状态改为 `superseded`，文首双向互链。

## 五条通用纪律

1. **不越权定稿**：新建受控文档一律使用默认初始态 `draft`；升级到 `adr`（design/spec）、`active`（runbook）或 `ready`（plan）必须有人明确确认，技能不得擅自跳级；
2. **状态只表共识或阶段，不替代代码验证**：`design` 进入 `adr` 代表设计约束已冻结，代码是否实现以 `plan` 进度与测试结果为准；
3. **`plan` 终态归档必搬移**：活动中的计划平铺在 `docs/plan/NNNN-<scope>-<title>.md`；状态变为 `done`、`cancelled` 或 `superseded` 时，必须移入 `docs/plan/archive/NNNN-<scope>-<title>.md` 并更新 `docs/plan/README.md`；
4. **跨模式承接靠文首链接**：从 `research` 衍生 `design`/`spec`，或从 `design` 拆解 `plan`/`runbook` 时，在目标目录独立取号，文首写明 `承接 [NNNN](相对路径)`；
5. **旧文不删**：被取代或取消的文档标 `superseded` / `cancelled` 并注明去向链接，保留历史上下文。
