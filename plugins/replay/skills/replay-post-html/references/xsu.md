# XSU v1 · replay-public 写作参考

本页是作者语法与领域指南，不是生成副本。精确签名查本技能 `components --preset replay-public`；[可编译 example.xsu](../examples/example.xsu) 是构建生成的协议示例，[旧 example.html](../examples/example.html) 保留为视觉 catalog，不是每篇正文。

## 受限语法

XSU v1 是数据语言，不是改名的 JavaScript。每文件一个根调用，组件名区分大小写，常见签名为 `Component(props, children)`、`Component(props)` 或 `Component(text)`，精确签名查当前预设注册表。

- 值仅允许 JSON 双引号字符串、有限数值、布尔、null、数组、对象和注册组件调用；对象键可写 ASCII 标识符或双引号字符串。
- 字符串外允许 `//`、`/* ... */` 注释与尾逗号。原始多行字符串以三双引号 `"""` 起止，分隔符各占独立一行；正文不插值、不解码转义、不自动去缩进。普通字符串沿用 JSON 转义。
- 不允许变量、赋值、函数、条件、循环、成员访问、展开、模板插值、import/export、Load、事件回调或计算表达式；提交原始数据，派生值由脚本计算。
- 禁止重复键、原型键、RawHTML/RawCSS/RawJS、任意 style/className 与脚本。组件不支持的效果先报告缺口，不改生成 HTML。
- 根必须写 `xsuVersion: 1`、稳定 `id`、`preset`、`title`、事实日期 `date`；`theme` 为 `system/light/dark`，默认 system。
- 分片写 `Fragment([组件...])`，主文件用 `Include("sections/01.xsu")`。路径相对引用它的 XSU，展开后仍须符合当前父子关系；真实路径必须留在入口文件目录沙箱内，禁止 URL、绝对路径、逃逸链接和循环。不支持的输入报错，不静默截断。

## 编译、诊断与输出保护

使用 **Node >=18**，零第三方 npm 运行依赖；生成 HTML 在浏览器阅读无需 Node。技能内 `scripts/xsu.mjs` 是构建生成的独立分发 bundle，不手改；`examples/example.xsu` 从仓库 `scripts/xsu/fixtures/` 构建复制，也不双写维护。

`<skill-dir>` 替换为本技能安装目录，命令参数路径相对当前工作目录。验证只校验源；render 写生成页；修改内容回到 XSU。

- `validate/render --warnings-as-errors` 把质量警告提升为失败，不能靠编造内容消警告。
- `validate/render --diagnostics-json diagnostics-new.json` 创建结构化诊断；**只允许新文件，不覆盖已有报告**，也不能覆盖源码、导航或资源。
- `render --check` 在内存重编译并逐字节比对输出，缺失或不同退出 4，不写 HTML。需保留同版本编译器、模板与全部输入才有可复现前提。
- 默认不覆盖人工文件；同 preset/documentId 的带标记生成物可重建。`render --force` 仅允许显式替换人工输出，不跳过校验、安全和输入保护，不与 --check 同用。
- 退出码：0 成功；1 用法/I/O；2 语法、组件、领域或资源错误；3 内部错误；4 输出漂移。诊断指向作者 XSU，不应修生成页掩盖错误。

## 离线与联网能力

默认 `--network offline`：仅系统字体、内联可信运行时和嵌入资源，不加载外部字体、脚本、JSON，也不热刷新导航。内容中的普通外链是读者主动点击的链接，不是页面自动联网资源。

Pele 图表必须显式 `--network connected`；offline 下相关输入报 `XSU_NETWORK_REQUIRED`，不静默联网或丢图。connected 仅在实际用图时加载锁定的 Pele 1.6.0 远程脚本，不表示可添加任意外部脚本，也不宣称全离线、完整 Mermaid 支持或完成供应链安全审计。图表拒绝 HTML、交互链接、初始化指令等危险能力；远程脚本有页面执行权限，版本锁定不等于完整性与供应链保证。失败时应保留可读源码与失败状态，实际图表渲染、打印与安全限制仍需验证。

## 审阅责任

编译通过只证明当前结构校验成功，不证明事实真实、Handoff 因果成立、发布已授权或视觉保真。截图、交互、安全和组件覆盖检查未实际执行时必须标为待验证。

## Replay 根与领域组件

