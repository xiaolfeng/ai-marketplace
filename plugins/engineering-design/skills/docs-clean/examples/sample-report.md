<!-- 回报样例：整理结束后按此骨架写给用户，替换为本次扫描的事实 -->

# 文档卫生 · 2026-09-03

扫描：`docs/engineering/` + `docs/README.md` + `docs/plan/` · 受控文档 7 篇

## 已修（安全项）

- 补齐 `docs/engineering/MAINTENANCE.md` 维护器公约
- `docs/README.md` 补登 `research/0003-plugin-gap.md`，删掉指向不存在的 `research/0009-plugin-ghost.md`
- `design/0006-plugin-serial.md` 状态 `open` → `draft`（旧初始状态自动对齐为 `draft`）
- `docs/plan/README.md` 更新已归档计划 `0001-plugin-init.md` 的链接指向 `./archive/0001-plugin-init.md`

## 待确认（重命名 / 重编号 / 搬文件）

- `design/` 只有 `0006`，缺 `0001–0005`：像在续 `research` 的号。建议改名为 `design/0001-plugin-serial.md`，并改所有承接链接
- `docs/0004-plugin-lost.md` 落在 `docs/` 根，应搬进对应模式目录
- `docs/plan/0002-plugin-rollout.md` 状态已为 `done`，应移入 `docs/plan/archive/0002-plugin-rollout.md`
- `spec/0001-treehole-oops.md` 的 scope `treehole` 不在 `docs/scope-manage.md` 词表

以上未改。确认后按对照表执行。

## 仍存在

- `design/0006-plugin-serial.md` 相对链接 `./nope.md` 打空，没有唯一同名文件可改
- 外链 404：`https://httpbin.org/status/404`
- `design/0006-plugin-serial.md` 的二级标题更像 `spec`（命中「规范条款」「正反例与边界」「合规与后果」）——只报不搬

## 干净的检查

- 同模式撞号（含 `docs/plan/` 与 `docs/plan/archive/` 跨目录检查）：无
- `research/0001`、`design/0001`、`spec/0001`、`docs/plan/0001` 并存：未误报
