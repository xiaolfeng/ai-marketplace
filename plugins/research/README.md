# research

面向 AI 编码助手的调研插件：提供常规调研与对抗性调研两种模式。

| 技能 | 触发词示例 | 说明 |
| --- | --- | --- |
| `research-normal` | 「调研一下」「X 和 Y 怎么选」 | 开放式收集与多方案对比，产出带置信度的调研报告，只陈述不拍板 |
| `research-adversarial` | 「对抗性调研」「/research-adversarial」 | 确认立题 → 用户与 AI 辩证交锋 → 终审产出三要素报告 |

## Agents

| Agent | 说明 |
| --- | --- |
| `final-research-check` | 对抗性调研终审官：复核战线胜负、集中核查悬置争点，产出「问题陈述 / 诱因 / 根因」报告 |

> ✅ 两个技能均已可用；每个技能附 `references/`（方法细节）、`examples/`（完整示范）
> 与 `evals/`（触发评测集），按渐进披露分层组织。

## 安装

```bash
npx plugins add xiaolfeng/ai-marketplace@research
```
