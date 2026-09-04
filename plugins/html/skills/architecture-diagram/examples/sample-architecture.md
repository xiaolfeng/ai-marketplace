# 企业级电商全景架构示例说明 (Sample Architecture)

本样例文件位于 [example.html](./example.html)，展示了一套典型的高并发、多可用区企业级跨境电商系统全景架构图。

---

## 1. 架构拓扑分层设计

拓扑严格按照系统工程的职责分工，由左向右分层规划：

| 拓扑层级 | 代表组件与技术栈 | 坐标范围 | 走廊与流转策略 |
|---|---|---|---|
| **接入层 (Ingress)** | Web Storefront (Next.js 15), Mobile App (Flutter) | `x: 35 ~ 195` | 通过 HTTPS 与 gRPC-Web 向边缘 Ingress 汇聚 |
| **网关层 (Gateway)** | Cloud Ingress (Envoy / AWS ALB) | `x: 255 ~ 420` | 承接 50k QPS 限流、WAF 防护与 SSL 卸载 |
| **计算集群 (Services)** | IAM Security, Catalog Cluster, Order Processing, Notify Worker | `x: 485 ~ 855` | 4 条平行走廊分道，异步事件经由 Kafka 解耦 |
| **持久层 (Persistence)**| Aurora PostgreSQL, ElastiCache Redis, S3 Lake | `x: 920 ~ 1105`| 读写分离、库存热点缓存与审计日志沉降 |

---

## 2. 核心规约落实核对

- **Hero 模式 Header**：`2.25rem / 800` 超粗主标题，顶部带有 `PRODUCTION BLUEPRINT · ENTERPRISE` 徽章与三大设计准则标签；
- **平铺工具栏（Toolbar Flat）**：平铺展示浅色/深色模式切换、复制、PNG、SVG 纯矢量导出与 PDF 下载 5 键；
- **外层直角 vs 内部圆角**：页面边框、按钮、图例面板全部为硬核直角（`border-radius: 0`），内部节点卡片保留 `rx="6"` 微修饰；
- **走线无交叉与直线最高优先级**：
  - `<g id="connections-bent">`（折线层）先画，包含 45° 切角过渡；
  - `<g id="connections-straight">`（十字直线层）后画，具有更高展示层级；
  - 数据主链路零重叠、零交叉；
- **排印安全与文字不越界**：所有节点宽度扩充至 `160~185px`，经 `verify-overflow.mjs` 物理验证，全部 27 项文字容器 0 越界！
