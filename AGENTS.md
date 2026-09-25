# 筱锋のAI插件库

面向 AI 编码助手的开源 Skills 与 Plugins 市场；Claude marketplace 清单是手写源，Cursor 清单由脚本导出。

## 工作前

- 修改插件或版本时，同步 `.claude-plugin/marketplace.json`、插件的 `plugin.json` 与根 `README.md`；清单变更后运行 `npm run build` 并保留 `dist/cursor/` 导出物。
- 技能放在 `plugins/<name>/skills/<skill>/` 单层目录；名称使用 kebab-case，不添加运行时依赖，不在清单中写入密钥。
- 提交前运行 `claude plugin validate .`、`npx skills add . --list`、`npm run check`。

## 按需阅读

- 定位模块、修改入口与调试步骤：[项目目录索引](./INITDEEP.md)；进入 `plugins/<name>/` 或 `docs/` 时读取相应目录的 `INITDEEP.md`。
- 编写工程文档：按 [文档中心](./docs/README.md) 的阶段与编号规则执行。
