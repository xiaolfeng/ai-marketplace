---
name: adr-er
description: >
  写架构决策记录（ADR）时使用。RFC 已收敛、要冻结长期约束，
  或用户说「写个 ADR」「把这个决定记下来」「定稿」时触发。
  一次性的实施细节、排期、配置不要用。
---

# adr-er · 定稿

公共约定：[../_shared/conventions.md](../_shared/conventions.md) ·
Scope 词表：[../_shared/scope-manage.md](../_shared/scope-manage.md) ·
流转与状态：[../_shared/lifecycle.md](../_shared/lifecycle.md) ·
语言纪律：[../_shared/writing-style.md](../_shared/writing-style.md)

## 操作流程

复制此清单并随做随勾：

```
ADR 进度：
- [ ] 1. 确认约束的是长期决定（一次性细节 → 不写 ADR）
- [ ] 2. 找到承接的 RFC/research，链接进文档
- [ ] 3. 按骨架成文，逐条检查「能否被单独引用」
- [ ] 4. 取号命名 NNNN-adr-<title>.md，落盘 docs/engineering/adr/，状态 proposed
- [ ] 5. 登记 docs/README.md，回报路径
```

## 文档骨架

```markdown
> 状态：proposed · 承接 [NNNN](./NNNN-rfc-xxx.md)

## 背景
哪段约定会漂移、必须冻住。一两句。

## 决定
编号条款。每条 = 允许什么 + 禁止什么 + 为什么。
避免「原则上」「尽量」——要么允许，要么禁止。

## 后果
得到什么、失去什么、违反时会怎样暴露。

## 否决项
一行一条：被否决的写法 | 会怎样坏。
容易误伤的合法写法明确排除在禁令外。
```

## 定稿纪律

1. **accepted 之后正文不可修改**。发现写错了 → 新增一条 ADR，
   新旧互相标 `superseded` 并链接对方；
2. 每条决定做「单独引用测试」：别人只看这一条能不能照着执行；
   不能就补上下文，直到能为止；
3. `accepted` 由人确认后手动改，技能不动这个状态。

## 好坏对照

动笔前读同文体的完整对照示例：
[references/example.md](./references/example.md)。
重点看坏例怎么把定稿写成散文——以及好例每条决定为什么能单独贴出去用。
