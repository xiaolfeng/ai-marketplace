# SVG 组件目录

这里存放可独立打开、可复制 `<g>` 分组复用的中性 SVG 组件。组件只表达通用关系，不包含项目、业务、第三方平台或环境或真实服务信息。

视觉以 [example.html](../../examples/example.html) 的 SVG 为基准：低对比度蓝图网格、淡色虚线区域、带不透明底衬的着色节点、内联线性图标，以及不带背景框的连线标签。示例中的具体业务文案不进入组件。

| 文件 | 用途 |
| --- | --- |
| [node-and-flow.svg](node-and-flow.svg) | 标准叶子节点、宽主节点、内部分区与同步流 |
| [stream-flow.svg](stream-flow.svg) | 输入、处理、分支输出的流式拓扑 |
| [layered-services.svg](layered-services.svg) | 同步主链、异步工作节点与直接依赖 |
| [event-flow.svg](event-flow.svg) | 发布者、事件通道与订阅者分支 |
| [security-flow.svg](security-flow.svg) | 外部节点、安全入口、身份校验与内部依赖 |

## 样式与主题

- 使用示例的 `--c-client`、`--c-gateway`、`--c-service`、`--c-storage`、`--c-security`、`--c-message` 六类语义色；外部中性节点使用 `--c-boundary-text`。
- 节点采用 `6px` 圆角、不透明 `--node-base` 底衬、透明度 `0.08–0.1` 的色彩叠层与 `1.25–1.5px` 描边；内部职责使用 `3px` 圆角的淡色标签块。
- 外边界使用 `10px` 圆角与 `6 4` 虚线；内部区域使用 `8px` 圆角与 `4 4` 虚线。网格间距为 `28px`。
- 标题使用 `11.5px / 600` 的 Inter 字体；副标题、职责标签、连线标签分别使用 `9px`、`8px / 600`、`8.5px / 600` 的 JetBrains Mono，并保留系统字体回退。SVG 不加载远程字体。
- 主链优先水平对齐；分支以水平、垂直线为主干，每处原本的直角转弯都用短 `45°` 斜线切角过渡，全图不得混用斜切角与直接直角转弯。标签放在自然留白中，节点尺寸按内容扩展。

独立打开时，CSS 变量的回退值提供与示例一致的深色主题。在根 `<svg>` 上添加 `data-theme="light"` 可切换到浅色。内联到现有 HTML 时，省略该属性以继承宿主页面的同名主题变量；通过 `<img>` 引用的 SVG 不继承页面变量。

每份 SVG 都包含独立的样式、网格、箭头和图标定义，并声明 `viewBox`、`data-export-viewbox`、标题与图形说明。交互与导出按钮由 [HTML 模板](../template.html) 提供。向不支持 CSS 变量的 SVG 工具导出时，应先使用模板的导出流程实体化当前主题样式。

## 复用约定

1. 保留 `boundaries → connections-bent → connections-straight → connection-labels → nodes` 顺序；
2. 连接使用唯一 `id`，以 `data-from` / `data-to` 指向起止节点，并把首尾坐标吸附到对应卡片边界；
3. 标签通过 `data-label-for` 关联连接；
4. 节点使用 `data-node`，主框使用 `data-node-box`；
5. 内部分区使用 `data-partition` 与 `data-partition-box`；
6. 复制到目标图时，同步复制依赖的 `<style>`、`<marker>`、图标和网格 `<pattern>`；根 `<svg>` 保留 `architecture-component` 类，以启用组件作用域内的文字样式。定义 ID 带文件名前缀，如 `node-and-flow-icon-server`，引用必须一起保留；
7. 修改文字后重新计算节点尺寸、标签位置、端点与走廊，不只替换文案；
8. 组件只是起点，真实坐标应由语义关系与校验结果决定；
9. 多份组件组合时，将内容并入目标图的五个现有图层，不重复创建同名图层；统一重命名重复的节点、连接和定义 ID，并同步更新 `href`、`url(#...)`、`data-from`、`data-to`、`data-label-for` 与无障碍标题引用；
10. 移动节点时保留其两层主框：带 `data-node-box` 的底衬负责几何定位，紧邻的色彩叠层负责描边与着色。不要只移动其中一层。
