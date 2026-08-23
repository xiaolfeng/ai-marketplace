---
name: deep-init
description: >
  项目知识库分层初始化器。分析项目结构，从内到外生成分层 AGENTS.md 知识库，
  并在根目录同步 CLAUDE.md 极简引用。幂等操作：重复执行时基于同步标记做增量更新。
  当用户说"初始化项目"、"生成 AGENTS.md"、"初始化知识库"、"deep init"、
  "分析项目结构写文档"、"更新 AGENTS.md"、"重建知识库"、
  或任何涉及为项目生成分层文档/AI 知识库的请求时触发。
  也适用于项目结构发生较大变化后需要同步更新知识库的场景。
  即使未明确提及"AGENTS.md"，只要用户想为项目建立 AI 可读的结构化认知文档，
  就应使用此技能。
compatibility: Requires git and Node.js >= 18
license: MIT
metadata:
  version: "0.0.3"
---

# Deep Init · 项目知识库分层初始化

为任意项目生成分层 `AGENTS.md` 知识库：最深层子目录先写、根目录最后收口，
上层通过「引用」段链接下层，保证概括准确无回改。

本技能是**执行器**：脚本负责采集与校验等确定性操作，你只负责两件需要判断力的
事——决定哪些目录值得分层、把每份知识库写到真实可信。

## 资源地图

| 需要什么 | 去哪里 |
| --- | --- |
| 同步标记格式与两套正文模板 | [references/templates.md](references/templates.md) |
| 边界情况处置手册 | [references/edge-cases.md](references/edge-cases.md) |
| 根位置可选文档（ARCHITECTURE 等）的取舍与骨架 | [references/optional-docs.md](references/optional-docs.md) |
| AI 定制规则的分层归属与多工具同步策略 | [references/ai-rules.md](references/ai-rules.md) |
| 成品长什么样（黄金样例） | [examples/root-agents.md](examples/root-agents.md) · [examples/submodule-agents.md](examples/submodule-agents.md) |

## 执行流程

复制此清单随做随勾：

```
Deep Init 进度：
- [ ] 1. scan.mjs 采集现状
- [ ] 2. 判定分层节点
- [ ] 3. 由内到外逐层生成
- [ ] 4. validate.mjs 校验通过
- [ ] 5. 同步 CLAUDE.md 并回报
```

### 第 1 步 · 采集现状

```bash
node <skill_dir>/scripts/scan.mjs <项目根目录>
```

`<skill_dir>` 为本技能所在目录（Claude Code 中可用 `${CLAUDE_SKILL_DIR}`）。
输出 JSON 含 git 状态、存量 `AGENTS.md` 盘点（含同步标记与增量 diff 摘要）、
顶层结构与语言分布——分层判定与增量范围的事实依据全在这里，不要凭印象重扫。

### 第 2 步 · 判定分层节点

对每个候选目录回答一个问题：它是否有**独立的架构约定**，以至于 AI 在其中
工作时需要一份就地导航？

| 信号 | 结论 |
| --- | --- |
| 有自己的分层模式或编码约定，与项目其他部分不同 | 分层 |
| 子目录各自成体系（≥3 个可独立描述的子系统） | 分层 |
| 只是同类文件的集合，或完全遵循上层规则 | 不分层，交给上层约束 |

阈值为经验值而非硬线：4 个文件但承载核心约定的目录值得分层；
20 个文件的扁平工具目录可能不值得。拿不准时不分层——少而准胜过多而滥。

### 第 3 步 · 由内到外逐层生成

从最深层待分层目录开始，按模板（[references/templates.md](references/templates.md)）
逐层写出直到根目录，动笔前先读一遍黄金样例对齐口吻与信息密度：

- 内容必须来自对代码的真实阅读，禁止编造符号或路径；
- 约定要写「为什么」而不止「是什么」——不解释理由的约束 AI 记不住；
- 语言跟随项目既有文档语言，无既有文档时用中文；
- 每份文件第一行写入同步标记（格式见 templates.md）。

**更新场景**：以第 1 步的 `diffSinceMarker` 为准只重写受影响段落，未受影响
段落保留原有表述；diff 为空字符串的 scope 直接跳过；哈希失效按 E3 处置。

### 第 4 步 · 校验闭环

```bash
node <skill_dir>/scripts/validate.mjs <项目根目录>
```

退出码非 0 时按报错逐条修复后重跑，全部通过才允许进入下一步。
WARN 属提醒：确属不需要的段落可忽略，但要在回报中说明。

### 第 5 步 · CLAUDE.md、可选文档与回报

根目录 `CLAUDE.md` 应为一行 `@AGENTS.md`；已存在且内容不同时按 Q1 问询，
**禁止静默覆盖**。

**可选文件盘点**：按两份目录检查根位置——开源公约类见
[references/optional-docs.md](references/optional-docs.md)（ARCHITECTURE.md、CHANGELOG.md
等），面向 AI 的定制规则类见 [references/ai-rules.md](references/ai-rules.md)
（多工具适配层、约定三层模型、AI 忽略清单）。命中信号才按 Q4 一次性征求
用户勾选，同意后才生成；已存在的只盘点不重写；无信号不打扰。完成后报告：

1. 新建/更新的文件路径清单；
2. 校验结果与当前同步标记哈希；
3. 跳过或降级的部分及原因。

## 安全护栏

1. **绝不静默覆盖人工内容。** 无同步标记的存量 `AGENTS.md` 视为人工维护（E2/Q2）；
   已有人工内容的 `CLAUDE.md` 受同一原则保护（Q1）。
2. **只写 Markdown。** 本技能唯一的写入物是 `*.md` 文件与首行标记注释，不动任何代码。

## 问询协议

唯一允许提问的封闭清单，之外一律直接执行：

| 编号 | 触发情形 | 动作 |
| --- | --- | --- |
| Q1 | 根目录已有 `CLAUDE.md` 且内容 ≠ `@AGENTS.md` | 三选一：保留不动（推荐）/ 追加一行引用 / 覆盖重写 |
| Q2 | 存量 `AGENTS.md` 无同步标记 | 三选一：另存 deep-init 版本 / 征得同意后改造并入 / 放弃该文件 |
| Q3 | 目标不是 git 仓库 | 说明增量能力不可用：降级继续（不写标记）或先 `git init` |
| Q4 | 根位置命中可选文件信号 | 候选来自 [references/optional-docs.md](references/optional-docs.md)（公约类）与 [references/ai-rules.md](references/ai-rules.md)（AI 定制类），多选一次问完 |

问询用带选项的多选题形式一次一个，选项附影响说明并标注推荐项；得到答复立即继续，
不复述、不再二次确认。

## 边界情况

遇到下列信号先读 [references/edge-cases.md](references/edge-cases.md) 对应条目再行动：
标记哈希不在当前历史 → E3 · gitignore 目录 → E4 · monorepo 局部根 → E5 ·
指定输出语言 → E6 · 超大目录 → E7。

## 自检

- [ ] 所有生成/更新的 `AGENTS.md` 首行带同步标记，且 validate.mjs 退出码为 0
- [ ] 更新场景中未受影响的段落保留了原有表述
- [ ] 没有覆盖任何人工内容（Q1/Q2 均走了问询）
- [ ] 各级引用段的相对链接全部真实可达
- [ ] 可选文件严格按 Q4 勾选结论生成，快照型导出物带生成标记，未凭空添置
- [ ] 回报包含文件清单、校验结果、同步哈希三项
