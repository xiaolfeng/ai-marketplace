# replay

面向 AI 编码助手的**逆向复盘与因果走读插件**。

当 AI 在长会话、多分支、跨环境或自动执行中「猛猛干活」，而人类一直在点同意、事后看着几千行对话记录、十几个 commit/PR/Issue 和满屏环境命令陷入「我知道它做得很好，但我已经懵了」的认知过载时，用这套插件把黑盒过程**从终局倒推拆解**成一条人类可一步步走出来的清晰因果链。

同一套拆解结果，按「给谁看」和「什么格式」落成四个技能：

| 读者 \ 格式 | Markdown | HTML |
| ----------- | -------- | ---- |
| **自己看**（尽可能小白） | `replay-md`：30 秒看懂 + 五要素走读 + 小词典的大白话手册 | `replay-html`：暖纸笔记本风格，一屏一步，术语点一下就有解释 |
| **对外发布**（稍微正式） | `replay-post-md`：摘要、影响、时间线、决策、经验俱全的正式复盘报告 | `replay-post-html`：一页一节的翻页式正式报告，封面即结论，每页可单独分享 |

| 技能               | 触发词示例                                                   |
| ------------------ | ------------------------------------------------------------ |
| `replay-md`        | 「帮我复盘」「我懵了帮我理顺」「讲人话给我捋一遍」           |
| `replay-html`      | 「做个网页带我一步步看」「可以点下一步的复盘」「可视化复盘」 |
| `replay-post-md`   | 「写一份能发出去的复盘」「Postmortem」「贴到 Wiki 的正式复盘」 |
| `replay-post-html` | 「对外版复盘网页」「给老板看的复盘报告页」「可以翻页的正式复盘」 |

## 设计要点

- **终局倒推（Backward Tracing），正向走读（Forward Walkthrough）**：分析时从最终结果（合入的 PR、建好的 Issue、跑通的环境）逆向追查每一处动作是由哪个阻塞或发现触发的，剪掉重试噪音；呈现时按 Step 1 → Step N 顺向带读者一步一步走出来；
- **拒绝流水账（Anti-Log-Dump）**：严禁把工具调用按时间顺序原样抄一遍。每一步必须回答「第一步先看什么 → 为什么要看这里 → 发现了什么并做了什么 → 为什么不得不引申到下一步」；
- **读者决定口吻**：自己看的版本第二人称、短句、每个术语进小词典；对外版本团队视角、结论先行、决策写出备选方案，并在发布前按清单脱敏（人名、内部域名、凭据、群聊原文）；
- **四端同源、入口分流**：方法论、数据契约与口吻规范仍单点维护于 [skills/_shared/](skills/_shared/)。两套 HTML 技能先事实/大纲/文案，再写受限 replay.xsu，经本地 scripts/xsu.mjs validate/render 装配固定页面；不手改生成 HTML/CSS/JS。两份 Markdown 技能维持直接写作，不强制 XSU 或 Node。

## 安装

当前插件版本 **0.3.0**；replay-html 与 replay-post-html 技能 metadata 版本均为 **0.3.0**，两份 Markdown 技能不 bump。

HTML 作者读本技能的 XSU 参考、组件输出与 example.xsu，不必全文读模板：[Self 参考](skills/replay-html/references/xsu.md)、[Public 参考](skills/replay-post-html/references/xsu.md)。旧 example.html 与 components/ 保留为视觉 catalog，不是每篇正文；Replay 首版只接受领域组件，不承诺与 editorial 通用组件混排。

- 独立安装时方法论必读路径为各 HTML 技能的 references/xsu-shared/，构建从唯一 _shared 源复制；可编译 examples/example.xsu 从 scripts/xsu/fixtures 构建复制。分发脚本和参考副本不手改。
- 渲染需 Node >=18，零第三方 npm 运行依赖；浏览器阅读无需 Node、本地服务或外部 JSON。
- 默认 --network offline，不加载外部字体、脚本和数据；Pele diagram 需要显式 --network connected。connected 不保证全离线、完整 Mermaid 兼容或供应链安全，图表受安全能力限制。
- validate/render 支持 --warnings-as-errors、--diagnostics-json（仅新报告不覆盖）；render 支持 --check/--force；migrate-replay 仅迁移显式旧 JSON 到 XSU，迁移后仍需事实、署名和脱敏审阅。

```bash
/plugin install replay --marketplace xiaolfeng/ai-marketplace
npx plugins add xiaolfeng/ai-marketplace@replay
```
