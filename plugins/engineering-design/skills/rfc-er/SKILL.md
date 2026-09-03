---
name: rfc-er
description: >
  写提案（RFC）时使用。方案方向已定、需要评审拍板，
  或用户说「写个 RFC」「提案」「建议采用 X」时触发。
  方案还在并列时不要用——先回 research 补证据。
---

# rfc-er · 提案

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

## 操作流程

复制此清单并随做随勾：

```
RFC 进度：
- [ ] 1. 确认方案已收敛（还有并列选项 → 先回 research）
- [ ] 2. 按骨架成文：问题 / 方案 / 不做什么 / 备选 / 待定
- [ ] 3. 对照 writing-style.md 删空话，做一遍删减测试
- [ ] 4. 只扫 rfc/ 取最大编号 +1，命名 NNNN-rfc-<title>.md，落盘 docs/engineering/rfc/，状态 draft
- [ ] 5. 登记 docs/README.md，回报路径与待定项
```

## 文档骨架

```markdown
> 状态：draft · 承接 [NNNN](./NNNN-research-xxx.md)，如有

## 问题
现在卡在哪。两三句，直接进主题。

## 方案
编号条款。每条 = 做什么 + 不做什么 + 为什么。
条款间用自然段衔接。

## 不做什么
一行一条，每条带一句为什么排除。

## 备选
表格：被否决的写法 | 否决原因。原因要对得上方案的条款。

## 待定
没选定的列出来，标明是否阻塞。accepted 不覆盖它们。
```

**块不可增删**——想加「背景」「团队介绍」之类的章节时，问自己：删掉它评审会缺信息吗？不会就别加。

## 自由度

- 五个块的顺序、状态 `draft` 起步、`accepted` 需人工确认——死命令；
- 条款数量和详略按问题规模来，小决策两三条足够；
- 行文语气按 writing-style.md 自由发挥。

## 好坏对照

动笔前读同文体的完整对照示例：
[references/example.md](./references/example.md)。
重点看坏例怎么把一页纸的决策写成三页汇报——那是最常见的失败方式。

## 成品样例

需要参考完整颗粒度时读 [examples/sample.md](./examples/sample.md)——
可直接复制其结构与详略，替换为本次主题的内容。
