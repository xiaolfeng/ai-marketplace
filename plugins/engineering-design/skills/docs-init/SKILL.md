---
name: docs-init
description: >
  初始化工程文档目录结构。在新项目中搭建 docs/engineering/ 下的
  draft/research/rfc/design/adr 五段式文档体系，或用户说「初始化文档」
  「init docs」「建文档目录」「补齐文档结构」时触发。
  幂等操作，重复执行安全。
---

# docs-init · 文档目录初始化

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md)

## 目标结构

```text
docs/
└── engineering/
    ├── draft/       # 草案（含 .gitkeep）
    ├── research/    # 调研
    ├── rfc/         # 提案
    ├── design/      # 设计（预留）
    └── adr/         # 决策记录
```

索引由 `docs/README.md` 承担，不放在 engineering 内。

## 操作流程

复制此清单并随做随勾：

```
初始化进度：
- [ ] 1. 运行 init_docs.py <项目根目录>，确认五目录 + .gitkeep 就位
- [ ] 2. docs/README.md 不存在时生成最小索引
- [ ] 3. 回报创建清单；全部已存在则说明无需变更
```

### 第 1 步：运行初始化脚本

脚本幂等——目录已存在则跳过，绝不覆盖已有文件：

```bash
python3 scripts/init_docs.py <项目根目录>
# 不传参数时默认当前目录
```

输出为创建结果清单；退出码 0 表示成功。

### 第 2 步：生成最小索引

仅当 `docs/README.md` 不存在时创建，内容为五目录定位表
（从 [../_shared/conventions.md](../_shared/conventions.md) 的目录表复制）。
已存在的索引只追加缺失的目录行，不改既有内容。

### 第 3 步：回报

逐条列出「新建了什么 / 跳过了什么」，并提示后续可用
draft-er → research-er → rfc-er → adr-er 开始写作。

## 成品样例

第 2 步生成的最小索引长什么样见 [examples/minimal-index.md](./examples/minimal-index.md)——
内容与之一致即可，不要自行加章节。
