<!-- 成品样例：按实际代码改写后，命名 NNNN-<scope>-<title>.md，落盘 docs/engineering/design/ -->

> 状态：draft · 承接 [构建产物入库提案](../rfc/0001-build-dist-commit.md)

## 目标与边界
源清单变更后，`dist/cursor/` 随仓库交付且能在提交前检查是否过期。
本设计覆盖 Cursor 清单导出与本地检查；插件清单仍由现有源文件维护。

## 工作方式
1. `npm run build` 执行 `scripts/build-cursor-manifest.mjs`，读取
   `.claude-plugin/marketplace.json`，通过 `toCursorManifest` 生成 Cursor 清单，
   写入 `dist/cursor/.cursor-plugin/marketplace.json`；
2. `npm run check` 以 `--check` 调用同一脚本，重新计算产物并与磁盘文件逐字比较；
3. 修改源清单的提交同时包含重新构建的产物；检查命令负责发现两者漂移。

## 数据与接口
输入是源清单的 `name`、`owner`、`plugins`。输出根级保留 `name`、`owner`；
元数据从 `metadata` 或根级对应字段读取；每个插件只透传
`PASSTHROUGH_FIELDS` 中存在的字段。输出使用两空格缩进的 JSON，末尾保留换行。
`--check` 只读取产物，不写文件，成功退出码为 0。

## 异常与兼容
源清单缺少 `name`、`owner` 或 `plugins` 时停止导出并报错。
`--check` 读取不到产物或发现内容不一致时退出码为 1，提示运行 `npm run build`。
其他平台继续读取原有源清单；检查失败不会修改磁盘上的产物。

## 验证
- 运行 `npm run build && npm run check`：产物与源清单一致，检查退出码为 0；
- 暂时修改一个可透传字段后运行 `npm run check`：检查退出码为 1；恢复源文件并重新构建；
- 删除临时环境中的产物后运行 `npm run check`：提示缺少产物且退出码为 1；
- 检查最终 diff：只包含预期的源清单变更和对应 Cursor 导出物。

## 待确认
无。
