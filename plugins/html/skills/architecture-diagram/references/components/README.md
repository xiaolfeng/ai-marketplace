# SVG 组件目录

这里存放可独立打开、可复制 `<g>` 分组复用的中性 SVG 组件。组件只表达通用关系，不包含项目、业务、第三方平台或环境或真实服务信息。

| 文件 | 用途 |
| --- | --- |
| [node-and-flow.svg](node-and-flow.svg) | 标准叶子节点、宽主节点、内部分区与同步流 |
| [stream-flow.svg](stream-flow.svg) | 输入、处理、分支输出的流式拓扑 |
| [layered-services.svg](layered-services.svg) | 同步主链、异步工作节点与直接依赖 |
| [event-flow.svg](event-flow.svg) | 发布者、事件通道与订阅者分支 |
| [security-flow.svg](security-flow.svg) | 外部节点、安全入口、身份校验与内部依赖 |

## 复用约定

1. 保留 `boundaries → connections-bent → connections-straight → connection-labels → nodes` 顺序；
2. 连接使用唯一 `id`，以 `data-from` / `data-to` 指向起止节点，并把首尾坐标吸附到对应卡片边界；
3. 标签通过 `data-label-for` 关联连接；
4. 节点使用 `data-node`，主框使用 `data-node-box`；
5. 内部分区使用 `data-partition` 与 `data-partition-box`；
6. 复制到目标图时，同步复制依赖的 `<marker>` 与图标 `<g id="icon-*">`；
7. 修改文字后重新计算节点尺寸、标签位置、端点与走廊，不只替换文案；
8. 组件只是起点，真实坐标应由语义关系与校验结果决定。
