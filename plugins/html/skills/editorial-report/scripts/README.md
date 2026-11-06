# Editorial Report 辅助脚本（Node.js ESM，零运行时依赖）

## xsu.mjs（默认生成入口）

使用 Node >=18，零第三方 npm 运行依赖。AI 先核验事实、大纲与文案，再写 report.xsu；脚本装配固定 HTML/CSS/JS，生成页不手改。正常写作只读 [XSU 语法和组件说明](../references/xsu.md) 与 [构建生成示例](../examples/example.xsu)，不必全文读模板。浏览器阅读 HTML 无需 Node。

```bash
node <skill-dir>/scripts/xsu.mjs components --preset editorial
node <skill-dir>/scripts/xsu.mjs validate report.xsu --diagnostics-json diagnostics-new.json
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --check
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --warnings-as-errors
node <skill-dir>/scripts/xsu.mjs render report.xsu --out index.html --nav ../report-nav.json
# 仅明确同意覆盖人工旧输出时使用，不与 --check 同用
node <skill-dir>/scripts/xsu.mjs render report.xsu --out legacy.html --force
```

- `<skill-dir>` 为本技能安装目录；参数路径相对当前工作目录，bundle 不依赖仓库 cwd/node_modules，禁止手改分发脚本。
- validate/render 均支持 --warnings-as-errors 与 --diagnostics-json；诊断只创建新文件，拒绝覆盖已有报告或任何输入资源。
- render --check 不写文件；--force 只放开人工输出覆盖，不跳过组件、安全或输入保护。
- 默认 --network offline，禁止外部字体/脚本/JSON 和导航热刷新；Pele 图表需显式 --network connected，不宣称全离线、完整 Mermaid 兼容或供应链安全已验证。
- 根 theme props 为 system/light/dark。editorial 不支持 migrate-replay；该命令仅在 Replay HTML 技能内可用。

## sync-nav.mjs（仅旧 HTML 的导航同步）

仅维护旧手写 HTML：把 report-nav.json 注入其 #report-nav-data 并回填 data-src。新 XSU 生成页禁止用此脚本改写，必须用 render --nav 重建并用相同输入 --check；迁移期间不要对混合合集盲目批量注入。旧 HTML 的导航 JSON 仍是唯一编辑源。

```bash
# 注入 / 更新所有成员页快照
node scripts/sync-nav.mjs <path/to/report-nav.json>

# 只校验：结构、层级（最高两级）、成员存在性、快照是否与 JSON 一致
node scripts/sync-nav.mjs <path/to/report-nav.json> --check
```

JSON 结构、放置规则与消费方式见 [`../references/report-nav.md`](../references/report-nav.md)。
