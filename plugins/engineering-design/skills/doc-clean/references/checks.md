# 检查项

`scan_docs.mjs` 的 `code` / `fix` 与下表一致。规则出处：
编号 → [conventions.md](../../_shared/conventions.md)；
状态 → [lifecycle.md](../../_shared/lifecycle.md)；
词表 → 目标仓 `docs/scope-manage.md`。

| code | 查什么 | 为何 | fix |
| --- | --- | --- | --- |
| `NUM-DUP` | 同一阶段目录两个文件共用一个四位编号 | 同目录不复用旧号，撞号就无法引用 | ask |
| `NUM-GAP` | 同目录从 0001 到最大号有空洞；或最小号大于 0001（像在续别的阶段） | 阶段序列独立，空目录从 0001 起；空洞按约定也报 | ask |
| `NAME-FORMAT` | 文件名不是 `NNNN-<scope>-<title>.md` | 阶段在目录里，不在文件名里 | ask |
| `SCOPE-UNKNOWN` | 文件名里的 scope 不在词表英文列 | 未登记的业务域会和同义词并存 | ask |
| `LINK-BROKEN` | 相对路径指向不存在的文件 | 承接和索引全靠这些路径 | 同名文件唯一则 safe，否则 report |
| `LINK-EMPTY` | `[文本]()`、或「承接 0001」不是链接 | 空引用看起来像接上了，其实点不开 | report |
| `LINK-HTTP-404` | 文内 https 返回 404/410；超时或网络失败为 warning | 外链失效读者走不通 | report |
| `INDEX-MISSING` | 文件存在但 README 没链到；或没有 README | 写完要登记，漏登等于文档失踪 | safe |
| `INDEX-STALE` | README 链到不存在的工程文档 | 索引比目录新或搬过文件没改 | safe |
| `STATUS-ILLEGAL` | 状态不在该阶段合法集；research 写了状态；draft/rfc/adr 缺状态 | 状态机是死命令，错值会让流转读不懂 | 用了别的阶段默认值则 safe，其余 report |
| `SUPERSEDE-ONEWAY` | `superseded` / `resolved` 没链后继，或后继没回指 | 去向断了，旧文就变成死胡同 | 后继已有文首 blockquote 则 safe，否则 report |
| `STAGE-MISMATCH` | 二级标题更像另一个阶段的骨架 | 文件可能放错目录 | report |
| `LOC-WRONG` | 编号文档在 `docs/` 根、`engineering/` 根，或不在五段目录 | 阶段目录是落点，根目录不是 | ask |

`rfc/0001` 与 `adr/0001` 同时存在**不是** `NUM-DUP`。
`design/` 不参与 `STAGE-MISMATCH`（写作技能待补）。
`example.com` / `localhost` 外链跳过，避免示例域名误报。
