<!-- deep-init:synced@76c9216 -->

# 项目知识库

> 本文件是 deep-init 黄金样例（节选），展示根 AGENTS.md 的基础段与扩展段的取舍。

## 概述

「筱锋のAI插件库」：面向 AI 编码助手的开源 Skills 与 Plugins 市场，
以 Claude marketplace 格式为唯一手写清单源，其他平台清单一律由脚本导出。

## 目录结构

```text
ai-marketplace/
├── .claude-plugin/marketplace.json   # 市场清单（单一事实源）
├── plugins/            # 插件源码，每个插件自带 manifest
├── scripts/            # 零依赖 Node 构建脚本
├── dist/cursor/        # Cursor 清单导出产物（随仓库分发）
└── docs/               # 工程文档（五阶段目录）
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 新增插件 | `plugins/<name>/` + marketplace.json 登记 | 缺一不可 |
| 校验插件 | `claude plugin validate .` | 提交前必跑 |
| 跨工具发现检查 | `npx skills add . --list` | 确认技能可被发现 |
| 重新导出 Cursor 清单 | `npm run build` | CI 用 `--check` 校验 |

## 代码地图

| 符号 | 类型 | 位置 | 作用 |
| --- | --- | --- | --- |
| `toCursorManifest` | 函数 | `scripts/build-cursor-manifest.mjs` | Claude 条目 → Cursor 清单字段透传 |

## 约定

- 一份 `.claude-plugin/marketplace.json` 同时服务五类消费方，禁止手工维护其他平台清单；
- 构建脚本保持零依赖、Node ≥18 可执行，因为消费方环境不可控；
- 设计文档走 docs/ 五阶段流程（draft/research/rfc/design/adr）。

## 反模式

- 把密钥或敏感值写入任何清单文件——清单会被全量分发；
- 在 `skills/` 目录下建嵌套分组——嵌套技能不会被任何客户端识别。

## 常用命令

```bash
claude plugin validate .      # manifest 校验
npx skills add . --list       # 跨工具技能发现确认
npm run build                 # 导出 Cursor 清单到 dist/cursor/
```

## 调试路径

1. 技能未被触发 → 核对 description 触发短语与目录名一致性；
2. 校验失败 → 运行 `claude plugin validate .` 与 `npm run build -- --check` 定位；
3. 清单导出漂移 → 确认只改了 marketplace.json 后重新执行 `npm run build`。

## 引用

- [git-manage](./plugins/git-manage/AGENTS.md) — Git 工作流插件集
- [engineering-design](./plugins/engineering-design/AGENTS.md) — 工程文档体系插件
- [discovery](./plugins/discovery/AGENTS.md) — 项目知识库构建插件（本技能所在）
