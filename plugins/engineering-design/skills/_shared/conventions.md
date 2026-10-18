# 公共约定：目录、维护器与编号

五个写作技能（`research-er` / `design-er` / `spec-er` / `runbook-er` / `plan-er`）、
`docs-init` 与 `doc-clean` 共用本文件。
业务域词表见 [scope-manage.md](./scope-manage.md)，流转与状态机见 [lifecycle.md](./lifecycle.md)。

## 目录与模式分界

项目文档按「静态工程资产（`docs/`）」与「动态实施计划（`plan/`）」双翼布局：

```text
<project-root>/
├── docs/
│   ├── README.md                    # 文档中心索引：按模式分区导航 + 分模式文档台账
│   ├── scope-manage.md              # Scope 业务域总账（docs 与 plan 共用）
│   └── engineering/                 # 工程研发文档自治域
│       ├── MAINTENANCE.md           # 工程文档维护公约：命名、取号、状态机、演进与归档铁律
│       ├── research/                # 调研模式：现状是什么、外部机制与实测证据
│       ├── design/                  # 设计模式：系统/模块怎样工作、实现与验收
│       ├── spec/                    # 规范模式：跨模块必须遵守什么标准、协议与红线
│       └── runbook/                 # 手册模式：线上如何部署、诊断、止血与恢复
└── plan/                            # 实施计划模式（与 docs/ 同级）
    ├── README.md                    # 计划看板索引：进行中计划 + 已归档计划
    ├── NNNN-<scope>-<title>.md      # 活动中的计划（直接平铺在 plan/ 根下）
    └── archive/                     # 已归档计划（终态文件移入此处）
        └── NNNN-<scope>-<title>.md
```

| 路径                          | 模式             | 性质                                             | 回答的核心问题                                 |
| ----------------------------- | ---------------- | ------------------------------------------------ | ---------------------------------------------- |
| `docs/engineering/research/`  | 调研（research） | 直接结果（无状态）                               | 现状是什么、外部标准与证据是什么               |
| `docs/engineering/design/`    | 设计（design）   | 阶段演进（`draft → rfc → adr`）                  | 具体功能或架构怎样工作、如何实现与验收         |
| `docs/engineering/spec/`      | 规范（spec）     | 阶段演进（`draft → rfc → adr`）                  | 跨模块标准、协议契约与长期红线是什么           |
| `docs/engineering/runbook/`   | 手册（runbook）  | 状态演进（`draft → active → deprecated`）        | 部署变更、告警排查与故障止血怎么操作           |
| `plan/`（含 `plan/archive/`） | 计划（plan）     | 执行推进（`draft → ready → in-progress → done`） | 分几期推进、如何兼容迁移、切换与回滚步骤是什么 |

注意：

1. 目录名（`research` / `design` / `spec` / `runbook` / `plan`）表达**文档模式（体裁）**；
2. `draft` / `rfc` / `adr` 等表达文档内部的**过程阶段（状态）**，不再设为独立目录；
3. `<scope>` 表达**业务域**，取自 `docs/scope-manage.md`，与模式和状态均正交。

## 维护器公约（`docs/engineering/MAINTENANCE.md`）

`docs/engineering/MAINTENANCE.md` 是目标仓库内的工程文档维护约束文件，由 `docs-init` 初始化生成。
任何人在该仓库新增或演进文档时，以 `MAINTENANCE.md` 为维护准则；`docs/README.md` 只负责**按模式分区导航与分表台账**，不再混写维护细则或把不同模式的文档混排。

## 命名

所有受控文档统一命名为：

`NNNN-<scope>-<title>.md`

- `NNNN`：四位数字编号，五大模式（`research` / `design` / `spec` / `runbook` / `plan`）各自维护一条从 `0001` 起的独立递增序列，互不占用；
- `<scope>`：业务域英文单词，取自项目根 `docs/scope-manage.md` 词表；
- `<title>`：kebab-case 英文短标题。

示例：

- 插件标准调研 → `docs/engineering/research/0001-plugin-standards.md`
- 插件编写规范 → `docs/engineering/spec/0001-plugin-guidelines.md`
- Agent Studio 全局重构计划 → `plan/0001-plugin-agent-studio-rollout.md`

## 取号

每个模式单独计数，写哪一类就只看那一类的序列：

1. **工程四模式（`research` / `design` / `spec` / `runbook`）**：只扫描对应目标目录下的现有 `NNNN-*.md` 文件，取最大编号 +1（空目录从 `0001` 起）；
2. **实施计划模式（`plan`）**：因为完结的计划会移入 `plan/archive/`，取新号时**必须同时扫描 `plan/` 根目录与 `plan/archive/` 子目录**，取两处合并后的最大编号 +1（两处皆空从 `0001` 起），严禁与已归档计划撞号；
3. **同模式不复用旧号，跨模式不续号**：同一主题从 `research` 走向 `design`、再拆出 `plan` 时，在各自模式内独立取号，承接关系通过文首 blockquote 链接表达（如 `承接 [0001](../research/0001-xxx.md)`）。

## 登记

- `docs/engineering/{research,design,spec,runbook}/` 下的文档写完或状态变更后，在 `docs/README.md` **对应模式的分表**中登记或更新（编号、文档链接、Scope、状态）；
- `plan/` 与 `plan/archive/` 下的文档写完、推进状态或归档搬移后，在 `plan/README.md` 的「活动计划」或「已归档计划」分表中同步更新。
