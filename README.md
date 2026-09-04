# 筱锋のAI插件库

> 面向 AI 编码助手的开源插件库 —— 一份插件，多端可用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

本仓库收录为 AI 编码助手（Claude Code、Codex、Cursor 等）打造的 Skills 与 Plugins。
所有插件以 [Agent Skills](https://agentskills.io/specification) 规范编写，以 Claude marketplace 格式作为单一清单源，
因此可以被以下三条通道直接消费，无需任何转换：

| 客户端 / 工具 | 安装命令 |
| --- | --- |
| Claude Code | ```/plugin marketplace add xiaolfeng/ai-marketplace``` |
| 任意支持 Agent Skills 的 agent（78+） | ```npx skills add xiaolfeng/ai-marketplace``` |
| Claude Code / Cursor 插件安装器 | ```npx plugins add xiaolfeng/ai-marketplace``` |

## ✨ 特性

- **一次编写，多端运行** — 技能层遵循开放的 SKILL.md 规范，Claude Code、Codex、Cursor、GitHub Copilot、Gemini CLI、Windsurf 等主流工具通用
- **单一事实源** — 仅维护一份 `.claude-plugin/marketplace.json`，Cursor 清单由脚本导出并随仓库分发
- **开放打包标准** — 插件结构与 [Agent Plugins 1.0](https://agent-plugins.org) 保持兼容
- **安全优先** — 插件不内嵌任何密钥；发布前经过 `claude plugin validate` 校验

## 📁 目录结构

```text
ai-marketplace/
├── .claude-plugin/
│   └── marketplace.json        # 市场清单（唯一手写的索引）
├── plugins/                    # 插件源码
│   └── <plugin-name>/
│       ├── .claude-plugin/
│       │   └── plugin.json     # 插件 manifest
│       └── skills/<skill>/SKILL.md
├── dist/cursor/                # 导出的 Cursor 市场清单（随仓库分发）
└── docs/                       # 项目文档
```

## 🧩 插件列表

| 插件 | 说明 | 版本 |
| --- | --- | --- |
| [git-manage](./plugins/git-manage/) | Git 工作流管理：分析 diff 生成规范化中文提交信息，scope 统一业务域词表 | 0.0.1 |
| [discovery](./plugins/discovery/) | 项目知识库构建：由内到外生成分层 AGENTS.md，让 AI 快速看懂项目 | 0.0.3 |
| [engineering-design](./plugins/engineering-design/) | 工程设计文档管理：draft→research→rfc→adr 全链路 + docs-init 初始化 + doc-clean 卫生整理 | 0.0.3 |
| [research](./plugins/research/) | 双模式调研工作流：常规收集对比 + 对抗性辩论终审产出三要素报告 | 0.0.1 |
| [charm](./plugins/charm/) | 魅力文学：书面文本去 AI 腔 + 对话语感活人化的双技能人文风格改造 | 0.0.1 |
| [html](./plugins/html/) | HTML 视觉与架构图表套件：遵循 huashu-design 规范的高保真系统架构图，十字长线与米字八向折角，杜绝 AI 模板腔 | 0.0.3 |

## ➕ 如何添加插件

1. 在 `plugins/` 下创建插件目录，遵循 [Agent Skills 规范](https://agentskills.io/specification) 编写 `SKILL.md`；
2. 在 `.claude-plugin/marketplace.json` 的 `plugins` 数组中登记条目（名称使用 kebab-case）；
3. 本地验证：

   ```bash
   claude plugin validate .
   npx skills add ./ --list     # 确认技能能被发现
   npm run build                # 同步导出 Cursor 清单
   ```

4. 提交 Pull Request。

### 约定

- 插件与技能命名统一使用 kebab-case；
- 每个 `SKILL.md` 必须包含 `name` 与 `description` 字段（`description` 决定模型的触发匹配，请描述清楚「做什么」与「何时用」）；
- 版本号随每次发布递增——Claude 侧以 version 变化作为更新信号。

## 🔒 安全

- 插件仅包含 Markdown 指令与声明式配置，不收集任何数据；
- 若插件需要 API Token 等敏感信息，仅在 manifest 中声明变量名，值由使用者本地配置；
- 安装前建议审查插件内容——Skills 本质是指令文本，请在信任来源后安装。

## 📄 License

本项目基于 [MIT License](./LICENSE) 开源。
