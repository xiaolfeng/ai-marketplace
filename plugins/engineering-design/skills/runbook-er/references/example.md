# 手册（runbook）好坏对照

同一主题：「CI 三道门校验失败与清单漂移排障手册」。对比重点是：**操作者在遇到报错时，能否不靠猜直接按文档在 3 分钟内定位并修复**。

## 坏例

```markdown
## 运维手册：CI 校验失败处理指南

### 触发条件与现象

当提交代码后发现 GitHub Actions 报错时使用本手册。

### 执行步骤

1. 查看 CI 日志，分析报错的具体原因。
2. 如果是清单格式问题，请修复清单格式；如果是版本问题，请同步版本号。
3. 本地重新运行测试，确保没有问题后再次提交。

### 恢复验证

观察 CI 变绿即可。
```

**输在哪**：

1. 全是同义反复的废话（「如果是格式问题请修格式」），没有任何具体命令或文件路径；
2. 缺少前置检查、缺少止血回滚、缺少本地可复现的验证命令；
3. 操作者看完依然不知道该跑哪条命令、改哪个文件。

## 好例

````markdown
# CI 三道门校验失败与 Cursor 清单漂移排障手册

> 状态：active · 日期：2026-08-26 · Scope：build
> 承接：[Cursor 清单单向导出与校验设计](../design/0001-build-cursor-manifest-export.md)

## 触发条件与现象

本地提交前或 GitHub Actions `validate.yml` 流水线在以下任一阶段退出码非 `0`：

1. **门 1（Manifest 校验）**：`claude plugin validate .` 报 schema 或字段错误；
2. **门 2（技能发现检查）**：`npx skills add . --list` 未列出预期技能或某插件技能整体消失；
3. **门 3（导出漂移检查）**：`npm run check` 报错 `dist/cursor/.cursor-plugin/marketplace.json is out of date`。

## 前置检查

1. 确认工作树无未保存的半成品文件与 Node 版本（需 `>=18`）：
   ```bash
   node -v && git status -s
   ```
````

2. 确认唯一事实源 `.claude-plugin/marketplace.json` 为合法 JSON：
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'))"
   ```

## 执行步骤

1. **处置门 3 失败（Cursor 清单漂移）**：
   - 原因：修改了 `.claude-plugin/marketplace.json` 但未重新生成导出物，或误手改了 `dist/cursor/`。
   - 执行重导：
     ```bash
     npm run build && npm run check
     ```
   - 预期结果：`npm run check` 输出无漂移且退出码为 `0`。
2. **处置门 2 失败（技能未被发现或被丢弃）**：
   - 核对 `plugins/<name>/skills/<skill>/SKILL.md` 的 frontmatter `name` 是否与目录名完全一致；
   - 检查 `description` 字符数是否超过 1024 上限（超限会被 ZCode 整体丢弃）：
     ```bash
     node -e "for (const f of process.argv.slice(1)) { const s = require('fs').readFileSync(f,'utf8'); const m = s.match(/description:\s*>?\n([\s\S]*?)\n---/); console.log(f, m ? m[1].trim().length : 'no-match'); }" plugins/*/skills/*/SKILL.md
     ```
3. **处置门 1 失败（插件版本或字段不合规范）**：
   - 核对 `plugins/<name>/.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` 与根 `README.md` 三处版本号是否一致。

## 止血与回滚

- 若自动构建或批量修改导致 `dist/cursor/` 或源清单损坏，立即回退到最近一次干净提交并重跑构建：
  ```bash
  git checkout HEAD -- .claude-plugin/marketplace.json dist/cursor/
  npm run build
  ```
- **禁止动作**：严禁手动编辑 `dist/cursor/.cursor-plugin/marketplace.json` 凑数绕过检查。

## 恢复验证

依次执行三道门连跑命令，全部返回退出码 `0` 且预期技能均在列表中即恢复完成：

```bash
claude plugin validate . && npx skills add . --list && npm run check
```

```

```
