# agent-studio 目录索引

## 入口

[README.md](README.md) 描述个人全局 Agent 体系构建的边界与独立使用方式；[SKILL.md](skills/agent-studio/SKILL.md) 是唯一技能入口，[interview.md](skills/agent-studio/references/interview.md) 定义按目标展开的问答。修改插件需同步 manifest、根市场清单与根 README，随后构建 Cursor 导出。

## 代码地图

| 路径                                        | 职责                                         |
| ------------------------------------------- | -------------------------------------------- |
| skills/agent-studio/scripts/cli.mjs         | 参数、全局/项目作用域解析与命令分派          |
| skills/agent-studio/scripts/host.mjs        | 会话宿主识别与适配器登记                     |
| skills/agent-studio/scripts/models.mjs      | 模型用途 profile、精确固定或继承策略         |
| skills/agent-studio/scripts/catalog.mjs     | 宿主真实模型目录快照、筛选与字段校验         |
| skills/agent-studio/scripts/definitions.mjs | Agent/Workflow 校验、角色生成与覆盖保护      |
| skills/agent-studio/scripts/exports.mjs     | 已有角色发现、可脱离插件的 Workflow 技能导出 |
| skills/agent-studio/scripts/runs.mjs        | 仅兼容 0.0.1 的项目运行记录                  |
| skills/agent-studio/scripts/store.mjs       | 配置根内路径检查、合作锁与原子写入           |
| skills/agent-studio/references/contracts.md | 参数、数据、默认位置与兼容契约               |
| skills/agent-studio/examples/               | 默认模型 Agent 与任意领域顺序流程示例        |
| tests/global.test.mjs                       | 隔离 HOME 的全局路径、模型目录与独立导出测试 |
| tests/studio.test.mjs                       | 旧项目生成、工件快照与顺序运行兼容测试       |

## 验证

运行 `npm test`。保持 Node.js >=18 和零第三方运行时依赖。技能必须自包含，不能引用只随整个插件安装的外置脚本；生成的角色与工作流也不能依赖构建插件脚本。真实模型调用、宿主加载与问答体验须单独验收，静态文件校验不替代这些结果。
