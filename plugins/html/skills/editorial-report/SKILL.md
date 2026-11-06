---
name: editorial-report
description: 把周报、日报、月报、项目进展、复盘简报、指标简报等报告，从大纲、文案写到受限 XSU，再渲染为单文件 HTML 报告特刊（纸白墨蓝、深浅主题跟随系统）。用户说「写个报告」「出个周报 / 日报 / 月报」「进展汇报」「复盘简报」「HTML 报表」「做成报告页面」时使用。正文口吻沿用用户设定的角色，没有设定时用中性同事口吻。系统架构拓扑图走 architecture-diagram，手绘流程图走 excalidraw-diagram，会话逆向复盘走 replay。
license: MIT
metadata:
  version: "0.3.0"
---

# Editorial Report

先核对事实、策划大纲、写文案，再由 AI 编写受限的 `report.xsu`，用技能自带的编译器渲染 HTML。AI 只负责内容与组件选择，不手写或修改生成的 HTML、CSS、JS。后续正文以 XSU 为可编译事实源；大纲与文案保留为前置审阅记录，重开文案评审时同步修改 XSU 后重新渲染。

## 资源地图

开工先读 [口吻](references/voice.md)，然后按阶段读对应参考。正常写作不必全文读取数千行模板。

文案参考与旧组件目录中残留的「复制模板 / class 填槽」说明仅适用于旧 HTML 路径；本版本默认一律按本技能的 XSU 流程执行，不转回手写页面。

| 阶段       | 阅读入口                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 策划大纲   | [outline.md](references/outline.md)                                                                                                                  |
| 写文案     | [copy.md](references/copy.md)                                                                                                                        |
| 编写 XSU   | [XSU 语法与 editorial 组件](references/xsu.md)、[可编译示例](examples/example.xsu)，再运行 `components --preset editorial` 查精确签名                |
| 选视觉模块 | [视觉规范](references/html-design.md)、[旧组件目录](references/components/README.md)、[旧 HTML catalog](examples/example.html)，按需参考，不整页照搬 |
| 合集导航   | [report-nav.md](references/report-nav.md)；新 XSU 页面用 `render --nav`，旧 HTML 才用 `sync-nav.mjs`                                                 |
| CLI 选项   | [scripts/README.md](scripts/README.md)                                                                                                               |

## 产物落点

用户指定最终 HTML 位置时严格遵从；源码、大纲与文案放在同目录或用户指定的源码目录。否则默认放在项目 `reports/<yyyy-mm-dd>-<slug>/`，不写进技能安装目录。

```text
reports/2026-11-06-weekly/
├── outline.md
├── copy.md
├── report.xsu           # 后续编辑入口
├── sections/            # 可选 XSU 分片
└── index.html           # 编译生成，不手改
```

合集根目录另放一份 `report-nav.json`；页面内的导航快照由编译器派生，不手抄。

## 工作顺序

1. **确认口吻与事实**：按 voice.md 查用户角色设定，有则沿用，没有则用中性同事口吻。缺读者、时段或核心问题时集中澄清；只用有来源的事实。
2. **出大纲**：按 outline.md 写 `outline.md`。用户没说「直接写」时先给大纲确认；已有完整大纲或明确跳过确认也要落盘。
3. **写文案**：按 copy.md 写 `copy.md`，未确认与未完成单独列出，不编进度。
4. **写 XSU**：阅读语法与当前预设组件参考、example.xsu，把已确认文案组织为 `Report`、`Section` 与受支持组件；只选与事实匹配的模块。旧 example.html 是全量视觉目录，不是每篇正文，不等于所有旧状态均已覆盖为 XSU API。缺少组件能力时报告缺口，不修改生成页或模板绕过。
5. **校验并渲染**：以下 `<skill-dir>` 替换为本技能安装目录，路径参数按当前工作目录解析；从任意目录可执行，不依赖仓库根目录或 node_modules。

   ```bash
   node <skill-dir>/scripts/xsu.mjs components --preset editorial
   node <skill-dir>/scripts/xsu.mjs validate reports/2026-11-06-weekly/report.xsu
   node <skill-dir>/scripts/xsu.mjs render reports/2026-11-06-weekly/report.xsu --out reports/2026-11-06-weekly/index.html
   # 合集成员页逐篇重建时附加相同导航输入
   node <skill-dir>/scripts/xsu.mjs render reports/2026-11-06-weekly/report.xsu --out reports/2026-11-06-weekly/index.html --nav reports/report-nav.json
   ```

6. **实际检查再交付**：运行相同 render 命令加 `--check` 核对漂移；在浏览器核对深浅主题、约 390px 移动宽度、目录、合集当前项与上下篇、图表和打印。交付源码与 HTML 路径，明确哪些检查执行过、哪些仍待做。

## 约束与完成标准

- 渲染需 **Node >=18**，无第三方 npm 运行依赖；生成页在现代浏览器打开，无需 Node 或本地服务。
- 默认 `--network offline`：不加载外部字体、脚本、JSON，不热刷新导航；只用系统字体、内嵌资源与原生图表。
- Pele/Mermaid 图表必须显式 `--network connected`；该模式会按需加载锁定的远程 Pele，不宣称全离线或完整 Mermaid 兼容。联网许可不绕过图表限制，也不等于供应链安全保证。
- 主题根属性为 `theme: "system" | "light" | "dark"`，默认 system；不在生成的 HTML 上手写 data-theme。
- `validate` 与 `render` 支持 `--warnings-as-errors` 和 `--diagnostics-json <new-file>`，诊断报告只创建新文件，不覆盖已有报告。错误回到 XSU 修。
- `render --check` 不写 HTML；`--force` 仅明确允许覆盖人工旧输出，不绕过验证、安全或输入保护，不与 --check 同用。
- 不编造数字、完成度、负责人、日期或验证结果；大纲、文案与 XSU 不引入未经确认的新板块。
- 不另写配色、style/className、任意脚本或 RawHTML；不拿其他设计技能覆盖固定视觉。图标由渲染器处理，不用 emoji 充当 UI 图标。
- CLI 成功不能替代视觉、交互、安全或覆盖测试；未实际执行的检查必须记为待验证。
