<!-- 示范样例：docs-move 在确认阶段与完工阶段向用户输出的报告格式 -->

# 文档迁移与规范化回报样例

## 1. 阶段 A：迁移与重构确认对照表（动手前展示给用户）

```markdown
# 文档迁移与规范化方案 · 待确认

共盘点出 **5 处**旧版或不规范文档/目录，拟按以下对照表迁移并重构为当前规范样式：

| #   | 原路径                                           | 目标路径与新命名                                                   | 元信息转换                                                                          | 章节骨架规范化要点                                                                                                                 |
| --- | ------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `plan/README.md` 及 `plan/0001-build-rollout.md` | `docs/plan/README.md` 及 `docs/plan/archive/0001-build-rollout.md` | 状态 `completed` → `done`                                                           | 顶层 `plan/` 迁入 `docs/plan/`；状态已完结故移入 `docs/plan/archive/`，文内 `../docs/engineering/` 链接改为 `../../engineering/`   |
| 2   | `docs/rfc/auth-session-redesign.md`              | `docs/engineering/design/0001-auth-session-redesign.md`            | 旧目录 `rfc/` + `status: proposed` → `> 状态：rfc · 日期：2026-08-12 · Scope：auth` | 原「方案概述 / 接口变更 / 风险」归拢为 `design` 标准七节（目标与边界、工作方式、数据与接口、异常与兼容、备选与取舍、验证、待确认） |
| 3   | `docs/adr/002-error-code-standard.md`            | `docs/engineering/spec/0001-api-error-code-standard.md`            | 旧目录 `adr/` + `status: accepted` → `> 状态：adr · 日期：2026-07-20 · Scope：api`  | 原「背景 / 决定 / 后果」重构为 `spec` 标准六节（适用范围与背景、规范条款、正反例与边界、合规与后果、否决项、待确认清零）           |
| 4   | `docs/architecture-overview.html`                | `docs/reader/architecture-overview.html`                           | 无状态（直读 HTML）                                                                 | 启用 `docs-adventure-init`，迁入 `docs/reader/` 并在 `docs/reader/README.md` 登记                                                  |
| 5   | `docs/notes/parser-edge-cases.md`                | `docs/develop/parser-edge-cases.md`                                | 移除原 `状态：draft`，改为 `> 更新日期：2026-09-01 · 关联模块：parser`              | AI 踩坑备忘迁入 `docs/develop/`，保留全部边界用例并在 `docs/develop/README.md` 登记                                                |

请确认是否按上表执行迁移与样式整理？
```

---

## 2. 阶段 B：迁移完成账单（执行并复验后输出）

```markdown
# 文档迁移与规范化完成报告

## 1. 目录与文件迁移清单

- `plan/` → `docs/plan/`（已清理根级空目录 `plan/`）
  - `plan/0001-build-rollout.md` → `docs/plan/archive/0001-build-rollout.md`（状态：`done`）
- 旧阶段目录清理：`docs/rfc/`、`docs/adr/`、`docs/notes/` 已归并并移除空目录
  - `docs/rfc/auth-session-redesign.md` → `docs/engineering/design/0001-auth-session-redesign.md`（状态：`rfc`）
  - `docs/adr/002-error-code-standard.md` → `docs/engineering/spec/0001-api-error-code-standard.md`（状态：`adr`）
- 高级扩展目录（`docs-adventure-init`）：
  - `docs/architecture-overview.html` → `docs/reader/architecture-overview.html`
  - `docs/notes/parser-edge-cases.md` → `docs/develop/parser-edge-cases.md`（无状态）

## 2. 引用重链与索引同步

- 修正文内相对路径链接 6 处；
- 同步更新 `docs/README.md`、`docs/plan/README.md`、`docs/reader/README.md`、`docs/develop/README.md`。

## 3. `docs-clean` 复验结果

- 运行 `scan_docs.mjs --skip-http`：`error: 0, warning: 0`（受控文档编号连续、状态合法、索引完整）。
```
