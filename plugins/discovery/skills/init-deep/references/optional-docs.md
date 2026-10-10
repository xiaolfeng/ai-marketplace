# 根位置可选公约目录

`INITDEEP.md` 负责项目知识导航；面向贡献者、社区、法务和发布流程的文档按需建档。
架构约束由 [`init-arch`](../../init-arch/SKILL.md) 管理。以下是 Q4 盘点时的候选。

## 目录

- [取舍总则](#取舍总则)
- [信号 → 候选文档速查](#信号--候选文档速查)
- [社区与协作类](#社区与协作类)
- [发布与合规类](#发布与合规类)
- [决策记录类](#决策记录类)

---

## 取舍总则

1. **按需生成。** 命中信号后依 Q4 征求同意；
2. **已有文件只盘点。** 保留人工维护内容，在回报中报告缺项。

## 信号 → 候选文档速查

| 信号 | 候选文档 | 一句话理由 |
| --- | --- | --- |
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
