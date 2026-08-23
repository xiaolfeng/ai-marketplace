---
name: draft-er
description: >
  写草案时使用。想法还没收敛、证据不足、方案还在并列时，
  先用草案把困惑和初步想法钉住。用户说「先记个草案」「draft 一下」
  「这个问题还没想清楚，先记下来」「随手分析一下」时触发。
  草案是链条最前端：允许粗糙，禁止装作成熟。
---

# draft-er · 草案

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

## 操作流程

复制此清单并随做随勾：

```
草案进度：
- [ ] 1. 一句话写出「现在困惑什么」
- [ ] 2. 倾倒初步想法，并列的都保留，不做自我审查
- [ ] 3. 列出走到下一步还缺的证据或决定
- [ ] 4. 取号命名 NNNN-draft-<title>.md，落盘 docs/engineering/draft/，状态 open
- [ ] 5. 登记 docs/README.md，回报路径
```

## 文档骨架

```markdown
> 状态：open · 记录日期：YYYY-MM-DD

## 问题
现在困惑的是什么。两三句。

## 初步想法
直觉判断，不需要论证。多条并列也行——这正是草案存在的意义。

## 缺什么
走到下一步还缺哪些证据 / 决定。一行一条。

## 下一步
research（缺证据）或 rfc（其实已经收敛了）。
```

## 纪律

1. **快**。十分钟内能写完的量级；写草案超过半小时说明在过度加工；
2. 并列想法都保留——草案的功能是防遗忘，不是下结论；
3. `resolved` 时必须标注去向：哪篇 research / rfc 接手了（编号链接）；
4. 判断越界自查：出现「决定采用」字样就该转 rfc-er 了。

## 与后继的关系

- 想法需要证据 → 转 research-er；
- 写着写着发现已经收敛 → 直接转 rfc-er，草案标 `resolved` 并链接 RFC；
- 问题本身消失 → 标 `superseded` 或 `resolved`，一句话说明即可，不删文。
