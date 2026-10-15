# 复盘步进链条数据契约（Step-Chain Schema）

本文件定义 `replay-md`（Markdown 章节结构）与 `replay-html`（内嵌 `#replay-data` JSON 数据）共用的**唯一数据模型**。
无论是生成文档还是生成交互网页，都必须先在思维中（或草稿中）凑齐这套字段，严禁缺斤少两。

---

## 一、 顶层四段式总纲

一份完整的逆向复盘产物固定由以下四大模块组成：

| 模块编号 | 模块名称                           | 核心作用                                                                 |
| -------- | ---------------------------------- | ------------------------------------------------------------------------ |
| **M1**   | **全景背景与起因（Context）**      | 一句话讲清「本来要干嘛、出了什么岔子/为什么这么复杂、最终停在哪」        |
| **M2**   | **因果主线全景图（Chain Map）**    | 一眼看穿从 Step 1 到 Step N 的完整拓扑，标出每一步的输入、动作与转折标签 |
| **M3**   | **步进闯关详解（Step-by-Step）**   | 复盘核心：每一步严格按「五要素 + 证据 + 迷雾破除」带你一步步走出来       |
| **M4**   | **终局账单与接力指南（Takeaway）** | 汇总所有已落地改动、高频混淆概念对照表，以及「现在轮到你做什么」         |

---

## 二、 单步「五要素」必填契约（The 5-Question Step Contract）

每一个 Step（关卡）都必须像导游带路一样，按顺序回答人类最关心的 **5 个问题**，缺一不可：

### 1. 📍 第一步看什么（`lookAt` / Entry Anchor）

- **定位**：给读者一个极其具体的「视觉落脚点」——具体到某个 PR、某个文件行号、某条评论、某个环境配置或某段报错。
- **要求**：绝不能写「先看代码」「先看环境」这种正确的废话；必须写如 `ai-gateway#280 的合入记录与 Issue #273 的关闭状态` 或 `cmd/gateway/config.go:86 与 deploy-manifests/environments/voice-preview/config.yaml`。

### 2. 💡 为什么要看这里（`whyLookHere` / Motivation & Trigger）

- **定位**：承接上一步的引申（或开篇起因），解释**如果不看这里会踩什么坑、当时面临什么矛盾**。
- **要求**：用大白话讲透背后的工程逻辑。例如：「因为前一个 AI 在没有任何人 Approve 的情况下自己把 #280 合进了 main，还顺手把 #273 关了！如果不立刻锁定这笔合入的边界，主干代码就处于『无人验收裸奔』状态。」

### 3. 🛠️ 在这里发现了什么 & AI 做了什么（`whatWasDone` / Discovery & Actions）

- **定位**：把 AI 在这一关里几十次工具调用提炼为 **2–4 条高信噪比的关键发现与动作**。
- **要求**：区分「查到了什么事实（Discovery）」与「落了什么动作（Action）」，附带真实的 Commit SHA、PR/Issue 编号或命令结果。

### 4. ⚡ 关键转折 / 认知破雾（`insightOrMistake` / Confusion Buster）

- **定位**：点破这一步里最容易让人懵逼的弯路、反直觉机制或试错插曲。
- **要求**：对比「直觉以为 vs 实际上是」。如果这一步经历了脚本报错修复、权限被拒或方案 Revert，在这里用两句话交代清楚，帮读者卸下心理包袱。

### 5. 🔗 从这里引申到哪里（`leadsToNext` / Handoff Hook）

- **定位**：制造悬念与必然性——解释为什么做完这一步还不能收工，它**暴露或触发了什么新问题**，从而自然滑向下一个 Step。
- **要求**：必须与下一个 Step 的 `lookAt` 严丝合缝咬合。

---

## 三、 结构化 JSON 数据契约（供 `replay-html` 直接驱动，亦作为 `replay-md` 提纲）

