# 项目 Scope 总账

本文件是 ai-marketplace 唯一的 Scope 台账：**Git 提交与工程文档共用同一套
业务域词表**。Scope 即业务域——从项目里分析出的一类业务环境。
目标：项目级可自我管理，防止同义多词的 Scope（如「用户」与「user」）并存。

权威定义见各插件的 `_shared/scope-manage.md`
（[git-manage](../plugins/git-manage/skills/_shared/scope-manage.md) ·
[engineering-design](../plugins/engineering-design/skills/_shared/scope-manage.md)），
本文件只做登记与留存。

## 采用模式

**已采用：2 字中文**（2026-08-23 首次提交时决议）

| 模式 | 提交示例 |
| --- | --- |
| 2 字中文 ✅ | `feat(市场): 初始化清单结构` |
| 4 字中文 | `feat(插件市场): 初始化清单结构` |
| 英文单词 | `feat(marketplace): 初始化清单结构` |

此后所有提交照此取用，不再重复询问；如需变更须显式改写本栏并全仓对齐。
engineering-design 写文档固定取下方词表的英文单词列，不受本模式影响。

## 词表

每个 Scope 三列必须一次填齐——即使当前模式只用其中一列也照填，
避免未来扩展或切换模式时出现歧义。

| 业务域 | 2 字中文 | 4 字中文 | 英文单词 | 覆盖范围 |
| --- | --- | --- | --- | --- |
| 市场清单与分发 | 市场 | 插件市场 | `marketplace` | marketplace.json 与各安装消费方 |
| 插件本体 | 插件 | 插件包 | `plugin` | plugins/ 下插件与其 manifest |
| 技能内容 | 技能 | 技能集 | `skill` | SKILL.md、references、scripts |
| 文档中心 | 文档 | 工程文档 | `docs` | docs/ 目录与写作规范 |
| 构建流水线 | 构建 | 构建脚本 | `build` | 导出脚本与 GitHub Actions |

## 登记纪律

1. 新 Scope 先查上表与 `git log`：任一名字列语义命中即视为同一域，必须复用；
2. 确属新域时三列同时起名，经用户确认后登记为新行；
3. 废弃的 Scope 标注「废弃原因 + 归并去向」，不删除行；
4. 工程文档目录名（draft / research / rfc / design / adr）是生命周期阶段，
   不是 Scope——阶段规则见 conventions / lifecycle，不在此登记。
