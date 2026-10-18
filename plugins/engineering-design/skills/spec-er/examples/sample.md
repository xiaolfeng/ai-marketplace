<!-- 成品样例：复制本文件后替换为你的内容。命名 NNNN-<scope>-<title>.md，落盘 docs/engineering/spec/ -->

# 构建产物与源清单单一事实源规范

> 状态：adr · 日期：2025-06-14 · Scope：build
> 承接：[构建产物与平台清单入库惯例调研](../research/0001-build-dist-conventions.md)

## 适用范围与背景

「哪些构建产物随仓库提交、哪些忽略」在多次 PR 中反复争论，且发生过手改导出清单导致与源清单不一致的事故。本规范管辖仓库根级 `.claude-plugin/`、`dist/` 目录与提交门禁。

## 规范条款

1. **`.claude-plugin/marketplace.json` 是全仓唯一允许手写的市场索引。**
   严禁手动编辑 `dist/` 下的任何文件。导出清单只允许通过 `npm run build` 生成，手改产物的变更一律不予合并。
2. **`dist/cursor/` 作为直读交付物入库，`dist/` 其余子路径一律加入 `.gitignore`。**
   前者被外部安装器直接按 GitHub 路径读取，消费方无法自行构建；后者可从源码确定性重建，禁止入库污染提交历史。
3. **凡修改源清单中任一透传字段，必须在同一提交内重跑 `npm run build` 并提交更新后的 `dist/cursor/`。**
   豁免条件：仅修改不参与透传的内部注释或非清单文件时，产物无变化无需额外交付。

## 正反例与边界

- ✅ **合规**：在 `.claude-plugin/marketplace.json` 新增插件条目后运行 `npm run build && npm run check`，将源清单与 `dist/cursor/.cursor-plugin/marketplace.json` 一起提交。
- ❌ **违规**：只提交了 `.claude-plugin/marketplace.json` 的版本更新，未运行 `npm run build` 导致 `dist/cursor/` 停留在旧版本。
- ❌ **违规**：将本地临时打包生成的 `dist/tmp-bundle.zip` 一并 `git add` 入库。

## 合规与后果

- **收益与代价**：彻底消除源清单与导出清单的数据脱钩；代价是清单改动 PR 必须包含构建产物 diff。
- **校验与暴露方式**：提交前与 CI 流水线强制执行 `npm run check`，一旦 `dist/cursor/` 与源清单计算结果不一致即以退出码 `1` 报错阻断。
- **重评条件**：若未来引入独立发版制品库（Release Artifacts）且客户端改为读取 Release 而非主分支目录，可新建规范取代本篇。

## 否决项

- **CI 发布时动态注入产物并回推主分支**：当前无独立发版流水线，为此引入机器人写凭证与分支同步冲突得不偿失；
- **双清单人工同步**：人工维护两处 JSON 必然遗漏，不具备工程可维护性。

## 待确认

无（已于 2025-06-14 定稿冻结）。
