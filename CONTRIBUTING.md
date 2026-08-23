# 贡献指南

感谢关注「筱锋のAI插件库」！欢迎通过 Pull Request 提交或改进插件。
动手前建议先读 [AGENTS.md](./AGENTS.md)——它是面向 AI 与贡献者的项目知识库入口。

## 环境准备

- Node >= 18（构建脚本零依赖，克隆后**无需** `npm install`）；
- 运行校验需要 Claude Code CLI：`npm install -g @anthropic-ai/claude-code`；
- 跨工具发现检查会调用 `npx skills`，首次运行自动下载。

## 如何添加插件

1. 在 `plugins/<plugin-name>/` 下创建插件目录，遵循
   [Agent Skills 规范](https://agentskills.io/specification) 编写 `SKILL.md`，
   目录模板与字段要求见 [docs/plugin-guidelines.md](./docs/plugin-guidelines.md)；
2. 在 `.claude-plugin/marketplace.json` 的 `plugins` 数组中登记条目；
3. 本地校验全部通过：

   ```bash
   claude plugin validate .
   npx skills add ./ --list     # 确认技能能被发现
   npm run build                # 同步导出 Cursor 清单
   ```

4. 提交 Pull Request，CI 三道门全绿后合并。

## 命名与版本约定

- 插件名与技能名统一 kebab-case，技能 `name` 必须与其所在目录名完全一致；
- SKILL.md 的 `description` 写清「做什么」与「何时用」，上限 1024 字符；
- 发版时同步递增两处版本号：插件自己的 `.claude-plugin/plugin.json`
  与 `marketplace.json` 对应条目——漏改任意一处用户都收不到更新。

## 提交规范

提交信息格式为 `<类型>(<作用域>): <描述>`，中文描述；作用域取
[docs/scope-manage.md](./docs/scope-manage.md) 词表的 **2 字中文列**
（如 `feat(市场): 初始化清单结构`），确属新域时先登记词表再使用。
本仓库可直接使用自带的 git-manage 插件生成合规提交信息。

## PR 注意事项

- 保持每个 PR 聚焦一个插件或一类改动，便于评审与回滚；
- 不要手工编辑 `dist/cursor/` 导出物——它由 `npm run build` 生成，
  改动清单后重新构建并随同提交即可；
- 不要把密钥或敏感值写入任何清单文件。
