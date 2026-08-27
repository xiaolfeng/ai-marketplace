# charm

面向 AI 编码助手的魅力文学插件：让模型的文字像活人，而不是输出机器。
方法论站在两块地基上——人机文本差异的实证研究（burstiness、立场标记、
修复机制、填充词效应）与经典写作准则（Orwell 六则、Zinsser 砍冗余），
全部出处收录于 [`skills/_shared/human-sources.md`](skills/_shared/human-sources.md)。

| 技能 | 触发词示例 | 说明 |
| --- | --- | --- |
| `like-a-human-writing` | 「写得像个人」「去掉 AI 味」 | 书面文本人味化：文章 / 博客 / README / 长回复 |
| `like-a-human-speaking` | 「聊天像个人」「别像客服」 | 对话语感人味化：IM 回复 / 群公告 / 客服话术 |

## 设计要点

- **文体分级**：技术规范与法务口径走克制档只去病灶；随笔评论放开鲜活度；
- **实证边界**：区分「研究原文结论」与「移植推断」，引用不越界（见 sources 取用纪律）；
- **共用资产**：AI 腔黑名单与参考文献在 `skills/_shared/` 单点维护。

## 安装

```bash
npx plugins add xiaolfeng/ai-marketplace@charm
```
