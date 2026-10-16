---
name: replay-post-html
description: >
  对外发布的正式版 HTML 翻页复盘报告（/replay-post-html）。当用户说「做一个能发出去的复盘页面」「对外版复盘网页」
  「写成正式报告那样可以翻页的复盘」「Postmortem 网页」「给团队/老板/其他组看的复盘页」「replay-post-html」，
  或需要把一段长会话、跨仓变更、排障演练整理成可直接分享链接或打印成 PDF 的正式复盘页时使用。
  产出单文件离线 HTML，一页一节翻页阅读：封面（标题导语、TL;DR、影响数字）→ 背景 → 时间线 → 过程详述（每阶段一页）
  → 关键决策（含备选方案）→ 常见问题 → 现状、后续与经验，附目录抽屉、键盘翻页、深浅主题、本页链接、Markdown 导出与打印，
  发布前按脱敏清单处理人名与内部信息。
  自己看的交互式步进页转交 replay-html；只要 Markdown 正式报告转交 replay-post-md；事前方案设计走 engineering-design。
---

# Replay Post HTML —— 对外发布的翻页复盘报告

自己看的复盘重在「带我走出迷雾」，对外的复盘重在「让没参与的人快速看懂结论，并相信这些结论」。本技能复用同一套逆向拆解结果，把它排成一份**可以一页一页翻看的单文件 HTML 正式报告**：交互骨架与自己看的 `replay-html` 一致（一页一节、底栏翻页、目录抽屉、键盘 `←` / `→`），视觉与口吻换成克制的报告风格。读者在封面就能读完 TL;DR 与影响数字，再按需往后翻到时间线、过程与决策。

口吻与脱敏按 [../_shared/audience-voice.md](../_shared/audience-voice.md) 的 Post 一节执行：团队视角、结论先行、不渲染情绪、决策写出备选方案。

四个复盘技能的分工：

| 读者 \ 格式 | Markdown                                      | HTML                                 |
| ----------- | --------------------------------------------- | ------------------------------------ |
| 自己看      | [replay-md](../replay-md/SKILL.md)            | [replay-html](../replay-html/SKILL.md) |
| 对外发布    | [replay-post-md](../replay-post-md/SKILL.md)  | **replay-post-html（本技能）**       |

## 资源地图

| 资源                                 | 位置                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------- |
| 逆向拆解与噪音折叠方法论             | [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md) |
| 步进数据契约与 `publication` 发布块  | [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md)     |
| 对外口吻与发布前脱敏清单             | [../_shared/audience-voice.md](../_shared/audience-voice.md)           |
| 翻页版式、交互与视觉规范             | [references/post-html-spec.md](references/post-html-spec.md)           |
| 单文件 HTML 起手模板（数据驱动）     | [references/template.html](references/template.html)                   |
| 完整示例（已脱敏的网关复盘报告）     | [examples/example.html](examples/example.html)                         |

## 铁律

1. **先逆向收敛，再改写口吻。** 拆解阶段与自己看的版本完全一致；落笔时所有字段改为第三人称或团队视角，不出现「你拍板」「我懵了」以及 AI 与用户之间的对话细节。
2. **结论先行。** `publication.tldr` 最多 3 条，每条都能单独转发；`publication.headline` 写「结果 + 关键转折」，不写成流水标题。
3. **数字与事实为准。** `publication.impact` 只放有真实数据的指标；未完成项照实写进 `endState.pendingHandoffs`，不写成「已就绪」。
4. **决策要有备选。** `publication.decisions` 每条必须给出 `options`、`choice` 与 `rationale`，`choice` 与其中一个选项一字不差，页面据此标记「采纳 / 未采纳」。
5. **发布前必须脱敏。** 逐条执行 [../_shared/audience-voice.md](../_shared/audience-voice.md) 的脱敏清单，并把处理结果写进 `publication.redactionNote`；作者署名由用户确认，不擅自写真实姓名。
6. **单文件离线可用。** 只替换模板中的 `#replay-data` JSON 与 `<title>`，不引用外部字体、脚本或数据。

## 执行步骤

### 1. 拆解与确认读者

1. 按 [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md) 盘点终局、逆向追因、折叠噪音，得到 5–9 个阶段；
2. 向用户确认两件事：**读者是谁**（团队内部其他组 / 管理者 / 公开社区），以及**署名与可公开范围**；读者越外部，脱敏越严格。

### 2. 组织数据

1. 按 [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md) 写核心字段，`steps` 用正式口吻；`confusionMatrix` 作为「常见问题」；
2. 追加 `publication`：`headline`、`dek`、`authors`、`readingTime`、`tldr`、`impact`、`timeline`（`stepRef` 指向步骤）、`decisions`、`lessons`、`redactionNote`；
3. 跑一遍脱敏清单，把人名改成角色、内部域名改成占位、删除凭据与群聊原文。

### 3. 注入模板

1. 复制 [references/template.html](references/template.html)，把 JSON 写入 `#replay-data`（`</script>` 写成 `<\/script>`）；
2. `<title>` 改为「〈headline〉 · 工程复盘」。

### 4. 交付检查

- [ ] 打开后封面、TL;DR 与影响数字正常渲染，控制台无报错？
- [ ] 底栏翻页、每页末尾「继续：…」按钮、键盘 `←` / `→`、目录抽屉都能切换；时间线条目能翻到对应章节页？
- [ ] 全文没有「你」「我懵了」「猛猛」「铁证」等 Self 口吻，没有真实人名、内部域名与凭据？
- [ ] 每个决策都有备选方案与理由，影响数字都能在过程章节中找到出处？
- [ ] 深浅主题、复制本页链接（`#cover`、`#step-3`、`#decisions` 等）、导出 Markdown 与打印（每页一张、证据完整展开）均可用？
