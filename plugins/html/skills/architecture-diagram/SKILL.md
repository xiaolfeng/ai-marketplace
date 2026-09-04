---
name: architecture-diagram
description: 基于 huashu-design 设计规范生成高保真工业级系统架构全景图（单文件 HTML+SVG）。具备醒目清晰的 Hero 标题模式、明暗色（Dark / Light）双主题无缝切换、平铺工具栏与 SVG/PNG/PDF 多格式导出。严格遵循外层硬核直角、内部图优雅圆角，曼哈顿十字正交走线，折线与末端米字型（45°），八向箭头，直线更高图层展示优先级，零重叠零交叉拓扑布局，全内联 Lucide 矢量图标，杜绝 Emoji 与 AI 霓虹 Slop。
compatibility: Requires modern browser or Node.js >= 18 for verification
license: MIT
metadata:
  version: "0.0.2"
---

# Architecture Diagram · 系统架构拓扑生成器

基于 `huashu-design` 哲学的高保真系统架构与基础设施拓扑生成器。产出单文件自包含（Self-contained）的 `HTML + SVG` 交互式工程图纸，具备印刷级排版质量、严苛的走线几何约束、明暗双主题自适应与工业级视觉审美。

## 资源地图

| 需要什么 | 去哪里 | 说明 |
| --- | --- | --- |
| 基础工程底板模板 | [references/template.html](references/template.html) | 单文件双主题起手模板，开箱即用 |
| SVG 拓扑几何与走线规范 | [references/svg-design.md](references/svg-design.md) | 曼哈顿十字、米字 45° 切角、八向箭头与 Straight-over-Bent 层级 |
| HTML 脚手架与前端工程 | [references/html-scaffolding.md](references/html-scaffolding.md) | Hero 模式、明暗 CSS 变量、平铺导出工具链与安全规范 |
| 完备生产级参考示例 | [examples/example.html](examples/example.html) · [examples/sample-architecture.md](examples/sample-architecture.md) | 全球分布式电商全景架构真实工程样例 |
| 文字越界量化计算器 | `scripts/verify-overflow.mjs` | 物理 BBox 度量与字符排印模型双引擎校验工具 |

---

## 核心设计与几何铁律（摘要）

1. **反 AI Slop 与纯矢量图标**：严禁霓虹发光与脉冲呼吸灯，**100% 杜绝 Emoji**，统一使用内联 Lucide 矢量图标；
2. **外层硬核直角 vs 内部图优雅圆角**：页面边框、按钮、图例全部为硬核直角（`border-radius: 0`），内部节点卡片保持精致微圆角（`rx="6"`）；
3. **Hero 模式 Header 与平铺工具栏**：超粗 800 字重主标题，右上角工具栏严禁收缩，直接平铺明暗切换、复制、PNG、SVG 与 PDF；
4. **走线几何与图层优先级（Straight-over-Bent）**：
   - 长线必须十字星（水平或垂直正交），折线仅允许 45° 米字切角；
   - 箭头严格为 8 个离散米字方向；
   - 同步主数据流与异步事件流严格分道，实现平面零交叉；
   - **直线的图层优先级永远高于折线**（`<g id="connections-straight">` 覆盖于 `<g id="connections-bent">` 之上）；
5. **文字不越界与充裕呼吸感**：节点宽度预留充足，文字距卡片右边框保留 $\ge 12\text{px}$，标签底框保留 $\ge 4\text{px}$。

---

## 执行流程

复制此清单随做随勾：

```
架构图生成进度：
- [ ] 1. 分析系统拓扑层级与通道（Ingress -> Gateway -> Service -> Persistence）
- [ ] 2. 复制 references/template.html 作为起手底板并填写 Hero 标题
- [ ] 3. 规划无交叉走廊，折线置于 bent 层，正交十字直线置于 straight 层
- [ ] 4. 实例化节点并匹配内联 Lucide 图标与低饱和语义色
- [ ] 5. 补充图例面板与技术规格说明卡片
- [ ] 6. 运行 scripts/verify-overflow.mjs 自检确保 0 越界并交付
```

### 第 1 步 · 规划层级与无交叉走廊
按业务调用流向将服务从左到右划分入四大层级：接入端（`35~195`）、网关（`255~420`）、计算集群（`485~855`）、持久化（`920~1150`），规划独立水平走廊以实现 100% 零交叉。

### 第 2 步 · 绘制连线与分层堆叠
- 先在 `<g id="connections-bent">` 中绘制带有 45° 切角的折线与异步回流；
- 后在 `<g id="connections-straight">` 中绘制同步主调用正交直线，确保直线处于视觉上层。

### 第 3 步 · 绘制节点并配置防透底
节点底层铺设 `<rect fill="var(--node-base)"/>` 防走线穿底，挑选匹配语义的 Lucide 图标。

### 第 4 步 · 运行计算器验证越界闭环
```bash
node <skill_dir>/scripts/verify-overflow.mjs <产出的html文件>
```
若存在 `❌ OVERFLOW` 或 `⚠️ TIGHT`，调宽相应节点卡片或调整字号，直至通过校验。

---

## 交付自检清单

- [ ] Header 采用 Hero 模式，大号标题清晰突出，元数据标签完备
- [ ] 右上角工具栏平铺展开（包含明暗切换、复制、PNG、SVG 纯矢量导出、PDF）
- [ ] 全文 0 Emoji，全部采用规范内联的 Lucide 矢量图标
- [ ] 外层容器与卡片坚决直角（`border-radius: 0`），内部节点圆角精致
- [ ] 连线 100% 遵循曼哈顿正交长线、45° 米字切角与八向箭头，直线在折线上方
- [ ] 运行 `verify-overflow.mjs` 退出码为 0，所有文字在框选内部且保留充足呼吸感
