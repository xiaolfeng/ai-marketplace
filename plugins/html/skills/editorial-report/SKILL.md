---
name: editorial-report
description: 把周报、日报、月报、项目进展、复盘简报、指标简报等报告，从大纲、文案写到单文件 HTML 报告特刊（纸白墨蓝、深浅主题跟随系统，内置 60 余类组件）。用户说「写个报告」「出个周报 / 日报 / 月报」「进展汇报」「复盘简报」「HTML 报表」「做成报告页面」时使用。正文口吻沿用用户设定的角色，没有设定时用中性同事口吻。系统架构拓扑图走 architecture-diagram，手绘流程图走 excalidraw-diagram，会话逆向复盘走 replay。
license: MIT
metadata:
  version: "0.2.2"
---

# Editorial Report

产出单文件 HTML 报告：先策划大纲，再写文案，最后套进双主题报告壳。三步各自落盘，以后改结构回到大纲，改句子回到文案，不在 HTML 里即兴返工。

## 资源地图

开工先读 [`references/voice.md`](references/voice.md)（口吻）与 [`references/html-design.md`](references/html-design.md)（视觉），然后按阶段整份读取对应文件，不要只抽几段：

| 阶段     | 必读                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 策划大纲 | [`references/outline.md`](references/outline.md)                                                                               |
| 写文案   | [`references/copy.md`](references/copy.md)                                                                                     |
| 套壳     | [`references/template.html`](references/template.html)；单个组件看 [`references/components/`](references/components/README.md) |
| 查全组件 | [`examples/example.html`](examples/example.html)（全部组件与状态变体的占位参考）                                               |
| 合集导航 | [`references/report-nav.md`](references/report-nav.md)；同步脚本 [`scripts/sync-nav.mjs`](scripts/sync-nav.mjs)                |

## 产物落点

- **用户指定了最终 HTML 的位置**：严格按用户给的路径写，大纲和文案放在同一目录；
- **用户没有指定**：默认归档到当前项目的 `reports/<yyyy-mm-dd>-<slug>/`。

```text
reports/2026-10-18-weekly/
├── outline.md    # 大纲，过程可审计
├── copy.md       # 套壳之前的文案
└── index.html    # 最终 HTML
```

同一目录的多篇报告组成合集时，合集根目录多一份共享导航，成员页只多内嵌快照：

```text
reports/
├── report-nav.json          # 共享导航，最高两级，唯一编辑源
├── 2026-10-12-weekly/
│   ├── outline.md
│   ├── copy.md
│   └── index.html           # 含 #report-nav-data 快照
└── 2026-10-19-weekly/
    └── index.html
```

报告不写进本插件目录。

## 工作顺序

1. **确认口吻**：按 `voice.md` 查当前环境里用户设定的角色；有就沿用，没有就用中性同事口吻，不需要为此单独提问。
2. **收事实**：只用来源里有的。缺读者、时段或「这篇要回答什么」时一次最多问三个问题；能从上下文安全确定的不再问。
3. **出大纲**：按 `outline.md` 写 `outline.md`。用户没说「直接写」时，先把大纲给用户看一眼再写文案；用户给了完整大纲或明确跳过，也要把大纲落盘。
4. **写文案**：按 `copy.md` 从大纲写 `copy.md`。未确认的内容单独成节，不编进度。
5. **套壳**：复制 `template.html` 为 `index.html`，按 `html-design.md` 的模块表填槽；拿不准结构或状态 class 时参考 `examples/example.html`。example 只是全量目录，正式报告按事实删减，不要整页照搬。不写 `data-theme` 让页面跟随系统；用户说投屏、深色展示时才写 `data-theme="dark"`。不要另起 `<style>`。双侧栏自动工作：右栏嵌套在 `<main>` 正文旁随滚动 sticky 浮动，从 h2/h3 自动生成无框页边导轨目录；单篇报告的 `#report-nav-data` 槽位保持 `{}`，合集成员页在写好 `report-nav.json` 后运行 `node scripts/sync-nav.mjs <report-nav.json>` 注入快照，不手抄。
6. **验证并交付**：在浏览器里打开 `index.html`，确认深浅主题、约 `390px` 移动宽度无横向溢出、没有残留的 `<!-- SLOT -->` 与 `【替换：…】`；然后把本地路径交给用户。

## 完成标准

- 读者能回答：这是哪段时期、给谁看、现在卡在哪、下一步是什么；
- `outline.md` 与 `copy.md` 章节对得上，HTML 里没有大纲之外的板块；
- 导语和收尾是用户设定的口吻（或中性同事口吻），事实段落没有用口头禅改状态；
- `index.html` 来自模板，class 与 `html-design.md` 一致，没有临场皮肤；
- 深浅主题、桌面与移动宽度都实际看过；
- 合集模式下 `sync-nav.mjs --check` 通过：每篇左栏与 `report-nav.json` 一致，当前页高亮与上下篇正确。

## 禁止

- 不另写配色，不拿别的设计技能顶替这套模板；
- 不编造数字、完成度、负责人或截止日期；
- 不把「计划做」写成「已经做」；
- 用户没有设定角色时，不自己发明人设；
- 不用 emoji 当 UI 图标，图标统一用内联 Lucide。
