# git-manage

Git 工作流管理插件。把「提交代码」从反复叮嘱变成一句话——分析 diff、生成规范提交信息、直接执行。

## 包含技能

### git-commit

专业的 Git 提交信息生成与提交执行器：

- **五条铁律**：只 commit 绝不 push、禁止 `Co-Authored-By`、中文提交信息、默认单次提交、分析完直接执行不反问
- **问询协议**：仅 5 种封闭情形允许停下来问（敏感文件 / 危险操作 / scope 模式决议等），并给出标准话术
- **特殊情况手册**：空仓库、合并冲突、hook 失败、detached HEAD、海量删除、子模块指针等 8 类边界场景的处置步骤
- **规范格式**：`<类型>(<作用域>): <描述>`，11 种类型 + 作用域优先级 + 动词速查表 + 好/坏对照示例库
- **上下文感知**：参考项目 `git log` 的既有命名习惯保持一致
- 支持 Breaking Change、关联议题（`关闭 #123`）与回滚格式

## 资源结构

```text
skills/git-commit/
├── SKILL.md                    # 核心流程：铁律 + 问询协议 + 执行步骤
├── references/
│   └── edge-cases.md           # 特殊情况处理手册（E1~E8）
└── examples/
    ├── messages.md             # 标题行/正文好/坏对照示例库
    └── scenarios.md            # 端到端场景演练（含问询话术示范）
```

## 分支技能

除 git-commit 外，插件附带两个本地分支操作技能（跨 Agent Skills 工具通用）：

| 技能 | 语义 | 底层动作 |
| --- | --- | --- |
| `need-merge` | 把源合并入目标：「把 feature/x 合并到 main」 | `git switch <目标> && git merge <源>` |
| `need-rebase` | 把源变基到目标之上：「把 feature/x 变基到 main」 | `git switch <源> && git rebase <目标>` |

两个说法都成立：提全「源 + 目标」按说的来；只提一个分支名时，目标默认当前分支。

两个技能共用安全手册 [`skills/_shared/branch-safety.md`](./skills/_shared/branch-safety.md)：
执行前强制四项前置检查（分支存在、源≠目标、工作区干净、无进行中操作），
并用「谁有谁没有」的提交区间做**方向一致性检测**——待合入为空、批量异常多、
主干被当作源、分支名高度相似等可疑情形都会先向用户确认，避免源/目标填反误操作；
rebase 前还会检测源分支是否已推送并警告历史改写后果。全程只操作本地分支，
绝不代为 push。

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
