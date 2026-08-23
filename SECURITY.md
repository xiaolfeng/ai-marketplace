# 安全策略

## 支持范围

本策略覆盖：

- 市场清单 `.claude-plugin/marketplace.json` 及其导出物 `dist/cursor/`；
- `plugins/` 下的全部插件（当前为 discovery、engineering-design、git-manage）的最新版本。

历史版本不单独维护，修复以新版本发布的形式交付。

## 如何上报漏洞

请使用 GitHub 的**私密漏洞报告**渠道：
仓库页 → Security → Report a vulnerability。

**不要通过公开 issue、PR 或讨论区披露安全问题。**
插件会被安装到用户环境中执行，公开披露会放大影响面。

## 处理流程

1. 确认收到报告后尽快评估；
2. 修复期间与报告者保持沟通，修复发布前不公开细节；
3. 以新版本形式发布修复，并在版本说明中致谢报告者（除非要求匿名）。

## 补充说明

- 插件仅包含 Markdown 指令与声明式配置；discovery 插件附带零依赖 Node 脚本，
  其行为边界以 `SKILL.md` 与 `README.md` 的描述为准——若发现插件实际行为
  与文档声明不符，同样请按上述私密渠道报告；
- 若插件需要 API Token 等敏感信息，仅在 manifest 中声明变量名，
  值由使用者本地配置，本仓库不接受任何形式的密钥提交。
