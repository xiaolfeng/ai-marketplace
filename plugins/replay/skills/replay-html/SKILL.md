---
name: replay-html
description: >
  自己看的小白版交互式 HTML 步进复盘（/replay-html）。当用户说「生成 HTML 复盘」「做个可视化复盘页面」
  「可以点下一步一步步走的复盘」「把这段复杂对话做成交互式走读网页」「我懵了，做个网页带我一步步看」「replay-html」，
  或需要把 AI 猛猛执行的长对话、跨仓改动、复杂演练拆成自己能一关一关点着看的网页时使用。
  产出单文件离线 HTML：暖纸笔记本风格，一屏只讲一步（先看这里→为什么看→做了什么→你可能以为 vs 其实是→所以接下来），
  术语带点击即看的小词典气泡，深浅双主题、键盘步进、目录抽屉与 Markdown/打印导出。
  只要静态 Markdown 转交 replay-md；要发给团队之外的人看的正式翻页报告转交 replay-post-html；纯系统架构拓扑图走 architecture-diagram。
---

# Replay HTML —— 自己看的步进复盘笔记本

面对几千行 AI 操作记录、十几个跨仓 PR/Issue 和曲折的排障过程，静态长文仍然容易让人视线失焦。本技能把逆向拆解出的因果链路渲染成一个**像翻笔记本一样一页一步的单文件 HTML**：读者每次只看一步，点「懂了，下一步」顺着因果走到终点。

读者是「当时一路点同意的自己」，口吻按 [../_shared/audience-voice.md](../_shared/audience-voice.md) 的 Self 一节：第二人称、短句、每个术语都进小词典。

四个复盘技能的分工：

| 读者 \ 格式 | Markdown                                      | HTML                                                |
| ----------- | --------------------------------------------- | --------------------------------------------------- |
| 自己看      | [replay-md](../replay-md/SKILL.md)            | **replay-html（本技能）**                           |
| 对外发布    | [replay-post-md](../replay-post-md/SKILL.md)  | [replay-post-html](../replay-post-html/SKILL.md)    |

## 资源地图

| 资源                                   | 位置                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------- |
| 逆向拆解与四类噪音折叠方法论           | [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md)     |
| 步进五要素与 `#replay-data` JSON 契约  | [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md)         |
| 自己看 / 对外发布的口吻差异            | [../_shared/audience-voice.md](../_shared/audience-voice.md)               |
| 页面结构、交互与视觉规范               | [references/html-interaction-spec.md](references/html-interaction-spec.md) |
| 单文件 HTML 起手模板（数据驱动）       | [references/template.html](references/template.html)                       |
| 完整示例（网关生命周期演练复盘）       | [examples/example.html](examples/example.html)                             |

## 铁律

1. **先逆向收敛，再填数据。** 严禁把原始会话直接塞进网页做成聊天回放器。必须先按 [../_shared/reverse-methodology.md](../_shared/reverse-methodology.md) 从终局倒推、折叠试错噪音，提炼为 **5–9 个因果咬合的步骤**。
2. **单一事实源驱动。** 页面所有内容由内嵌的 `<script type="application/json" id="replay-data">` 渲染；基于 [references/template.html](references/template.html) 构建时只替换该 JSON 与 `<title>`，不改样式与脚本。
3. **小词典必填。** 顶层 `glossary` 收录 6–12 个读者会卡住的词，`term` 与正文写法一字不差，页面会自动加虚线并在点击时弹出大白话解释。
4. **每步结尾必须咬合。** `leadsToNext.hook` 要讲清「因为发现了 X，所以得去看 Y」，页面会把它渲染成「懂了，下一步：〈下一步标题〉→」按钮。
5. **单文件离线可用。** 不引用任何外部字体、脚本或 JSON，双击即可在现代浏览器打开。

## 执行步骤

### 1. 逆向拆解与建模

1. 读取会话记录、Git 历史或用户提供的材料，盘点**终局账单**与**初始起因**；
2. 逆向推导因果链，标记用户的**追问点、撤回点与高频混淆概念对**；
3. 按 [../_shared/step-chain-schema.md](../_shared/step-chain-schema.md) 组织 JSON：`meta`、`background`、`actorsAndRepos`、`steps`、`confusionMatrix`、`endState`，再追加第五节的 `glossary`。

### 2. 注入模板

1. 复制 [references/template.html](references/template.html)；
2. 把 JSON 写入 `#replay-data`（字符串中的 `</script>` 写成 `<\/script>`）；
3. `<title>` 改为「〈复盘标题〉 · 复盘笔记」。

页面会自动生成三类画面：**开场**（起因、为什么会懵、出场角色、怎么看）→ **第 1…N 步** → **终点**（已办妥、接下来轮到谁、你可能还会问、小词典）。

### 3. 交付检查

- [ ] 双击打开能看到开场页，控制台无 JSON 解析报错？
- [ ] 底部「上一步 / 下一步」、每步末尾的咬合按钮、键盘 `←` / `→`、数字键 `1`–`9`、目录抽屉都能切换，并同步进度条与圆点？
- [ ] 每一步的五要素是否全部非空，相邻两步首尾咬合？
- [ ] 正文里的术语是否都带虚线并能弹出解释？
- [ ] 深浅主题切换正常，390px 手机宽度下无横向滚动？
