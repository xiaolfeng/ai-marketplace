---
name: docs-init
description: >
  初始化工程文档与实施计划目录结构。在新项目中幂等搭建 docs/engineering/{research,design,spec,runbook}
  四模式目录、docs/engineering/MAINTENANCE.md 维护公约、docs/README.md 分模式索引，以及同级
  docs/plan/（含 docs/plan/archive/ 与 docs/plan/README.md），或用户说「初始化文档」「init docs」「建文档目录」
  「补齐文档结构」「/docs-init」时触发。幂等操作，重复执行安全。
---

# docs-init · 文档与计划目录初始化

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md)

## 目标结构

```text
<project-root>/
└── docs/
    ├── README.md                    # 文档中心索引：按模式分区导航 + 分模式台账表
    ├── engineering/
    │   ├── MAINTENANCE.md           # 工程文档维护器公约（命名、取号、状态机、演进与归档铁律）
    │   ├── research/                # 调研模式（含 .gitkeep）
    │   ├── design/                  # 设计模式（含 .gitkeep）
    │   ├── spec/                    # 规范模式（含 .gitkeep）
    │   └── runbook/                 # 手册模式（含 .gitkeep）
    └── plan/                        # 实施计划模式（与 engineering/ 同级）
        ├── README.md                # 实施计划看板（进行中计划 + 已归档计划）
        └── archive/                 # 已归档计划目录（含 .gitkeep）
```

（若还需要创建面向用户直读的 `.html`/高级渲染图目录 `docs/reader/` 与无状态 AI 工程记录目录 `docs/develop/`，请进一步调用 [`docs-adventure-init`](../docs-adventure-init/SKILL.md)。）

## 操作流程

复制此清单并随做随勾：

```
初始化进度：
- [ ] 1. 运行 init_docs.mjs <项目根目录>，幂等创建目录树、MAINTENANCE.md 与最小索引
- [ ] 2. 若 docs/README.md 或 docs/plan/README.md 已存在但缺某模式分区，按 minimal-index.md 追加缺失段落（不改既有内容）
- [ ] 3. 回报创建与跳过清单，提示后续可用 research-er / design-er / spec-er / runbook-er / plan-er（或 docs-adventure-init 扩展高级目录）
```

### 第 1 步：运行初始化脚本

脚本完全幂等——已存在的目录与文件一律跳过，绝不覆盖已有内容：

```bash
node <本技能目录>/scripts/init_docs.mjs <项目根目录>
# 不传参数时默认当前工作目录
```

输出为新建项清单；退出码 `0` 表示成功。

### 第 2 步：核对索引与维护公约

- `docs/engineering/MAINTENANCE.md`：定义命名、独立取号、各模式状态机与维护铁律；
- `docs/README.md`：按顶层模式 + 工程四子模式分表组织；
- `docs/plan/README.md`：按「进行中计划（平铺于 `docs/plan/`）」与「已归档计划（`docs/plan/archive/`）」分表组织。

模板见 [examples/minimal-index.md](./examples/minimal-index.md)。

### 第 3 步：回报

逐条列出「新建了什么 / 跳过了什么」，并提示后续可按模式调用 `research-er`、`design-er`、`spec-er`、`runbook-er`、`plan-er` 开始写作。
