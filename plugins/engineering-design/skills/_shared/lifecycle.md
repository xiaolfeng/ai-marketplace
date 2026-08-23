# 公共约定：流转与状态

四个技能（draft-er / research-er / rfc-er / adr-er）共用本文件。

## 流转方向

```text
draft ──► research ──► rfc ──► adr
(草案)     (调研)       (提案)   (定稿)
                └──► design（方向已接受后写清怎么工作）
```

单向流动，不回头改旧文：

- draft 钉住困惑和初步想法，允许粗糙；
- research 的倾向判断由 rfc 论证，research 自己不拍板；
- rfc 收敛后二选一下游：长期约束抽成 adr；要写实施工作方式则进 design；
- 同一主题跨阶段时各拿新编号，不复用。

## 状态机

| 阶段 | 合法状态 | 新建默认 |
| --- | --- | --- |
| draft | `open` → `resolved` / `superseded` | `open` |
| research | 无状态；头部记调研日期 | — |
| rfc | `draft` → `in-review` → `accepted` / `rejected` / `superseded` | `draft` |
| adr | `proposed` → `accepted` / `rejected` / `superseded` | `proposed` |

四条纪律：

1. `accepted` 必须有人明确确认，技能不得擅自升级状态；
2. 任何状态都只代表共识，不代表已落地；
3. draft 的 `resolved` 必须标注去向——哪篇 research / rfc 接手了；
4. 被取代的旧文标 `superseded` 并链接新文，正文不删。
