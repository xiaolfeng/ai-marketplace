---
name: docs-adventure-init
description: >
  工程文档高级增量初始化。先检查 docs/ 基础结构是否就绪（若为空或缺失则先自动调用 docs-init 完成基础初始化），
  再增量创建 docs/reader/（专门放置面向用户直读的 .html 界面或高级渲染图）与 docs/develop/（AI 保留有价值但
  不便归入 engineering 四模式的工程信息记录，不保留记录状态），并同步更新 docs/README.md 与 MAINTENANCE.md。
  用户说「高级初始化」「初始化高级文档」「docs-adventure-init」「添加 reader 和 develop 目录」「/docs-adventure-init」时使用。
---

# docs-adventure-init · 高级文档目录增量初始化

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
基础初始化：[../docs-init/SKILL.md](../docs-init/SKILL.md)

## 模式定位：基础骨架之上的双目录增量扩展

`docs-adventure-init` 专门负责在 `docs-init` 基础结构之上，增量扩展两个轻量高级目录：

| 目录            | 模式定位            | 文件与命名约定                                      | 状态与维护要求                                                                                                                    |
| --------------- | ------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `docs/reader/`  | 直读视图（reader）  | `<kebab-case>.html`（或 `.svg` 等高级渲染图）       | **无状态、不设四位编号**。专门放置给用户直接打开浏览的界面原型、系统架构图、手绘白板图、复盘网页或报告特刊                        |
| `docs/develop/` | 工程备忘（develop） | `<kebab-case>.md`（自由语义命名，不设四位编号序列） | **属于工程文档，但不需要保留记录状态**（严禁写 `状态：draft/rfc/adr`）。供 AI 留存有价值但不宜归入 `engineering` 四模式的工程信息 |

## 目标结构

```text
<project-root>/
└── docs/
    ├── README.md                    # [基础 + 增量] 文档中心索引（含 reader/ 与 develop/ 导航入口）
    ├── engineering/                 # [基础 · docs-init] 工程研发四模式 + MAINTENANCE.md（增量补充高级目录条款）
    ├── plan/                        # [基础 · docs-init] 实施计划看板与 archive/
    ├── reader/                      # [增量 · 本技能] 面向用户直读的 .html 界面与高级渲染图
    │   ├── README.md                # 直读视图索引（登记 HTML 页面与渲染产物）
    │   └── .gitkeep
    └── develop/                     # [增量 · 本技能] AI 无状态工程信息记录
        ├── README.md                # 工程备忘索引（登记 AI 沉淀的工程脉络与机制笔记）
        └── .gitkeep
```

## 操作流程

复制此清单并随做随勾：

```
高级初始化进度：
- [ ] 1. 检查 docs/ 基础结构是否为空或缺失；若缺失，先依赖运行 docs-init 初始化基础目录树
- [ ] 2. 运行 init_adventure_docs.mjs <项目根目录>，增量创建 docs/reader/ 与 docs/develop/ 及其 README.md
- [ ] 3. 幂等更新 docs/README.md 与 docs/engineering/MAINTENANCE.md，挂入 reader/ 与 develop/ 导航与规则
- [ ] 4. 回报「基础初始化补齐项」与「高级增量创建项」
```

### 第 1 步：运行高级初始化脚本（自带基础结构前置检查）

脚本内置前置检查逻辑：若检测到目标项目尚未完成 `docs-init` 基础初始化（如缺少 `docs/engineering/`、`docs/plan/` 或 `docs/README.md`），会**先自动调用 `docs-init` 初始化基础骨架**，随后再执行 `reader/` 与 `develop/` 的增量扩展：

```bash
node <本技能目录>/scripts/init_adventure_docs.mjs <项目根目录>
# 不传参数时默认当前工作目录
```

脚本完全幂等——已存在的目录、索引与段落一律跳过或无损增量追加，绝不覆盖已有文档。

### 第 2 步：核对高级目录与索引模板

- `docs/reader/README.md`：登记面向用户直读的 `.html` 页面或高级渲染图（文件名、用途说明、生成来源/关联文档）；
- `docs/develop/README.md`：登记 AI 留存的无状态工程记录（文件名、主题范围、更新日期）；
- `docs/README.md` 与 `docs/engineering/MAINTENANCE.md`：包含 `docs/reader/` 与 `docs/develop/` 的模式入口与无状态免编号说明。

模板见 [examples/adventure-index.md](./examples/adventure-index.md)。

### 第 3 步：回报

分两栏回报：

1. **基础结构检查与补齐**：基础目录是已就绪，还是先触发了 `docs-init` 补齐；
2. **高级增量扩展**：新建或更新的 `docs/reader/`、`docs/develop/` 及索引文件列表。