根为 `Replay(props, children)`，本技能 preset 固定为 `replay-public`。可选根字段 subtitle/repo/branch/sessionName/status/totalRawTurns 按当前注册表填写，不从工具次数臆造事实。这里只允许 Replay 领域结构，不能混入 editorial 的 Report/Section/Grid/Markdown/Chart 等通用组件，也不暴露 topbar/drawer/dock 等固定壳件。

| 位置                 | 组件与属性                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 根下各一份           | Context({originGoal,whyConfusing,readingGuide})；Actors({items:[{name,role,detail}]})；EndState({completedItems:[{item,ref,note}],pendingHandoffs:[{task,owner,when}]})；Questions({items:[{question,shortAnswer,deepExplanation}]})（items 可空） |
| 根下线性步骤         | ReplayStep({id,title,phase,summary,status}, children)，至少一步；status 仅 completed/decision/blocked                                                                                                                                              |
| 步骤五要素，各恰一份 | LookAt({target,anchors:[字符串]})；Why(text)；Actions({items:[{type,label,detail}]})；Insight({myth,reality})；Handoff({next,hook})                                                                                                                |
| 步骤证据，零或多份   | Evidence({kind,title,content})；kind 仅 code/command/quote/table/diagram；content 为字符串，不嵌入 HTML                                                                                                                                            |
| 仅 public 根下       | Publication(props)，字段见下节；禁止 Glossary 与私人笔记块                                                                                                                                                                                         |

Actions.type 只用 `discovery/action/fix/sync`。ID 使用字母开头、最多 64 个字母/数字/下划线/连字符的稳定字符串；步骤不能使用保留终点 end，也不能占用固定页面锚点。步骤按源顺序形成主链：Handoff.next 指向紧接下一步 ID，末步为 end。编译器派生旧数字步骤及 nextTarget，不重复手写两套引用；旧 #step-N 分享入口保持兼容，语义定位按当前运行时支持使用。

通常 5–9 步、正式报告仍需脱敏与出处审阅属于内容质量要求，不靠补造步骤满足数量。关键文本不能为空。五要素表达事实，hook 必须有真实因果理由，结构检查替代不了人工审阅。

## Publication 发布约束

Publication 必填 kicker/headline/dek/authors/readingTime/tldr/impact/timeline/decisions/lessons/redactionNote/audience/authorsConfirmed。authors 为已获用户确认的署名数组，authorsConfirmed 只能在真实确认后为 true；audience 与 redactionNote 非空，记录受众边界和脱敏处理，不当作自动授权或自动脱敏证明。

- tldr 结论先行，通常至多三条；impact 仅真实影响，可空数组，每项 {label,value,note}。
- timeline 每项 {time,event,stepRef}，stepRef 引用稳定步骤 ID，而非旧数字 ID；适配器负责转换。
- decisions 每项 {title,context,options,choice,rationale}，至少两个 options，choice 必须精确命中一项，说明未采用方案的代价。
- lessons 为字符串数组；Questions 映射为 FAQ，EndState 明确保留未完成项，不把受阻写成已就绪。
- 禁止 Glossary 或未消费字段藏私稿；不能只换 preset 将 self 原稿直接发布。

## 命令与旧 JSON 迁移

```bash
node <skill-dir>/scripts/xsu.mjs components --preset replay-public
node <skill-dir>/scripts/xsu.mjs validate replay.xsu --diagnostics-json diagnostics-new.json
node <skill-dir>/scripts/xsu.mjs render replay.xsu --out index.html
node <skill-dir>/scripts/xsu.mjs render replay.xsu --out index.html --check
node <skill-dir>/scripts/xsu.mjs render replay.xsu --out index.html --warnings-as-errors
# diagram 证据才需要显式允许联网；不因此放宽图表安全限制
node <skill-dir>/scripts/xsu.mjs render replay.xsu --out index.html --network connected
# 仅迁移显式提供的合法旧 Replay JSON，不执行旧 HTML
node <skill-dir>/scripts/xsu.mjs migrate-replay legacy-replay.json --out replay.xsu
```

迁移结果先审阅再 validate/render；公共版仍需真实署名确认与脱敏，不把迁移器的格式转换当成授权。Replay 不支持 editorial 合集导航 --nav。缺少图表或其他组件能力时明确报告，不手工粘贴组件片段到生成页。

本地 [方法论](xsu-shared/reverse-methodology.md)、[领域契约](xsu-shared/step-chain-schema.md)、[受众口吻](xsu-shared/audience-voice.md) 由构建从唯一维护源生成，禁止手改副本；这些文档中的旧 JSON 字段用于理解领域语义，默认作者入口仍为本页 XSU。
