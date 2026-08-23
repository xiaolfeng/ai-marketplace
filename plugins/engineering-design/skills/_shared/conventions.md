# 公共约定：目录与编号

四个技能（draft-er / research-er / rfc-er / adr-er）共用本文件。
业务域词表见 [scope-manage.md](./scope-manage.md)，目录初始化由
[docs-init](../docs-init/SKILL.md) 负责。

## 目录

工程文档统一落在 `docs/engineering/` 下，目录名表达生命周期阶段：

| 目录 | 阶段 | 回答 |
| --- | --- | --- |
| `docs/engineering/draft/` | 草案 | 现在困惑什么、初步想法有哪些 |
| `docs/engineering/research/` | 调研 | 现状是什么 |
| `docs/engineering/rfc/` | 提案 | 建议采用什么 |
| `docs/engineering/design/` | 设计 | 方向已接受后具体怎样工作（技能待补，目录预留）|
| `docs/engineering/adr/` | 定稿 | 最终决定是什么 |

注意：这五个目录名是**阶段**，不是 Scope——Scope 是文件名里的业务域段，
两者正交，不要混用。

## 命名

`NNNN-<scope>-<title>.md`

- `NNNN`：四位编号，五目录共享一个序列；
- `<scope>`：业务域英文单词，取自项目根 `docs/scope-manage.md` 词表；
- `<title>`：kebab-case 英文短标题。

示例：树洞匿名提案 → `rfc/0003-treehole-anonymous.md`

## 取号

1. 扫描五个目录下全部现有文件的编号；
2. 最大值 +1，补零到四位；
3. 不复用旧编号——同一主题跨阶段也拿新号。

## 登记

写完在 `docs/README.md` 的内容清单补一行：编号、链接、状态。
被取代的旧文同步改索引指向新文。
