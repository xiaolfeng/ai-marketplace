# git-manage

Git 工作流管理插件。把「提交代码」从反复叮嘱变成一句话——分析 diff、生成规范提交信息、直接执行。

## 包含技能

### git-commit

专业的 Git 提交信息生成与提交执行器：

- **五条铁律**：只 commit 绝不 push、禁止 `Co-Authored-By`、中文提交信息、默认单次提交、分析完直接执行不反问
- **规范格式**：`<类型>(<作用域>): <描述>`，11 种类型 + 作用域优先级 + 动词速查表
- **上下文感知**：参考项目 `git log` 的既有命名习惯保持一致
- 支持 Breaking Change、关联议题（`关闭 #123`）与回滚格式

## 安装

```bash
# Claude Code
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install git-manage@xiaofeng-plugins

# 或任意支持 Agent Skills 的工具（78+）
npx skills add xiaolfeng/ai-marketplace --skill git-commit
```

## 使用

完成代码修改后对 AI 说「提交」即可触发；也可显式调用：

```bash
/git-manage:git-commit
```
