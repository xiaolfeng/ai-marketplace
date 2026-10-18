# 插件编写与上架规范

> 状态：adr · 日期：2026-08-23 · Scope：plugin
> 承接：[插件标准全景调研](../research/0001-plugin-standards.md) · [ZCode 兼容性分析](../research/0004-marketplace-zcode.md)

## 适用范围与背景

本规范是向「筱锋のAI插件库」提交与维护插件的唯一标准。所有约束均来自各平台官方文档与工具链的实测结论，目的是让一份插件同时服务 Claude Code、Codex、Cursor、ZCode 等全部消费方。管辖范围覆盖 `plugins/*/`、`.claude-plugin/marketplace.json` 与 `dist/cursor/` 导出产物。

## 规范条款

### 1. 目录模板与结构约束

每个插件必须遵循以下标准目录布局，严禁将技能嵌套在多层子目录下：

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json       # 插件 manifest（必需）
├── skills/
│   └── <skill-name>/
│       └── SKILL.md      # 技能定义（保持 skills/ 单层结构）
└── README.md             # 插件说明
```

可选扩展组件：`commands/*.md`、`agents/*.md`、`hooks/hooks.json`、`.mcp.json`（Claude / Cursor / ZCode 支持，Codex 忽略）。

### 2. 命名约定

1. **统一 kebab-case**：插件名与技能名必须使用小写字母、数字与连字符；
2. **插件名正则**：须匹配 `^[a-z0-9][a-z0-9._-]{0,127}$`；
3. **目录名一致**：技能 frontmatter 的 `name` 必须与其所在 `skills/<skill-name>/` 目录名完全一致。

### 3. `SKILL.md` 要求

```markdown
---
name: my-skill
description: 做什么 + 什么时候用。description 是模型路由的唯一依据。
---
```

1. **必填字段**：`name` 与 `description` 缺一不可，缺失时技能会被所有客户端忽略；
2. **字符上限**：`description` 上限 **1024 字符**，超限会被 ZCode 整体丢弃——长说明一律放入正文或 `references/`；
3. **渐进披露**：正文建议 500 行以内，详细教学对比或大数据表放入 `references/` 按需加载。

### 4. 版本同步与上架纪律

1. **三处版本同步**：发版时必须在同一提交内同步修改 `plugins/<name>/.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` 对应条目与根 `README.md` 插件列表的版本号（Claude 以 manifest 版本、ZCode 以市场条目版本作为更新信号）；
2. **显式声明 skills 路径**：在 `.claude-plugin/marketplace.json` 登记时，`source` 使用 `./plugins/<plugin-name>` 相对路径，并显式声明 `"skills": ["./skills"]`；
3. **导出物同步**：清单变更后必须运行 `npm run build` 重新导出 `dist/cursor/`，严禁手工编辑 `dist/cursor/`。

## 正反例与边界

- ✅ **合规**：`plugins/bug/skills/find-bug/SKILL.md`（单层技能目录，`description` ≤ 1024 字符，更新版本后运行 `npm run build`）。
- ❌ **违规**：`plugins/bug/skills/security/find-security-bug/SKILL.md`（二级嵌套技能目录，无法被安装器发现）。
- ❌ **违规**：只更新了 `plugin.json` 的 `version` 而漏改 `marketplace.json` 或未重跑 `npm run build`。

## 合规与后果

- **收益与代价**：一份源码无需分支维护即可被 Claude Code、Cursor、ZCode 与 `npx skills add` 直接安装；代价是每次清单改动须执行构建同步。
- **校验与暴露方式**：提交前与 CI 强制执行三道门检查：
  ```bash
  claude plugin validate .
  npx skills add . --list     # 确认技能可被跨工具发现
  npm run build && npm run check
  ```
- **重评条件**：若上游 Agent Skills 规范或主流客户端放宽目录深度与字符上限，经实测验证后新建规范取代本篇。

## 否决项

- **按宿主维护多份插件目录**：导致技能正文多处复制漂移，违背单一事实源原则；
- **在清单中内嵌密钥或私有地址**：清单随开源仓库全量分发，任何敏感值必须改为由使用者环境变量提供。

## 待确认

无（已于 2026-08-23 定稿冻结）。
