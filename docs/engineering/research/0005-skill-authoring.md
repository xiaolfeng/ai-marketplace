> 调研日期：2026-08-23

# Skill 编写规范与 AI 输出可读性调研

## 背景

engineering-design 插件当前的三份技能只有「描述性规则」，存在两类缺陷：
① 缺少示例、模板与 reference 分层，AI 遵循时缺少锚点；
② 未约束输出语言风格，AI 写出的文档容易带机翻腔和汇报腔，人类难读。
本调研分别回答「怎么写出高规范的 SKILL」与「怎么让 AI 说人话」。

## 一、SKILL 编写规范（Anthropic 官方最佳实践）

来源：<https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices>

### 核心原则

| 原则 | 要点 |
| --- | --- |
| 简洁至上 | 上下文窗口是公共资源。默认假设模型已经很聪明，只写它不知道的；每段都要证明自己值得占用的 token |
| 自由度分级 | 按「任务出错代价」匹配指引强度：易碎操作给死命令（低自由度），有惯例给模板（中），靠判断力的给启发式（高） |
| 评估先行 | 先建评估场景再写文档——解决真实问题，而不是想象中的问题 |

### description 写法（决定技能能否被发现）

- **第三人称**：写「做什么 + 何时用」，注入系统提示时人称混乱会导致选择失败；
- 含具体关键词和触发场景，拒绝「Helps with documents」式的空话；
- `name` ≤64 字符小写连字符。

### 渐进披露三模式

SKILL.md 是目录页不是百科全书（正文 <500 行）：

1. **高层指引 + 引用**：主文件给快速上手，细节链到 FORMS/REFERENCE/EXAMPLES；
2. **按领域组织**：多领域时分文件，任务只加载相关领域；
3. **条件细节**：基本路径写在正文，进阶特性条件链接。

**引用只允许一层深**——SKILL.md → reference 文件。嵌套引用会让模型只预览不读全文。
超过 100 行的 reference 文件要在头部加目录。

### 对本插件最关键的三个模式

**① 示例模式（Examples pattern）**：输出质量依赖「见过好样子」的技能，
直接给 input/output 对照组，比任何描述都有效。官方明确：
*示例传达风格与详略水平的能力强于描述*。

**② 模板模式（Template pattern)**：区分两种严格度——
格式必须精确时用「ALWAYS use this exact template」；
允许变通时给「sensible default, use your best judgment」。

**③ 工作流 + 可复制检查清单**：复杂任务拆成编号步骤，
把 checklist 放进正文让模型复制到回复里逐项勾选；质量关键路径配反馈循环（验证→修复→再验证）。

### 其他反模式

- 时间敏感信息混进正文（会过期）；
- 术语不一致（同一概念一会儿叫 X 一会儿叫 Y）；
- 给太多选项而不给默认值；
- Windows 反斜杠路径。

## 二、让 AI 输出简洁人类可读（Anti-Slop 方法论）

来源：<https://github.com/louisfb01/ai-engineering-cheatsheets>（Anti-Slop Writing Guide）、Claude prompting best practices

核心思路：AI 腔不是模型问题，是**缺少显式风格约束**的问题。可操作的抓手：

### 正面指令（要什么）

- 清晰直接的陈述句；短句与解释性长句交替；
- 具体动词 + 具体名词，形容词只在携带信息（规模/约束/性能）时使用；
- 开头直接进入主题，不用悬念钩子（操作型文书尤其如此）。

### 负面清单（不要什么）

- 空话高频词：「赋能」「抓手」「闭环」「沉淀价值」「全方位」「深度赋能」等装饰性词汇；
- 万能句式：「不仅仅是 X，更是 Y」「这不禁让人思考」「综上所述」；
- 自问自答式开头、元话语过渡（「看完上文我们再来看」）；
- 排比堆砌与总结性复述（前文说过的话再说一遍）。

### 删减测试（Cut Test）

删掉某个词/句后重读：如果句子只是变短而没有丢失含义 → 删；
如果失去精确定义或真实情绪 → 保留。这是判断「装饰 vs 信息」的唯一标准。

### 结构约束

- 给定大纲并声明「不得增加章节」；
- 声明受众已知道什么（防止过度解释）；
- 每段只讲一件事且必须推进论证；
- 列表只用于真正并列的条目。

## 三、对 engineering-design 插件的应用方案

| 缺陷 | 对策 | 来源 |
| --- | --- | --- |
| 无示例 | 每个技能加 `references/example.md`：同主题的好例 vs 坏例对照 | 官方 Examples pattern |
| 无模板 | SKILL.md 内嵌严格骨架（代码块给出），区分「固定块」与「灵活块」 | Template pattern |
| 无分层 | SKILL.md 精简为入口；细节下沉 references/，引用保持一层深 | 渐进披露 |
| AI 腔 | `_shared/writing-style.md` 共享输出纪律：正面风格 + 中文负面清单 + 删减测试 | Anti-Slop |
| 流程模糊 | 操作步骤配可复制的检查清单 | Workflow pattern |
| 自由度错配 | 编号/命名 = 低自由度死命令；文体结构 = 中自由度模板；行文语气 = 高自由度原则 | 自由度分级 |

## 参考

| 主题 | 链接 |
| --- | --- |
| Anthropic Skill authoring best practices | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices |
| Anti-Slop AI Writing Guide | https://github.com/louisfb01/ai-engineering-cheatsheets/blob/main/Anti_Slop_AI_Writing_Guide.md |
| Claude prompting best practices | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
