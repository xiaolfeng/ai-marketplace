# agent-studio 目录索引

## 入口

[README.md](README.md) 描述产品边界和用法；
[SKILL.md](skills/agent-studio/SKILL.md) 是唯一技能入口。修改本插件需要同步
`.claude-plugin/plugin.json`、根市场清单与根 README，随后构建 Cursor 清单。

## 代码地图

| 路径                                        | 职责                                        |
| ------------------------------------------- | ------------------------------------------- |
| skills/agent-studio/scripts/cli.mjs         | 参数校验、宿主上下文、命令分派和 JSON 输出  |
| skills/agent-studio/scripts/host.mjs        | 识别进程标记、初始化与适配器登记            |
| skills/agent-studio/scripts/models.mjs      | 模型注册表、按宿主精确解析                  |
| skills/agent-studio/scripts/definitions.mjs | Agent/Workflow 校验、原生配置生成与覆盖保护 |
| skills/agent-studio/scripts/runs.mjs        | 启动快照、当前步骤、工件验收与继续          |
| skills/agent-studio/scripts/store.mjs       | 路径检查、合作锁、原子单文件写入            |
| skills/agent-studio/references/contracts.md | 参数、数据、错误与兼容契约                  |
| skills/agent-studio/examples/               | 可修改的中性业务示例                        |
| tests/studio.test.mjs                       | 临时项目中的脚本与 CLI 测试                 |

## 验证

运行 `node --test plugins/agent-studio/tests/studio.test.mjs`。脚本必须保持 Node.js >=18
和零第三方运行时依赖。技能自包含：不可引用只随完整插件安装的外置共享脚本。
宿主目录不是活跃宿主证据；模型登记不是可用性验证；工件检查不是语义验证。
