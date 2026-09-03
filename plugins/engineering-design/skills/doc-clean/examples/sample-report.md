<!-- 回报样例：整理结束后按此骨架写给用户，替换为本次扫描的事实 -->

# 文档卫生 · 2026-09-03

扫描：`docs/engineering/` + `docs/README.md` · 文件 6 篇

## 已修（安全项）

- 索引补登 `research/0003-plugin-gap.md`
- 索引删掉指向不存在的 `research/0009-plugin-ghost.md`
- `rfc/0006-plugin-serial.md` 状态 `open` → `draft`（用了草案的默认值）

## 待确认（重命名 / 重编号 / 搬文件）

- `rfc/` 只有 0006，缺 0001–0005：像在续 research 的号。建议改名为 `rfc/0001-plugin-serial.md`，并改所有承接链接
- `docs/0004-plugin-lost.md` 落在 docs 根，应搬进对应阶段目录
- `draft/0001-treehole-oops.md` 的 scope `treehole` 不在词表

以上未改。确认后按对照表执行。

## 仍存在

- `rfc/0006-plugin-serial.md` 相对链接 `./nope.md` 打空，没有唯一同名文件可改
- 外链 404：`https://httpbin.org/status/404`
- 该 rfc 的二级标题更像 adr（命中「决定」「否决项」）——只报不搬

## 干净的检查

- 同目录撞号：无
- rfc/0001 与 adr/0001 并存：未误报（本例 rfc 尚未从 0001 起）
