<!-- 成品样例：复制本文件后替换为你的内容。命名 NNNN-<scope>-<title>.md，落盘 docs/engineering/runbook/ -->

# Cursor 导出清单漂移与构建门禁恢复手册

> 状态：active · 日期：2025-06-16 · Scope：build
> 承接：[Cursor 清单单向导出与校验设计](../design/0001-build-cursor-manifest-export.md)

## 触发条件与现象

执行 `npm run check` 或 CI `validate.yml` 时失败退出（退出码 `1`），控制台提示 `dist/cursor/.cursor-plugin/marketplace.json` 缺失或与 `.claude-plugin/marketplace.json` 内容不一致。

## 前置检查

1. 检查 Node.js 运行环境（要求 `>=18`）：
   ```bash
   node --version
   ```
2. 检查当前分支对 `.claude-plugin/marketplace.json` 与 `dist/cursor/` 的本地改动：
   ```bash
   git status -s .claude-plugin/ dist/cursor/
   ```

## 执行步骤

1. **重新从唯一源导出 Cursor 清单**：
   ```bash
   npm run build
   ```
   - 预期结果：命令以退出码 `0` 结束，`dist/cursor/.cursor-plugin/marketplace.json` 被更新。
2. **审查导出物 diff 是否与源清单改动一一对应**：
   ```bash
   git diff dist/cursor/.cursor-plugin/marketplace.json
   ```
   - 预期结果：仅包含本次在 `.claude-plugin/marketplace.json` 中新增或修改的透传字段变更。

## 止血与回滚

- 若 `npm run build` 报源清单缺少 `name`、`owner` 或 `plugins` 字段，说明源清单 JSON 被破坏，先恢复源清单再构建：
  ```bash
  git checkout HEAD -- .claude-plugin/marketplace.json
  npm run build
  ```
- 严禁直接手改 `dist/cursor/` 下的 JSON 文件。

## 恢复验证

运行只读检查命令，确认退出码为 `0`：

```bash
npm run check
```
