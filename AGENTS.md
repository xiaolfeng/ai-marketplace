# AGENTS.md

「筱锋のAI插件库」——面向 AI 编码助手的开源 Skills 与 Plugins 市场。

面向人类读者的说明见 [README.md](./README.md)；插件编写规范见 [docs/plugin-guidelines.md](./docs/plugin-guidelines.md)。

## 架构原则

以 Claude marketplace 格式为**唯一手写的清单源**，其他平台的清单一律由脚本导出：
一份 `.claude-plugin/marketplace.json` 同时服务 Claude Code 原生市场、`npx skills add`、
`npx plugins add`、Codex（legacy 兼容读取）与 ZCode 五类消费方；Cursor 清单由
`npm run build` 从源清单生成到 `dist/cursor/`。

## 目录速览

- `.claude-plugin/marketplace.json` — 市场清单（单一事实源）
- `plugins/<plugin-name>/` — 插件源码（manifest 位于各自 `.claude-plugin/plugin.json`）
- `scripts/build-cursor-manifest.mjs` — Cursor 清单导出器（`--check` 供 CI 校验）
- `dist/cursor/` — Cursor 清单导出产物，随仓库分发（`dist/` 其余内容不入库）

## 维护规则

1. 新增或修改插件后，必须同步更新 marketplace.json 条目（含 version），并运行：
   `claude plugin validate . && npx skills add . --list && npm run build`;
2. 插件命名 kebab-case；SKILL.md 的 `name` 与目录名一致，`description` 写清触发场景且 ≤1024 字符；
3. `skills/` 目录保持单层结构，不使用嵌套分组；
4. 不引入任何运行时依赖；构建脚本保持零依赖 Node（>=18）可执行；
5. 不要把密钥或敏感值写入任何清单文件；
6. 设计文档一律按 `docs/README.md` 规范管理：`draft/research/rfc/design/adr` 五阶段目录 + `NNNN-<scope>-<title>.md` 全局四位编号（scope 取自 `docs/scope-manage.md` 业务域词表），日常写作由 engineering-design 插件执行。
