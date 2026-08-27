<!-- deep-init:synced@94e32fb -->

# 筱锋のAI插件库 · 知识库

## 概述

「筱锋のAI插件库」——面向 AI 编码助手的开源 Skills 与 Plugins 市场。
面向人类读者的说明见 [README.md](./README.md)；插件编写规范见
[docs/plugin-guidelines.md](./docs/plugin-guidelines.md)。

### 架构原则

以 Claude marketplace 格式为**唯一手写的清单源**，其他平台的清单一律由脚本导出：
一份 `.claude-plugin/marketplace.json` 同时服务 Claude Code 原生市场、`npx skills add`、
`npx plugins add`、Codex（legacy 兼容读取）与 ZCode 五类消费方；Cursor 清单由
`npm run build` 从源清单生成到 `dist/cursor/`。

## 目录结构

```text
ai-marketplace/
├── .claude-plugin/marketplace.json   # 市场清单（单一事实源）
├── plugins/<plugin-name>/            # 插件源码（manifest 位于各自 .claude-plugin/plugin.json）
├── scripts/build-cursor-manifest.mjs # Cursor 清单导出器（--check 供 CI 校验）
├── dist/cursor/                      # Cursor 清单导出产物，随仓库分发（dist/ 其余内容不入库）
├── docs/                             # 工程文档 + 插件编写规范 + scope 词表
└── .github/workflows/validate.yml    # CI：三道门校验（validate / 发现检查 / 导出核对）
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 新增或修改插件 | `plugins/<name>/` + `marketplace.json` 登记 | 缺一不可，版本号两处同步 |
| 发布前校验 | 三连命令见「常用命令」 | 本地全绿再提 PR |
| 写工程文档 | `docs/engineering/` 五阶段目录 | 全局四位编号，技能代写 |
| 查或登记 Scope | `docs/scope-manage.md` | Git 提交与工程文档共用词表 |
| 找某层的就地规则 | 见「引用」段各层知识库 | 就近生效，离被编辑文件最近的胜出 |

## 模块架构

| 子系统 | 位置 | 职责 |
| --- | --- | --- |
| 清单源 | `.claude-plugin/marketplace.json` | 唯一手写的市场索引 |
| 插件层 | `plugins/<name>/` | 五个独立插件，互不依赖代码 |
| 导出层 | `scripts/build-cursor-manifest.mjs` → `dist/cursor/` | 源清单字段透传为 Cursor 格式 |
| 文档层 | `docs/` | 上架标准、scope 总账、五阶段工程文档 |

## 代码地图

| 符号 | 类型 | 位置 | 作用 |
| --- | --- | --- | --- |
| `toCursorManifest` | 函数 | `scripts/build-cursor-manifest.mjs` | Claude 条目按白名单字段透传为 Cursor 清单 |

## 独特风格

- **多端兼容靠清单而非适配代码**：需要支持新平台时优先扩展导出脚本的透传逻辑，
  不新增第二份手写清单；
- **`dist/cursor/` 是唯一入库的生成物**：让无 Node 环境的消费方也能读到最新清单，
  因此改动清单后必须重新构建并随同提交，否则仓库分发的就是过期数据。

## 约定

1. 新增或修改插件后，必须同步更新 marketplace.json 条目（含 version），并运行：
   `claude plugin validate . && npx skills add . --list && npm run build`；
2. 插件命名 kebab-case；SKILL.md 的 `name` 与目录名一致，`description` 写清触发场景且 ≤1024 字符；
3. `skills/` 目录保持单层结构，不使用嵌套分组；
4. 不引入任何运行时依赖；构建脚本保持零依赖 Node（>=18）可执行；
5. 不要把密钥或敏感值写入任何清单文件；
6. 设计文档一律按 `docs/README.md` 规范管理：`draft/research/rfc/design/adr` 五阶段目录 +
   `NNNN-<scope>-<title>.md` 全局四位编号（scope 取自 `docs/scope-manage.md` 业务域词表），
   日常写作由 engineering-design 插件执行。

## 反模式

- 手工创建或编辑任何非 Claude 格式的平台清单——它们全是导出物；
- 在 `marketplace.json` 之外再维护一份插件索引——单一事实源会立刻失效；
- 把密钥或敏感值写进清单——清单会被全量分发到每个安装者手里。

## 常用命令

```bash
claude plugin validate .    # 门 1：manifest 校验
npx skills add . --list     # 门 2：跨工具技能发现确认
npm run build               # 门 3 准备：重新导出 Cursor 清单到 dist/cursor/
npm run check               # 门 3：CI 用 --check 核对导出物是否漂移
```

## 调试路径

1. CI 红 → 本地依次跑上面四条命令，定位卡在哪道门；
2. 技能未被某个工具识别 → 先查 `name` 与目录名一致性，再查 `skills/` 是否出现嵌套，
   最后查 `description` 是否超 1024 字符（超限会被 ZCode 整体丢弃）;
3. 版本更新后用户收不到 → 核对 plugin.json 与 marketplace.json 两处 version 是否同步递增，
   Claude 看 manifest 版本、ZCode 看市场条目版本；
4. Cursor 清单报漂移 → 说明只改了源清单没重导，跑 `npm run build` 后随代码一并提交。

## 引用

- [discovery](./plugins/discovery/AGENTS.md) — 项目知识库构建插件（本知识库体系由其 deep-init 技能生成）
- [engineering-design](./plugins/engineering-design/AGENTS.md) — 工程设计文档写作插件
- [git-manage](./plugins/git-manage/AGENTS.md) — Git 工作流插件
- [research](./plugins/research/AGENTS.md) — 双模式调研插件：常规收集对比 + 对抗性辩论终审
- [charm](./plugins/charm/AGENTS.md) — 魅力文学插件：书面去 AI 腔 + 对话口语感人味化
- [docs](./docs/AGENTS.md) — 文档中心：编号、Scope 词表与流转规则
