# 检查项

`scan_docs.mjs` 的 `code` / `fix` 与下表一致。规则出处：
编号与目录 → [conventions.md](../../_shared/conventions.md)；
状态机 → [lifecycle.md](../../_shared/lifecycle.md)；
词表 → 目标仓 `docs/scope-manage.md`。

| code               | 查什么                                                                                                                                                                                          | 为何                                             | fix                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| `NUM-DUP`          | 同一模式两个文件共用一个四位编号（含 `docs/plan/` 与 `docs/plan/archive/` 之间撞号）                                                                                                            | 同模式不复用旧号，撞号会导致引用与归档冲突       | ask                                                       |
| `NUM-GAP`          | 同模式从 0001 到最大号有空洞；或最小号大于 0001（像在续别的模式的号）                                                                                                                           | 五大受控模式序列各自独立，均从 0001 起           | ask                                                       |
| `NAME-FORMAT`      | 受控模式文件名不是 `NNNN-<scope>-<title>.md`；或 `docs/develop/`、`docs/reader/` 文件名非 kebab-case                                                                                            | 模式在目录里、阶段在状态里，不在文件名里         | ask                                                       |
| `SCOPE-UNKNOWN`    | 受控文档文件名里的 scope 不在 `docs/scope-manage.md` 词表英文列                                                                                                                                 | 未登记的业务域会和同义词并存                     | ask                                                       |
| `MAINT-MISSING`    | `docs/engineering/MAINTENANCE.md` 缺失                                                                                                                                                          | 缺少仓库级工程文档维护公约                       | safe                                                      |
| `LINK-BROKEN`      | 相对路径指向不存在的文件                                                                                                                                                                        | 承接、归档与索引全靠相对路径                     | 同名文件唯一则 safe，否则 report                          |
| `LINK-EMPTY`       | `[文本]()`、或「承接 0001」不是可点击链接                                                                                                                                                       | 空引用看起来像接上了，其实点不开                 | report                                                    |
| `LINK-HTTP-404`    | 文内 https 返回 404/410；超时或网络失败为 warning                                                                                                                                               | 外链失效读者走不通                               | report                                                    |
| `INDEX-MISSING`    | 工程文档未在 `docs/README.md` 登记，或计划未在 `docs/plan/README.md` 登记                                                                                                                       | 写完要按模式登记，漏登等于文档失踪               | safe                                                      |
| `INDEX-STALE`      | `docs/README.md` 或 `docs/plan/README.md` 链到不存在的受控文档                                                                                                                                  | 索引比目录新，或计划归档进 `archive/` 后没改链接 | safe                                                      |
| `STATUS-ILLEGAL`   | 状态不在该模式合法集；`research` 或 `develop` 写了过程状态；`design/spec/runbook/plan` 缺状态                                                                                                   | 状态机是死命令，错值会让阶段演进读不懂           | 旧初始态（`open`/`proposed`）或缺状态则 safe，其余 report |
| `SUPERSEDE-ONEWAY` | `superseded` 没链后继，或后继文首没回指                                                                                                                                                         | 去向断了，旧文就变成死胡同                       | 后继已有文首 blockquote 则 safe，否则 report              |
| `STAGE-MISMATCH`   | 二级标题明显更像另一个受控模式的骨架                                                                                                                                                            | 文件可能放错模式目录（如把规范写进了 design）    | report                                                    |
| `LOC-WRONG`        | 编号文档落在 `docs/` 根或 `engineering/` 根；顶层存在遗留 `plan/` 目录；`engineering/` 下存在未知或遗留目录（如 `draft/rfc/adr`）；`plan` 终态未进 `docs/plan/archive/` 或活动态误入 `archive/` | 模式目录与归档边界必须严格对齐                   | ask                                                       |

说明：

- `research/0001`、`design/0001`、`spec/0001`、`runbook/0001`、`docs/plan/0001` 同时存在**不是** `NUM-DUP`；
- `docs/engineering/MAINTENANCE.md`、`docs/plan/README.md`、`docs/reader/README.md`、`docs/develop/README.md` 是合法管理/索引文件，不报 `LOC-WRONG`；
- `docs/reader/`（`.html` / `.svg` 直读视图）与 `docs/develop/`（无状态 AI 工程备忘 `.md`）不强制四位编号，不报 `NUM-GAP`；
- `example.com` / `localhost` 外链跳过，避免示例域名误报。
