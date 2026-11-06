---
name: replay-html
description: >
  自己看的小白版交互式 HTML 步进复盘（/replay-html）。当用户说「生成 HTML 复盘」「做个可视化复盘页面」「点下一步的复盘」「我懵了，做个网页带我一步步看」「replay-html」时使用。
  从长会话、跨仓变更或复杂排障材料逆向提炼因果链，AI 写受限 XSU，脚本渲染单文件 HTML，默认离线。
  暖纸笔记本风格，一屏一步，五要素、术语气泡、键盘步进、目录抽屉与 Markdown/打印导出。只要静态 Markdown 转 replay-md；对外正式翻页报告转 replay-post-html；纯系统架构图转 architecture-diagram。
metadata:
  version: "0.3.0"
---

# Replay HTML —— 自己看的步进复盘笔记本

带当时一路点同意的自己走出迷雾：第二人称、短句，术语就地解释。先事实与因果大纲，再写文案，最后由 AI 写 `replay.xsu`，技能自带编译器装配固定页面。AI 不手写或修改生成的 HTML、CSS、JS，也不手工替换 #replay-data JSON。

## 资源地图

必读内容全部在本技能内；独立安装不依赖兄弟目录。正常创作无需全文读取数千行模板。

| 资源                         | 位置                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 逆向拆解与噪音折叠           | [reverse-methodology.md](references/xsu-shared/reverse-methodology.md)                                                          |
| 五要素与领域契约             | [step-chain-schema.md](references/xsu-shared/step-chain-schema.md)                                                              |
| Self 口吻与术语规范          | [audience-voice.md](references/xsu-shared/audience-voice.md)                                                                    |
| XSU 语法、当前预设组件与 CLI | [xsu.md](references/xsu.md)、[可编译示例](examples/example.xsu)；运行 `components --preset replay-self` 查精确属性              |
| 页面结构与交互验收           | [html-interaction-spec.md](references/html-interaction-spec.md)                                                                 |
| 旧视觉组件目录               | [components/README.md](references/components/README.md)、[example.html](examples/example.html)，只作 catalog 参考，不是每篇正文 |

兄弟技能仅为可选路由跳转，不是本技能必读依赖：[自己看 Markdown](../replay-md/SKILL.md)、[自己看 HTML](../replay-html/SKILL.md)、[对外 Markdown](../replay-post-md/SKILL.md)、[对外 HTML](../replay-post-html/SKILL.md)。两份 Markdown 技能保持直接写作入口，不要求先写 XSU 或安装 Node。

## 执行步骤

1. **收材料与倒推因果**：按本地方法论盘点终局账单、初始目标、追问与撤回；折叠试错噪音，形成有首尾咬合的因果大纲，而非工具日志摘要。通常 5–9 步，但不为凑数虚构事实。
2. **写大白话文案**：每步回答看哪里、为什么、做了什么、直觉误区与真实机制、所以接下来；补小词典，通常 6–12 词。区分已完成、决策与受阻，不把命令文本当成执行证据。大纲与文案可落盘留审阅记录，不能跳过事实核验直接拼网页。
3. **编写 XSU**：参照本地语法、当前预设组件目录与 example.xsu，根使用 `Replay`，preset 固定为 `replay-self`。后续以 XSU 为可编译事实源；重新评审文案时同步源文件后重渲染。每步恰好一个 LookAt、Why、Actions、Insight、Handoff，按需追加 Evidence。只使用 Replay 领域组件，不混入 Report/Section/Grid/Markdown 等 editorial 通用组件。
4. **校验与渲染**：`<skill-dir>` 替换为本技能安装目录；从任意目录可运行，输入输出路径相对当前工作目录，产物不写进技能目录。

   ```bash
   node <skill-dir>/scripts/xsu.mjs components --preset replay-self
   node <skill-dir>/scripts/xsu.mjs validate replay.xsu
   node <skill-dir>/scripts/xsu.mjs render replay.xsu --out index.html
   node <skill-dir>/scripts/xsu.mjs render replay.xsu --out index.html --check
   ```

5. **实际验收并交付**：核对每步事实与 Handoff 因果，打开 HTML 检查主题、390px 宽度、键盘与按钮、目录、hash 定位、证据、Markdown 与打印导出。检查术语标注与气泡、大白话解释和终局待办。交付 XSU 与 HTML 路径，并如实列出执行过和未执行的验证。

## 领域与运行边界

- `Handoff.next` 必须精确等于紧接下一步的稳定 ID，末步为保留终点 `end`；hook 解释「发现 X，所以必须看 Y」。编译器检查引用，不证明因果叙事真实。
- 根下 Context、Actors、Questions、EndState 各一份；Questions 的 items 可空。Glossary 必须存在，不得带 Publication。词条 term 与正文一致，plain 用日常说法。
- 渲染需 **Node >=18**，零第三方 npm 运行依赖；浏览器看生成页无需 Node、本地服务或外部 JSON。
- 默认 `--network offline`，不加载外部字体、脚本或数据。Evidence(kind: "diagram") 的 Pele/Mermaid 图表需显式 `--network connected`；否则拒绝，不静默联网或丢图。
- connected 按需加载锁定版本的远程 Pele，不等于全离线或供应链安全证明；不支持任意 Mermaid、HTML 标签、交互链接或初始化指令，详见 xsu.md。加载失败保留可读源码与失败状态。
- 主题根 props 用 `theme: "system" | "light" | "dark"`（默认 system），不手改生成页 data-theme。
- validate/render 支持 `--warnings-as-errors` 与 `--diagnostics-json <new-file>`（只新建，不覆盖报告）；`render --check` 只比对，`--force` 仅放开人工输出覆盖、不绕过输入或安全保护。
- 旧 Replay JSON 用 `migrate-replay legacy.json --out replay.xsu` 显式迁移，再审阅、validate、render；不扫描或执行旧 HTML，也不把迁移当作自动脱敏。
- 视觉组件不足先报告能力缺口；禁止复制片段、改模板或追加样式适配单篇文案。未执行的截图、安全、覆盖与交互测试不能写成已通过。
