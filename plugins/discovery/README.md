# discovery

项目探索与知识库构建插件。让 AI Agent 快速「看懂」一个陌生项目——为项目生成分层的结构化认知文档。

## 包含技能

### deep-init

项目知识库分层初始化器，v0.0.2 起按 Agent Skills 官方最佳实践重构为
「脚本保底 + AI 只做判断」的执行器形态：

- **确定性操作脚本化**：`scripts/scan.mjs` 采集 git 状态、存量盘点与增量 diff 摘要，
  `scripts/validate.mjs` 校验标记、段落完整性、链接可达性与编码，形成生成→校验→修复的闭环；
- **由内到外的分层策略**：最深层子目录先写、根目录最后收口，上层引用下层不回改；
- **渐进披露**：SKILL.md 只留主流程（≤150 行），模板、边界手册下沉 `references/`，
  黄金样例放 `examples/` 对齐产出质量；
- **人工内容保护**：无同步标记的存量文件视为人工维护，改写前必须问询；CLAUDE.md 永不静默覆盖；
- **幂等增量同步**：首行 `<!-- deep-init:synced@<hash> -->` 标记是增量范围的唯一依据；
- **可选文件扩展**：根收口时按信号盘点两类可选文件，经用户勾选后才生成、缺省不打扰：
  开源公约类（ARCHITECTURE.md 架构约束、CHANGELOG、SECURITY 等）与
  面向 AI 的定制规则类（多工具适配层、约定三层模型、AI 忽略清单），
  取舍表见 `references/optional-docs.md` 与 `references/ai-rules.md`；
- 全中文编写（可跟随项目文档语言），并在根目录同步极简 `CLAUDE.md`（`@AGENTS.md` 单行引用）。

评测场景见 [evals/evals.json](skills/deep-init/evals/evals.json)，可用官方
skill-creator 插件跑基线对比与触发率测试。

## 安装

```bash
# Claude Code
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install discovery@ai-marketplace

# 或任意支持 Agent Skills 的工具
npx skills add xiaolfeng/ai-marketplace --skill deep-init
```

## 使用

在目标项目里对 AI 说「初始化知识库」或「deep init」即可触发；也可显式调用：

```bash
/discovery:deep-init
```
