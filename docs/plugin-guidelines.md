# 插件编写规范

本规范是向「筱锋のAI插件库」提交插件的唯一标准。所有约束均来自各平台官方文档的实测结论，
目的是让一份插件同时服务 Claude Code、Codex、Cursor、ZCode 等全部消费方。

## 目录模板

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json       # 插件 manifest（必需）
├── skills/
│   └── <skill-name>/
│       └── SKILL.md      # 技能定义
└── README.md             # 插件说明
```

可选扩展组件：`commands/*.md`、`agents/*.md`、`hooks/hooks.json`、`.mcp.json`
（Claude / Cursor / ZCode 支持，Codex 忽略）。

## 命名约定

- 插件名与技能名统一使用 kebab-case；
- 插件名须匹配 `^[a-z0-9][a-z0-9._-]{0,127}$`；
- 技能 `name` 必须与其所在目录名完全一致，仅允许小写字母、数字与连字符。

## SKILL.md 要求

```markdown
---
name: my-skill
description: 做什么 + 什么时候用。description 是模型路由的唯一依据。
---
```

- `name` 与 `description` 为必填字段，缺失时技能会被所有客户端忽略；
- `description` 上限 1024 字符，超限会被 ZCode 整体丢弃——长说明请放正文；
- 正文建议 500 行以内，详细参考资料放入 `references/` 按需加载；
- 保持 `skills/` 目录**单层结构**，嵌套分组目录里的技能不会被识别。

## 版本纪律

发版时必须**同步修改两处版本号**：

1. `plugins/<name>/.claude-plugin/plugin.json` 的 `version`；
2. `.claude-plugin/marketplace.json` 中对应条目的 `version`。

Claude 以 manifest 版本、ZCode 以市场条目版本作为更新信号，漏改任意一处用户都收不到更新。

## 上架步骤

1. 按 templates 创建插件目录并完成开发；
2. 在 `.claude-plugin/marketplace.json` 的 `plugins` 数组登记条目
   （`source` 使用 `./plugins/<plugin-name>` 相对路径，并显式声明 `"skills": ["./skills"]`）;
3. 本地校验全部通过：

   ```bash
   claude plugin validate .
   npx skills add . --list     # 确认技能可被跨工具发现
   npm run build               # 重新导出 Cursor 清单
   ```

4. 提交 Pull Request，CI 全绿后合并。
