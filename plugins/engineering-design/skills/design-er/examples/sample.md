<!-- 成品样例：按实际代码改写后，命名 NNNN-<scope>-<title>.md，落盘 docs/engineering/design/ -->

# Cursor 清单单向导出与校验设计

> 状态：adr · 日期：2025-06-15 · Scope：build
> 承接：[构建产物与平台清单入库惯例调研](../research/0001-build-dist-conventions.md) · 关联规范：[构建产物与源清单单一事实源规范](../spec/0001-build-manifest-single-source.md)

## 目标与边界

源清单 `.claude-plugin/marketplace.json` 变更后，`dist/cursor/` 导出物随仓库交付，并在本地与 CI 提交门禁中拦截未重导的漂移。

- **涉及模块**：`scripts/build-cursor-manifest.mjs`、`package.json` 脚本入口、`dist/cursor/.cursor-plugin/marketplace.json`；
- **不做什么**：
  - 不做 CI 自动回推 commit——避免引入写权限 token 与分支强推风险；
  - 不做多平台通用 AST 转换器——当前仅需白名单字段透传。

| 现状类别   | 内容                                                            |
| ---------- | --------------------------------------------------------------- |
| 当前工作树 | `scripts/build-cursor-manifest.mjs` 已实现导出与 `--check` 校验 |
| 后续规划   | 无额外运行时组件规划                                            |

## 工作方式

1. `npm run build` 执行 `scripts/build-cursor-manifest.mjs`，读取 `.claude-plugin/marketplace.json`，通过 `toCursorManifest` 生成 Cursor 清单并写入 `dist/cursor/.cursor-plugin/marketplace.json`；
2. `npm run check` 以 `--check` 参数调用同一脚本，在内存中生成期望内容并与磁盘产物逐字比较；
3. 修改源清单的提交必须包含重新构建后的 `dist/cursor/` 产物，CI 通过 `npm run check` 拦截遗漏。

## 数据与接口

输入为源清单的 `name`、`owner`、`plugins`。输出根级保留 `name`、`owner`，元数据从 `metadata` 或根级对应字段读取；每个插件条目仅透传 `PASSTHROUGH_FIELDS` 白名单中的字段。输出为两空格缩进 JSON，末尾保留换行。`--check` 只读不写，一致返回退出码 `0`。

## 异常与兼容

- 源清单缺少 `name`、`owner` 或 `plugins` 时立即报错退出（退出码 `1`），不写入半成品文件；
- `--check` 读取不到产物或内容不一致时退出码为 `1`，标准错误输出提示运行 `npm run build`；
- 其他平台安装器继续直读根级 `.claude-plugin/marketplace.json`，不受导出脚本影响。

## 备选与取舍

| 备选方案               | 否决原因                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| `dist/` 全部忽略不入库 | 外部直读 GitHub 仓库的 Cursor 消费方无法在不跑 Node 脚本的情况下获取清单 |
| 双清单人工同步维护     | 违反单一事实源规范，人工记忆两处版本号在赶工时必然漏改                   |

**重新评估条件**：当 Cursor 官方支持直接读取 `.claude-plugin/marketplace.json` 且不再需要独立 `.cursor-plugin/` 目录时，废弃本导出脚本并移除 `dist/cursor/`。

## 验证

- 运行 `npm run build && npm run check`：产物与源清单一致，退出码为 0；
- 临时修改源清单一个透传字段后运行 `npm run check`：退出码为 1；恢复并重新构建后恢复为 0；
- 删除临时环境中的产物后运行 `npm run check`：提示缺少产物且退出码为 1。

## 待确认

无（已于 2025-06-15 定稿冻结）。
