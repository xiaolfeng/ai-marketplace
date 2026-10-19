# Editorial Report 辅助脚本（Node.js ESM，零运行时依赖）

## sync-nav.mjs（合集导航快照同步）

把 `report-nav.json` 的全文注入所有成员页面的 `#report-nav-data` 槽位，并按页面位置回填 `data-src`。JSON 是唯一编辑源，页面快照一律由脚本生成。

```bash
# 注入 / 更新所有成员页快照
node scripts/sync-nav.mjs <path/to/report-nav.json>

# 只校验：结构、层级（最高两级）、成员存在性、快照是否与 JSON 一致
node scripts/sync-nav.mjs <path/to/report-nav.json> --check
```

JSON 结构、放置规则与消费方式见 [`../references/report-nav.md`](../references/report-nav.md)。
