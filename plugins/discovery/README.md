# discovery

项目探索与知识库构建插件。让 AI Agent 快速「看懂」一个陌生项目——为项目生成分层的结构化认知文档。

## 包含技能

### deep-init

项目知识库分层初始化器：

- **由内到外**的分层生成策略：最深层子目录先写、根目录最后收口，保证上层引用准确无回改
- 子模块 7 段模板 + 根目录扩展段（代码地图 / 模块架构 / 独特风格 / 常用命令），按需启用不写满话
- 增量同步：基于已有文件的 commit hash 做 diff 分析，只更新受影响的段落
- 全中文编写，并在根目录同步极简 `CLAUDE.md`（`@AGENTS.md` 单行引用）

## 安装

```bash
# Claude Code
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install discovery@xiaofeng-plugins

# 或任意支持 Agent Skills 的工具（78+）
npx skills add xiaolfeng/ai-marketplace --skill deep-init
```

## 使用

在目标项目里对 AI 说「初始化知识库」或「deep init」即可触发；也可显式调用：

```bash
/discovery:deep-init
```
