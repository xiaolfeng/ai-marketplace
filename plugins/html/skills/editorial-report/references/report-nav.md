# report-nav.json · 文档集导航

同一目录下的多份报告组成合集时，导航只写一份 `report-nav.json`：所有成员页面的左栏都由脚本从这份 JSON 渲染，不在任何页面里手写链接列表。新增、改名或调整顺序只改 JSON，再跑一次 [`scripts/sync-nav.mjs`](../scripts/sync-nav.mjs)，全部页面的左栏一起更新，不会随文档增多而失真。

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
- 同一个 `file` 不要出现两次；条目为空或缺 `file`/`title` 的会被静默丢弃；
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
- `data-src` 指向本页相对的 JSON 文件，仅当页面经 `http(s)` 访问时会按需热刷新，JSON 有更新而快照滞后时左栏自动重渲染；
- **当前页自动识别**：页面 URL 与条目 `file` 归一比对（`index.html` 等价于目录），命中的条目高亮，并自动生成「上一篇 / 下一篇」；
- 页面没被 JSON 收录时左栏照常渲染，只是没有高亮与上下篇。

## 同步工作流

```bash
# 1. 新建/修改合集导航后，把快照注入所有成员页并回填 data-src
node plugins/html/skills/editorial-report/scripts/sync-nav.mjs reports/report-nav.json

# 2. 只校验不写入：JSON 结构、成员文件存在性、快照是否与 JSON 一致
node plugins/html/skills/editorial-report/scripts/sync-nav.mjs reports/report-nav.json --check
```

- 脚本按 `file` 清单逐个打开成员页，替换其 `#report-nav-data` 快照并回填 `data-src`，幂等可重复运行；
- 成员页缺 `#report-nav-data` 槽、`file` 不存在、结构超过两级都会报错退出；
- 手工把 JSON 全文粘进页面也可以，但合集超过两篇后一律用脚本，避免手抄漂移。
