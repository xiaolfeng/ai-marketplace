<!-- 成品样例：活动态平铺于 plan/NNNN-<scope>-<title>.md；终态移入 plan/archive/NNNN-<scope>-<title>.md -->

# 构建产物收敛与 Cursor 清单导出实施计划

> 状态：ready · 日期：2025-06-15 · Scope：build
> 承接：[Cursor 清单单向导出与校验设计](../docs/engineering/design/0001-build-cursor-manifest-export.md) · [构建产物与源清单单一事实源规范](../docs/engineering/spec/0001-build-manifest-single-source.md)

## 目标与范围

按已定稿的设计与规范，清理历史散落的构建临时文件，落地 `scripts/build-cursor-manifest.mjs` 导出器与 `dist/cursor/` 交付物，并接入提交门禁。

## 前置条件与风险

- **前置条件**：Node.js `>=18`，根 `.claude-plugin/marketplace.json` 字段完整；
- **风险控制**：先完成导出产物入库，再开启 `--check` 门禁，防止门禁空跑报错。

## 分阶段计划

1. **阶段 1：收敛 `.gitignore` 与落地导出脚本**
   - **动作**：新增 `scripts/build-cursor-manifest.mjs`，配置 `.gitignore` 忽略 `dist/*` 但保留 `!dist/cursor/`，运行 `npm run build` 生成首版产物；
   - **准出条件**：`npm run check` 返回退出码 `0`，`dist/cursor/.cursor-plugin/marketplace.json` 字段与源清单一致。
2. **阶段 2：接入 CI 门禁与门面文档**
   - **动作**：在 `.github/workflows/validate.yml` 登记 `npm run check`，更新 `README.md` 与 `AGENTS.md` 工作流说明；
   - **准出条件**：全套校验 `claude plugin validate . && npx skills add . --list && npm run check` 全绿。

## 迁移与回滚

- **存量清理**：已被 Git 追踪的非 `dist/cursor/` 构建产物通过 `git rm --cached` 移出版本控制；
- **回滚预案**：若导出脚本在 CI 环境出现路径兼容问题，先回退 `validate.yml` 的 `npm run check` 步骤，修复 POSIX 路径处理后再重新启用。

## 验收与归档标准

- [ ] 阶段 1 与阶段 2 准出条件全部达成；
- [ ] 变更合并后，将本文状态改为 `done`，从 `plan/` 移入 `plan/archive/`（并将文首 `../docs/` 链接更新为 `../../docs/`），在 `plan/README.md` 移入「已归档计划」表。
