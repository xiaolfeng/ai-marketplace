# 实施计划（plan）好坏对照

同一主题：「引入 Cursor 清单单向导出器的分步实施计划」。对比重点是：**每个阶段是否有明确的动作边界、准出检查点（Checkpoint）与回滚退路**。

## 坏例

```markdown
## 实施计划：Cursor 清单导出改造

### 分阶段计划

- 第一阶段：完成技术调研与方案设计。
- 第二阶段：编写导出脚本代码并进行全面测试。
- 第三阶段：上线运行并持续优化迭代。

### 验收与归档标准

功能正常上线即完成。
```

**输在哪**：

1. 「全面测试」「持续优化迭代」是任何项目都能套的废话，没有任何文件位置、命令和阶段准出条件；
2. 没有存量迁移与回滚步骤——如果上线 CI 门禁后存量清单校验不过怎么办？完全没提。

## 好例

```markdown
# Cursor 清单单向导出与 CI 门禁接入计划

> 状态：in-progress · 日期：2026-08-25 · Scope：build
> 承接：[Cursor 清单单向导出与校验设计](../docs/engineering/design/0001-build-cursor-manifest-export.md)

## 目标与范围

将仓库从「仅有 Claude 源清单」平滑推进到「源清单单向导出 `dist/cursor/` + CI 强制校验漂移」，在不中断现有插件安装通道的前提下完成切换。

- **不在范围内**：历史 Git 提交的重写、其他未定型客户端的清单导出。

## 前置条件与风险

- **前置条件**：`.claude-plugin/marketplace.json` 已通过 `claude plugin validate .` 校验；
- **关键风险**：若先开启 CI `--check` 门禁而未提交首版 `dist/cursor/` 产物，会导致主分支 CI 立即变红。必须先落地脚本与首版产物，最后接入 CI 门禁。

## 分阶段计划

1. **阶段 1：实现导出脚本并生成首版产物**
   - **动作**：编写 `scripts/build-cursor-manifest.mjs`，在 `package.json` 注册 `build` 与 `check` 脚本，生成首版 `dist/cursor/.cursor-plugin/marketplace.json`，更新 `.gitignore` 忽略 `dist/` 下除 `cursor/` 外的路径；
   - **准出条件**：本地运行 `npm run build && npm run check` 退出码为 `0`，且 `git status` 无多余未追踪产物。
2. **阶段 2：接入 CI 第三道门并同步文档**
   - **动作**：在 `.github/workflows/validate.yml` 追加 `npm run check` 步骤，更新根 `README.md` 与 `INITDEEP.md` 的发布三连命令说明；
   - **准出条件**：PR 触发 GitHub Actions 三道门全部绿灯通过。

## 迁移与回滚

- **存量过渡**：现有 9 个插件条目无需修改各自 `plugin.json`，由导出脚本一次性全量生成首版 Cursor 清单；
- **回滚预案**：若阶段 2 发现 Cursor 客户端读取导出格式异常，先在 `validate.yml` 移除 `npm run check` 阻断步骤，保留源清单通道正常可用，修好映射逻辑后再恢复门禁。

## 验收与归档标准

- [x] `npm run build && npm run check` 本地零报错通过；
- [x] `claude plugin validate . && npx skills add . --list` 全部通过；
- [ ] 主分支 CI 连续跑通后，将本计划状态改为 `done` 并移入 `plan/archive/`。
```
