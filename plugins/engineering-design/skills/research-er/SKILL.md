---
name: research-er
description: >
  写调研笔记（docs/engineering/research/）时使用。调研外部标准、技术机制、竞品方案，
  或用户说「调研一下」「看看 X 是怎么实现的」「对比几个方案」「/research-er」时触发。
  只记录现状与证据，直接产出调研结果（无过程状态），方向判断标「倾向」而不直接拍板。
---

# research-er · 调研模式

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

## 操作流程

复制此清单并随做随勾：

```
调研进度：
- [ ] 1. 明确核心问题（一句话写不出来就还没想清楚）
- [ ] 2. 收集证据：官方文档 / 源码实测 / 二手资料（对比时严格遵循最强反驳原则，一手出处优先）
- [ ] 3. 按骨架成文，对照 writing-style.md 过一遍语言
- [ ] 4. 查 docs/scope-manage.md 取业务域英文词，只扫 docs/engineering/research/ 取最大编号 +1，命名 NNNN-<scope>-<title>.md 落盘（无状态字段，仅记调研日期）
- [ ] 5. 在 docs/README.md 的「调研模式（research）」分表登记，回报路径与开放问题
```

## 文档骨架

```markdown
# 标题

> 调研日期：YYYY-MM-DD · Scope：<scope>（承接 [NNNN](./NNNN-xxx.md)，如有）

## 背景

为什么调研。核心问题一句话。

## 发现

主体。机制拆解、字段表、兼容矩阵。每个关键论断带出处链接或实测依据。
对比成熟开源或同生态方案时，必须以其最佳用法公平对比，严禁单向拉踩或立虚假靶子。工作树现状与未验证设想必须明确拆开。

## 结论

事实结论直接下；方案判断写「倾向：…」——具体方案拍板与约束固化交由下游 `design` 或 `spec`。
没查清的列为开放问题。

## 参考

真正引用过的链接，一行一条。
```

## 自由度与边界

- **无状态字段**：`research` 是直接结果，文首只记 `调研日期：YYYY-MM-DD`，严禁写 `状态：draft` 等状态标签；
- **出处标注与「倾向/结论」区分是死命令**：下游若是模块/系统实现则转 `design-er`，若是跨模块规则/标准则转 `spec-er`；
- 章节顺序可按内容微调，但「背景 / 发现 / 结论 / 参考」四块不可缺。

## 好坏对照

动笔前读一份同文体的完整对照示例：
[references/example.md](./references/example.md)。里面有一段合格调研和它对应的坏版本，
注意坏版本输在哪里——空话、无出处、判断越界。

## 成品样例

需要参考完整颗粒度时读 [examples/sample.md](./examples/sample.md)——
可直接复制其结构与详略，替换为本次主题的内容。
