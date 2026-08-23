# Deep Init 根位置可选文档目录

AGENTS.md 回答「AI 在这里怎么干活」，但一个完整仓库的根位置还有一类
**生态位文档**——各自服务不同读者（人类贡献者、社区、法务、发布流程）。
本目录给出取舍信号与最小骨架，供第 5 步盘点时对照。

## 目录

- [取舍总则](#取舍总则)
- [信号 → 候选文档速查](#信号--候选文档速查)
- [ARCHITECTURE.md · 架构约束](#architecturemd--架构约束)
- [社区与协作类](#社区与协作类)
- [发布与合规类](#发布与合规类)
- [决策记录类](#决策记录类)

---

## 取舍总则

1. **缺省不生成。** 只在信号命中且用户按 Q4 同意后创建；无信号不打扰；
2. **已存在的只盘点不重写**——这些文档多为人工维护，缺项在回报中提示即可；
3. AGENTS.md 的「模块架构」扩展段保持摘要并指向 ARCHITECTURE.md，不重复展开。

## 信号 → 候选文档速查

| 信号 | 候选文档 | 一句话理由 |
| --- | --- | --- |
| 代码量 ≥1 万行或存在多层/多模块边界 | ARCHITECTURE.md | 新贡献者定位修改点的时间占大头，需要物理架构地图 |
| 接受外部 PR / 公开仓库 | CONTRIBUTING.md · CODE_OF_CONDUCT.md | 贡献流程与行为准则是外部协作的前提 |
| 产出可被外部执行的软件 | SECURITY.md | 漏洞报告必须有私密渠道，不能走公开 issue |
| 有版本化发布（库/工具） | CHANGELOG.md | 变更历史是升级决策的唯一可信来源 |
| 多个维护者或组织背书 | GOVERNANCE.md · CODEOWNERS | 决策权与评审路由要成文，避免口头政治 |
| 提供社区问答渠道 | SUPPORT.md | 把求助引到正确的地方，保护 issue 区干净 |
| 分发制品包含第三方代码 | NOTICE / THIRD-PARTY-NOTICES.md | 许可证合规要求 |
| 学术用途软件 | CITATION.cff | 让引用格式机器可读 |
| 需要赞助的开源项目 | FUNDING.yml | GitHub 端展示赞助按钮的标准位 |

GitHub Community Standards 官方清单（README、License、Code of conduct、
Contributing、Issue/PR 模板、Security policy）可作为开源项目的及格线自查。

## ARCHITECTURE.md · 架构约束

**定位**：面向所有贡献者的物理架构地图与长期约束，回答「做 X 该去哪改」和
「我看到的这层不许做什么」。matklad（rust-analyzer 作者）建议 1 万行以上、
README 与 CONTRIBUTING 旁边常备此文件。

**最小骨架**：

```markdown
# 架构总览

## 解决什么问题
鸟瞰一段：系统为谁解决什么问题，外部依赖是什么。

## Codemap
| 模块 | 职责 | 关键符号 |
| --- | --- | --- |
（粗粒度模块 + 关系；只列名字不放链接）

## 边界与不变量
- 层 A 不得引用层 B（缺席性约束：代码里"没有出现"的规则必须写下来）
- 模块 X 是唯一允许触碰 Y 的入口

## 横切关注点
日志、错误处理、配置加载、并发模型的统一约定。
```

**写作纪律**（源自 matklad）：

- 保持短小——每个常规贡献者都要读它；
- 只写**不常变化**的内容，不追求与代码同步，每年回顾几次即可；
- 点名重要模块与类型但**不放超链接**——链接会腐烂，名字配合符号搜索永不失效；
- 重点写清「缺席」与「边界」：好的边界在代码里几乎不可见，恰恰最需要成文。

**与根 AGENTS.md 的分工**：ARCHITECTURE.md 是给人类的完整约束文本；
根 AGENTS.md「模块架构」段只放摘要 + 指向它的引用行。

## 社区与协作类

| 文档 | 最小内容 | 参考标准 |
| --- | --- | --- |
| CONTRIBUTING.md | 本地开发步骤、分支与 commit 规范、PR 流程、DCO/CLA 要求 | 各大基金会贡献指南惯例 |
| CODE_OF_CONDUCT.md | 行为准则与举报渠道 | Contributor Covenant v2.1 |
| SUPPORT.md | 问询渠道优先级（讨论区/IM/issue） | GitHub 默认社区健康文件 |
| GOVERNANCE.md | 决策机制、角色与晋升、争议处理 | opensource.guide 治理篇 |
| CODEOWNERS | 目录 → 必需评审人映射（置于 `.github/`） | GitHub 官方语法 |

## 发布与合规类

| 文档 | 最小内容 | 参考标准 |
| --- | --- | --- |
| CHANGELOG.md | 按「新增/变更/弃用/移除/修复/安全」分组记录每个版本 | Keep a Changelog 1.1 + SemVer |
| SECURITY.md | 私密漏洞上报渠道、响应时限、支持版本范围 | GitHub 官方安全策略格式 |
| NOTICE / THIRD-PARTY-NOTICES.md | 第三方组件清单及其许可证 | Apache-2.0 NOTICE 惯例 |
| CITATION.cff | 作者、标题、DOI、引用格式 | Citation File Format 规范 |
| FUNDING.yml | 赞助平台与账户 | GitHub Sponsors 配置格式 |

## 决策记录类

**`docs/adr/`（架构决策记录）**：把「为什么这样设计」从口头记忆变成编号档案，
每条记录背景、决策、后果。格式可选 Michael Nygard 原始模板或 MADR；
本仓库 `plugins/engineering-design` 的五阶段文档体系即是落地范例，
生成时可直接引导用户安装该插件承接后续写作。
