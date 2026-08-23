---
name: research-er
description: >
  写调研笔记时使用。调研外部标准、技术机制、竞品方案，
  或用户说「调研一下」「看看 X 是怎么实现的」「对比几个方案」时触发。
  只记录现状与证据，不做决策。
---

# research-er · 调研笔记

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

## 操作流程

复制此清单并随做随勾：

```
调研进度：
- [ ] 1. 明确核心问题（一句话写不出来就还没想清楚）
- [ ] 2. 收集证据：官方文档 / 源码实测 / 二手资料
- [ ] 3. 按骨架成文，对照 writing-style.md 过一遍语言
- [ ] 4. 取号命名 NNNN-research-<title>.md，落盘 docs/engineering/research/
- [ ] 5. 登记 docs/README.md，回报路径
```

## 文档骨架

```markdown
> 调研日期：YYYY-MM-DD（承接 [NNNN](./NNNN-xxx.md)，如有）

## 背景
为什么调研。核心问题一句话。

## 发现
主体。机制拆解、字段表、兼容矩阵。每个关键论断带出处链接或实测依据。

## 结论
事实结论直接下；方案判断写「倾向：…」——拍板是 rfc 的事。
没查清的列为开放问题。

## 参考
真正引用过的链接，一行一条。
```

## 自由度

- 出处标注和「倾向/结论」区分是死命令；
- 章节顺序可按内容微调，但四块不可缺；
- 行文语气按 writing-style.md 的原则自由发挥。

## 好坏对照

动笔前读一份同文体的完整对照示例：
[references/example.md](./references/example.md)。里面有一段合格调研和它对应的坏版本，
注意坏版本输在哪里——空话、无出处、判断越界。
