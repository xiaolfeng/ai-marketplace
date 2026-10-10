<!-- init-deep:synced@293803c -->

# bug 知识库

## 概述

缺陷工作流插件：`find-bug` 找运行时正确性与可靠性问题，`find-security-bug`
在授权范围内做安全审查，`fix-bug` 按根因落地最小修复。三条铁律写在技能之间——
发现不修、质量与安全分家、没有复现就没有补丁；共用的清单结构与证据纪律单点
放在 `_shared/`。

## 目录结构

```text
bug/
├── .claude-plugin/plugin.json
├── README.md
└── skills/
    ├── _shared/                         # 三技能共用契约（不被当作技能发现）
    │   ├── finding-schema.md            #   发现 ID · 严重度 · 清单/修复模板
    │   └── evidence.md                  #   三级证据 · 数据流句式 · 安全取证
    ├── find-bug/                        # 质量缺陷发现：只出 Q- 清单
    │   ├── SKILL.md
    │   ├── references/quality-taxonomy.md
    │   ├── examples/scenario.md
    │   └── evals/evals.json
    ├── find-security-bug/               # 安全审查：只出 S- 清单，不写利用
    │   ├── SKILL.md
    │   ├── references/security-taxonomy.md
    │   ├── examples/scenario.md
    │   └── evals/evals.json
    └── fix-bug/                         # 修复执行器：复现 → 根因 → 最小补丁
        ├── SKILL.md
        ├── references/debug-playbook.md
        ├── examples/scenario.md
        └── evals/evals.json
```

每个技能固定四件套（SKILL.md + references + examples + evals），
正文只留工作流骨架，细节按渐进披露下沉。

## 导航指南

| 任务                   | 位置                                                | 说明                         |
| ---------------------- | --------------------------------------------------- | ---------------------------- |
| 改触发词与路由边界     | 三份 SKILL.md frontmatter                           | 负向触发器必须成对出现       |
| 改清单字段或严重度口径 | `_shared/finding-schema.md`                         | 三技能唯一模板               |
| 改证据等级或安全取证   | `_shared/evidence.md`                               | 升级规则与「不算证据」清单   |
| 增删质量类别           | find-bug `references/quality-taxonomy.md`           | C1–C6，安全形状只转交        |
| 增删安全类别           | find-security-bug `references/security-taxonomy.md` | 以 OWASP:2025 为主、CWE 为辅 |
| 改修复阶段与反模式     | fix-bug `references/debug-playbook.md`              | 三次失败停手                 |
| 补触发评测             | 各技能 `evals/evals.json`                           | 负样本必须是近似干扰项       |

## 约定

- **输出契约跨技能统一**：发现用 `Q-` / `S-`，修复记录引用同一 ID；改模板必须
  三份 SKILL 仍只链到 `_shared/`，禁止在正文再复制一份；
- **置信度口径与 research 对齐**：确定 / 倾向 / 存疑，判据换成代码证据三级
  （一级失败测试、二级数据流、三级局部模式）——改词要两边一起看；
- **安全技能默认静态、授权范围先行**：未声明的远程主机与生产环境不碰；
  报告写输入类别与被绕过的检查，不写武器化 PoC；
- **fix-bug 把发现当假说**：标「存疑」的条目复现失败就回写排除，不修想象中的缺陷。

## 反模式

- 边找边改——改动会污染下一处判断，找完再切 `fix-bug`；
- 把空指针、竞态、泄漏直接写成漏洞，或把依赖 CVE 清单当成已证实利用链；
- 用吞异常、放宽类型、删除断言让测试变绿；
- 把手法细节写回 SKILL.md 正文——章节留链接，细节住 references，引用一层深。

## 调试路径

1. 三技能互相抢触发 → 核对三份 description 的正负触发器是否仍成对出现；
2. 报告结构走样 → 模板只有 `_shared/finding-schema.md` 一处事实源；
3. 安全报告里出现 payload → 回 `evidence.md`「安全取证」四条，删利用保留机制。

## 引用

- [research](../research/INITDEEP.md) — 置信度用词的姊妹口径（确定 / 倾向 / 存疑）
- [engineering-design](../engineering-design/INITDEEP.md) — 三次修复仍失败时的结构问题出口
- [git-manage](../git-manage/INITDEEP.md) — 补丁落地后的提交执行器
