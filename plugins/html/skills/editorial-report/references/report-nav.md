# report-nav.json · 文档集导航

同一目录下多份报告组成合集时，导航只写一份 `report-nav.json`，不在页面手写链接。新 XSU 页面通过 `render source.xsu --out index.html --nav <report-nav.json>` 内嵌快照；导航变动后逐篇重建。旧手写 HTML 才使用 [sync-nav.mjs](../scripts/sync-nav.mjs)。两条链路不混用，不用 sync-nav 改写 XSU 生成页。

## 放置与命名

- 文件名固定为 `report-nav.json`，放在合集根目录（所有成员页面的公共父目录）；
- 条目里的 `file` 一律相对这个 JSON 所在目录书写，用正斜杠，不写协议、域名或绝对路径；
- 推荐每篇报告一个子目录加 `index.html`（如 `2026-10-12-weekly/index.html`）；
- 单篇报告不成合集：不建 JSON，页面里的槽位保持 `{}`，左栏自动不出现。

## 结构（最高两级）

```json
{
  "name": "2026 Q4 周报合集",
  "updated": "2026-10-19",
  "groups": [
    {
      "label": "十月",
      "items": [
        {
          "file": "2026-10-12-weekly/index.html",
          "title": "W41 · 支付链路专项",
          "desc": "可选：一句话摘要，左栏里最多两行",
          "tag": "可选"
        },
        {
          "file": "2026-10-19-weekly/index.html",
          "title": "W42 · 网关灰度上线"
        }
      ]
    },
    {
      "label": "十一月",
      "items": [
        { "file": "2026-11-02-weekly/index.html", "title": "W44 · 预算复盘" }
      ]
    }
  ]
}
```

| 字段                     | 层级 | 必填 | 说明                                                  |
| ------------------------ | ---- | ---- | ----------------------------------------------------- |
| `name`                   | 顶层 | 否   | 合集名，显示为左栏标题；缺省显示「文档」              |
| `updated`                | 顶层 | 否   | 最后更新日期（`YYYY-MM-DD`），显示在标题旁的小字      |
| `groups[].label`         | 一级 | 否   | 分组名；空串或省略时该组不显示组头                    |
| `groups[].items[].file`  | 二级 | 是   | 相对 JSON 所在目录的路径；`index.html` 与目录写法等价 |
| `groups[].items[].title` | 二级 | 是   | 左栏显示的标题                                        |
| `desc` / `tag`           | 二级 | 否   | 一句话摘要（两行截断）／等宽小签                      |

规则：

- 层级**最高两级**：`groups` → `items`，条目内不允许再嵌套 `items`；
- 顶层也可以直接放 `items`（一级平铺、不分组）；`groups` 与 `items` 同时出现时只认 `groups`；
- 同一个 file 不要出现两次；条目必须有非空 file/title，构建校验出错应修导航源，不依赖浏览器静默丢弃。
- 不往 JSON 里写密钥、绝对路径或 `file://` 地址。

## 页面如何消费

模板把整份 JSON 以快照形式内嵌在页面末尾，运行时脚本负责渲染：

```html
<script
  type="application/json"
  id="report-nav-data"
  data-src="../report-nav.json"
>
  { …report-nav.json 全文… }
</script>
```

- **内嵌快照是渲染数据源**：页面双击用 `file://` 打开也完整可用（本地 `fetch` 会被浏览器拦截，所以不依赖它）；
- XSU 默认 offline 禁用运行时 fetch/导航热刷新，只消费内嵌快照；旧 HTML 或显式 connected 的 HTTP 行为不代表新页默认允许联网。导航变动后必须重新 render --nav。
- **当前页自动识别**：页面 URL 与条目 `file` 归一比对（`index.html` 等价于目录），命中的条目高亮，并自动生成「上一篇 / 下一篇」；
- 页面没被 JSON 收录时左栏照常渲染，只是没有高亮与上下篇。

## 新 XSU 页面工作流

```bash
# 每篇成员使用各自 XSU 源与相同导航输入重建
node <skill-dir>/scripts/xsu.mjs render reports/2026-11-06-weekly/report.xsu --out reports/2026-11-06-weekly/index.html --nav reports/report-nav.json
# 用完全相同输入核对漂移，不写 HTML 或导航
node <skill-dir>/scripts/xsu.mjs render reports/2026-11-06-weekly/report.xsu --out reports/2026-11-06-weekly/index.html --nav reports/report-nav.json --check
```

- --nav 路径按当前工作目录解析，file 仍相对导航 JSON 所在目录；编译器负责路径校验、相对链接与快照转义，不手抄 #report-nav-data。
- 改标题、顺序、链接时先改 JSON，然后逐篇重渲染；--check 比较完整输出，不能只核对导航槽。输出不能覆盖导航、XSU、分片或资源文件。
- 默认 offline 不热刷新导航；普通点击相对 HTML 链接不等于自动网络资源加载。部署时保留相同目录结构。

## 仅旧手写 HTML 的同步工作流

```bash
node <skill-dir>/scripts/sync-nav.mjs reports/report-nav.json
node <skill-dir>/scripts/sync-nav.mjs reports/report-nav.json --check
```

该工具仅服务旧 HTML，按 file 打开成员页、注入 #report-nav-data 并回填 data-src；成员缺槽、文件不存在或超过两级应报错。含新 XSU 页面时不要用它批量改写；新页归编译器重建。禁止手工粘贴导航全文绕过一致性检查。
