# html

HTML 视觉与架构图表套件。遵循 `huashu-design` 设计规范，面向系统架构师与工程团队，产出高保真、印刷级质感的系统全景拓扑图与技术图纸组件。

## 包含技能

### architecture-diagram

系统架构全景拓扑生成器。输出单文件自包含（Self-contained）的 `HTML + SVG` 交互式技术图纸，具备以下特性：

- **遵循 huashu-design 反 AI Slop 哲学**：
  - 彻底摒弃烂大街的暗蓝底色配青粉紫发光霓虹（GitHub-dark 偷懒解）；
  - 采用工业级深灰板岩底（`#090d16`）与浅色白皮书底（`#f8fafc`）明暗双主题一键平滑切换；
  - 严谨的排印阶梯：800 字重超粗 `Inter` Hero 模式标题搭配 `JetBrains Mono` 技术代号；
  - 外层容器坚决采用**硬核直角（`border-radius: 0`）**，内部节点保留精致微圆角（`rx="6"`）。
- **纯粹矢量图标体系（杜绝 Emoji）**：
  - 工具栏、状态标签、架构节点与图例中**严禁使用任何 Emoji**；
  - 全面使用规范统一的 **Lucide 矢量图标**（内联 SVG，无外部网络依赖，离线可用）。
- **五项走线几何与层级硬约束**：
  - **长线十字星**：长距离主干走线 100% 保持曼哈顿正交（水平 $\Delta y = 0$ 或垂直 $\Delta x = 0$）；
  - **米字折角与收尾**：拐角优先直角折弯，偏置（dogleg）或倒角（chamfer）严格采用 45° 米字方向；
  - **八向离散箭头**：箭头末端切线严格限制在米字型 8 个离散角度（`0°`, `45°`, `90°`, `135°`, `180°`, `225°`, `270°`, `315°`）；
  - **零交叉走廊布局**：按照「接入 $\rightarrow$ 网关 $\rightarrow$ 服务 $\rightarrow$ 存储」分层排布，异步流与安全流走外围上下通道，确保主数据流无交叉；
  - **直线展示优先级高于折线（Straight-over-Bent）**：直线处于上层渲染组，折线处于底层，杜绝折线压盖主直线。
- **平铺展开工具栏与 SVG 导出**：
  - 工具栏平铺展开，一键支持明暗主题切换、复制图片到剪贴板、导出 2x PNG、**导出原生矢量 SVG** 及无损 PDF。
- **文字越界量化计算器（Text Overflow Verifier）**：
  - 内置 `scripts/verify-overflow.mjs`，支持无头浏览器物理测量与纯数学字符排印模型双引擎，自动量化计算每一个文字是否溢出其外部框选容器，确保 0 越界与充裕呼吸感。
- **渐进披露规范架构**：
  - 核心执行清单收敛于 `SKILL.md`；
  - 规范技术手册下沉于 `references/`（SVG 规范、HTML 脚手架、起手模板 `template.html`）；
  - 完备生产级样例放于 `examples/`（`example.html`）。

## 安装

```bash
# Claude Code
/plugin marketplace add xiaolfeng/ai-marketplace
/plugin install html@ai-marketplace

# 或任意支持 Agent Skills 的工具
npx skills add xiaolfeng/ai-marketplace --skill architecture-diagram
```

## 使用

在对话中提出系统架构绘图需求即可自动触发，例如：

- 「帮我画一个电商中台的微服务架构全景图」
- 「为我们当前的 K8s 集群与云基础设施画一张网络拓扑图」
- 「把这个系统的流转链路做成一个支持明暗色切换且带 SVG 导出的 HTML 架构图」