```json
{
  "meta": {
    "title": "复盘标题（例：AI Gateway #273 生命周期补审与多实例演练全链路复盘）",
    "subtitle": "一句话副标题：从零评审抢跑合入到 #281 正式放行、#282/#284 演练就绪的 8 步逆向拆解",
    "sessionName": "实际测试演练对话",
    "repo": "acme-cloud/ai-gateway",
    "branch": "drill/issue-282-gateway-multi-instance",
    "date": "2026-10-15",
    "totalRawTurns": "2858 行 JSONL / 750+ AI 动作",
    "distilledSteps": 8,
    "status": "阶段闭环 · 待明日窗口演练"
  },
  "background": {
    "originGoal": "原本要解决的核心目标（Why we started）",
    "whyConfusing": "为什么这段过程让人极其懵逼（信息过载点）",
    "readingGuide": "阅读/操作指引：你不需要看懂每一条 bash 命令，跟着下面 8 个关卡的「看哪里 → 为什么 → 做了什么 → 引申到哪」走完，就能完全掌控全局。"
  },
  "actorsAndRepos": [
    {
      "name": "ai-gateway",
      "role": "核心业务仓",
      "detail": "#273 主任务、#280 抢跑合入、#281 补审修复 PR、#282 多实例演练 Issue、#284 演练手册 PR"
    }
  ],
  "steps": [
    {
      "id": 1,
      "phase": "阶段一：补救与验伤",
      "title": "关卡短标题（4-10字，动词开头）",
      "summary": "一句话概括本关核心位移（用于左侧导航列表与顶部地图）",
      "status": "completed | decision | blocked",
      "lookAt": {
        "target": "第一步要看的具体对象（文件/PR/环境/文档）",
        "anchors": ["具体锚点 1", "具体锚点 2"]
      },
      "whyLookHere": "为什么要看这里（承接上一步，讲清动机与风险）",
      "whatWasDone": [
        {
          "label": "关键动作或发现标题",
          "detail": "具体内容与结果，保留关键 SHA / 编号 / 数值",
          "type": "discovery | action | fix | sync"
        }
      ],
      "confusionBuster": {
        "myth": "我当时懵逼/以为的是：...",
        "reality": "真实工程逻辑是：..."
      },
      "leadsToNext": {
        "hook": "为什么还没完？从这里引申出了什么？",
        "nextTarget": "指向下一步 lookAt 的精确名称"
      },
      "evidence": [
        {
          "title": "证据标题（如：关键代码行 / 审查结论 / 演练数据 / 原始问答）",
          "kind": "code | command | quote | table",
          "content": "具体的代码片段、命令输出或对话原话摘录"
        }
      ]
    }
  ],
  "confusionMatrix": [
    {
      "question": "高频灵魂追问（如：为什么语音分支合并了，换镜像却会把语音关掉？）",
      "shortAnswer": "一句话秒懂结论",
      "deepExplanation": "底层代码开关 + 部署白名单机制详解"
    }
  ],
  "endState": {
    "completedItems": [
      {
        "item": "已闭环事项",
        "ref": "PR/Commit/Message 编号",
        "note": "验证结果"
      }
    ],
    "pendingHandoffs": [
      {
        "task": "待办事项",
        "owner": "谁来做（你 / 架构师老戴 / 负责人小曹 / 基础库团队）",
        "when": "触发时机或窗口"
      }
    ]
  }
}
```

---

## 四、 质量红线

1. **禁止丢掉具体锚点**：复盘不是写心灵鸡汤。所有的 PR 号（如 `#280`、`#281`、`#284`）、Issue 号（`#273`、`#282`）、关键 Commit（`894315e`、`8897616`）、关键配置键（`GATEWAY_AUDIO_GENERATION_EGRESS`）和实测数据（如 `20.9s / 46.3s 503 空窗`）必须原样保留。
2. **人话优先，先讲人话再贴证据**：正文（`whyLookHere`、`confusionBuster`、`leadsToNext`）必须用直白、有呼吸感的中文向人类解释因果；长代码、长命令和原始输出放进 `evidence`（在 MD 中为折叠块或次级引用块，在 HTML 中为右侧可展开证据面板）。
3. **诚实标注未完成项**：AI 做得再猛，也不能把「还在等别人审批 / 等正式版发布 / 等明天演练窗口」吹成「全部搞定」。`endState.pendingHandoffs` 必须按责任人切分清楚。
