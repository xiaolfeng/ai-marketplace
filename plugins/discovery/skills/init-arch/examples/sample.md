# 样例：插件市场的架构入口与层级约束

以下是需核对真实仓库后改写的文件片段。每份文件分别写在标注的落点。

## 根 `AGENTS.md` 节选

```markdown
# 插件市场

插件以 Claude marketplace 格式登记，Cursor 清单由脚本导出。

## 按需阅读
- 找插件位置和操作步骤：[目录索引](./INITDEEP.md)。
- 改清单导出或跨平台依赖：[架构总览](./ARCHITECTURE.md)。
```

## 根 `ARCHITECTURE.md` 节选

```markdown
# 插件市场 · 架构总览

## 系统边界
读取 `.claude-plugin/marketplace.json`，生成供 Cursor 消费的清单；其他平台读取源清单。

## 层级与依赖方向
| 层级 | 职责 | 依赖方向 | 详细约束 |
| --- | --- | --- | --- |
| 清单源 | 记录插件条目与版本 | 被导出层读取 | [清单层](./docs/architecture/manifest.md) |
| 导出层 | 生成 Cursor 格式清单 | → 清单源 | [导出层](./docs/architecture/export.md) |

## 跨层不变量
- 修改插件版本时同步清单源与插件 manifest；运行校验命令核对分发结果。
```

## `docs/architecture/export.md` 节选

```markdown
# 导出层

## 职责与入口
`scripts/build-cursor-manifest.mjs` 读取 Claude 源清单并生成 `dist/cursor/`。

## 依赖与数据流
导出器只读取 `.claude-plugin/marketplace.json`；转换结果写入 Cursor 清单。

## 边界约束
- Cursor 产物由脚本生成：人工改动会使源清单与分发内容漂移；`npm run check` 可检出漂移。

## 验证
- 执行 `npm run build && npm run check`，预期检查通过。

## 相关文件
- [架构总览](../../ARCHITECTURE.md)
```
