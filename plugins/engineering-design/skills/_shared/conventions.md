# 公共约定：目录与编号

写作技能与 doc-clean 共用本文件。
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

- `NNNN`：四位编号，每个阶段目录各自一条序列——rfc 有 rfc 的号，
  adr 有 adr 的号，draft / research / design 同理，互不占用；
- `<scope>`：业务域英文单词，取自项目根 `docs/scope-manage.md` 词表；
- `<title>`：kebab-case 英文短标题。

示例：树洞匿名提案 → `rfc/0003-treehole-anonymous.md`；
同主题定稿可以是 `adr/0001-treehole-anonymous.md`——两条序列互不续号。

## 取号

每个阶段目录单独计数，写哪一类就只看那一类的目录：

1. 只扫描**目标阶段目录**下现有文件的编号（写 RFC 只扫 `rfc/`，
   写 ADR 只扫 `adr/`，其余同理）；
2. 该目录最大值 +1，补零到四位；目录为空则从 `0001` 起；
3. 不复用该目录内的旧编号。同一主题跨阶段时，在目标目录内单独取号，
   不沿用上一阶段的编号，也不去其他目录「续号」。

承接关系写在文首链接里（「承接 [0003](../rfc/0003-xxx.md)」），
不靠跨目录编号相等来表达。RFC `0001` 和 ADR `0001` 可以同时存在，
它们不是同一个号。

## 登记

写完在 `docs/README.md` 的内容清单补一行：编号、链接、状态。
被取代的旧文同步改索引指向新文。
