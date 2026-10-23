<!-- 成品样例：docs-adventure-init 生成的高级目录索引与增量片段 -->

## 1. `docs/reader/README.md` 最小模板

```markdown
# 直读视图与渲染中心（Reader）

本目录专门存放面向用户直接打开浏览的 `.html` 界面、报告特刊、交互复盘页与高级渲染图（如系统架构全景图、手绘白板流转图等）。

- **命名约定**：使用语义化 `<kebab-case>.html`（或 `.svg`），不设四位数字编号，不设过程状态；
- **维护要求**：新增或更新可视化文件后，在下方台账登记文件名、展示内容与关联的工程文档。

## 视图台账

| 文件 | 类型 | 说明 | 关联文档 / 来源 |
| ---- | ---- | ---- | --------------- |
```

---

## 2. `docs/develop/README.md` 最小模板

```markdown
# 工程备忘录（Develop）

本目录属于工程文档扩展区，专门用于 AI 保留有价值的工程信息记录（如模块内部机制脉络、深水区踩坑笔记、复杂调试链路、实现细节备忘等——即有长期参考价值、但不宜归入 `docs/engineering/{research,design,spec,runbook}` 四大受控模式的内容）。

- **无状态记录**：本目录文档**不需要保留记录状态**（严禁在文首写 `状态：draft/rfc/adr` 等过程状态字段），仅需在文首注明更新日期与涉及范围；
- **命名约定**：使用语义化 `<kebab-case>.md`，不强制四位数字编号，不纳入编号连续性检查。

## 备忘台账

| 文档 | 涉及模块 / Scope | 内容提要 | 更新日期 |
| ---- | ---------------- | -------- | -------- |
```

---

## 3. 向 `docs/README.md` 增量追加的导航行与入口

在 `docs/README.md` 的「模式导航」表末尾追加：

```markdown
| **高级扩展模式**（`docs/reader/`） | [直读视图 `./reader/README.md`](./reader/README.md) | 面向用户直接浏览的 `.html` 界面、架构渲染图与交互报告 | 无状态（自由命名） |
| **高级扩展模式**（`docs/develop/`） | [工程备忘 `./develop/README.md`](./develop/README.md) | AI 留存的高价值工程脉络与机制记录（不便归入 `engineering` 的部分） | 无状态（不保留记录状态） |
```

---

## 4. 向 `docs/engineering/MAINTENANCE.md` 增量追加的第 4 节

```markdown
## 4. 高级扩展目录（`docs/reader/` 与 `docs/develop/`）

通过 `docs-adventure-init` 启用的两个高级目录遵循轻量自治规则：

1. **`docs/reader/`（直读视图）**：专门放置面向用户直接查看的 `.html` 页面或高级渲染图，采用 `<kebab-case>.html` 命名，不设四位编号与状态字段，在 [`../reader/README.md`](../reader/README.md) 登记；
2. **`docs/develop/`（工程备忘）**：属于工程文档，用于 AI 记录有留存价值但不宜放入 `engineering` 四模式的工程信息，**不需要保留记录状态**（禁止写 `状态：...`），采用 `<kebab-case>.md` 命名，在 [`../develop/README.md`](../develop/README.md) 登记。
```
