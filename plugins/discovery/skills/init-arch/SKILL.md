---
name: init-arch
description: >
  初始化或迭代项目架构层约束：梳理真实模块依赖，编写根 ARCHITECTURE.md 与按需拆分的
  docs/architecture/<layer>.md，并维护根 AGENTS.md 的简短架构入口。用户说
  「初始化架构」「梳理架构约束」「分层架构文档」「init-arch」「更新架构地图」时使用。
  目录知识索引由 init-deep 管理。
compatibility: Requires filesystem access
license: MIT
metadata:
  version: "0.0.4"
---

# Init Arch · 架构层约束

把真实存在的组件关系、依赖方向和跨层边界写成可按需阅读的架构文件。根 `ARCHITECTURE.md` 负责层级总览；有独立约束的层级在 `docs/architecture/<layer>.md` 展开。入口规则复用 [../_shared/agents-entry.md](../_shared/agents-entry.md)，目录导航由 `/init-deep` 管理。

## 执行

1. 阅读 README、构建配置、模块边界、关键调用和测试，盘点既有 `ARCHITECTURE.md`、`docs/architecture/`、根 `AGENTS.md` 与 `INITDEEP.md`。用实际的 import、接口或运行路径佐证层级与依赖方向；不从文件夹名称臆造架构。
2. 确定需要文档化的层级及跨层规则。每个约束写清「允许/禁止的依赖或调用、原因、验证办法或违反时的信号」。已有文档归属更明确时沿用其路径；需要独立维护的层级才拆成 `docs/architecture/<layer>.md`。不适合固化的实现细节留在源码或具体设计稿。
3. 按 [架构模板](references/architecture.md) 写根总览和层级文件：根文件只列模块职责、依赖方向、层级文件入口和跨层不变量；层级文件记录本层边界、调用入口、数据流及可执行检查。已有人工文件先合并建议、获取授权再修改；已有冲突约束需由用户决定。
4. 更新根 `AGENTS.md` 的架构入口行：简述何时看架构总览，沿其链接读取哪层文件。若 `INITDEEP.md` 存在，保留原有入口；不存在时先留下架构入口，后续由 `/init-deep` 补目录索引。修改人工入口前按公共规范征得确认。
5. 检查相对链接指向真实文件；对照代码验证每条关键边界并运行适用的构建或测试。回报文档路径、边界证据、未证实或待裁决的规则；不要把未验证的猜想写成既定约束。

## 输出边界

- `AGENTS.md` 是轻量项目入口，详细架构留在 `ARCHITECTURE.md` 与按需拆分的层级文件；架构文件与 `INITDEEP.md` 之间使用普通 Markdown 链接。
- 保留已有 `CLAUDE.md` 和各级 `AGENTS.md`；根入口的人工内容需要缩减或冲突合并时先给出差异草案等待确认。
- 架构层级只有一个且约束很少时，根总览足够。每增加一份层级文件，都在根总览登记入口与适用情境。

完整形式见 [examples/sample.md](examples/sample.md)。
