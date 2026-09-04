# html 知识库

## 概述

HTML 视觉与架构图表套件插件，当前收录技能 `architecture-diagram`：用于遵循 `huashu-design` 规范生成高保真系统架构图、网络拓扑图与技术图纸组件。核心目标是彻底消除 AI 自动生成的模板腔（AI Slop），提供严谨正交走线、米字八向折角与箭头、Lucide 矢量图标、有序结构化图例以及单文件便携导出能力。

## 目录结构

```text
html/
├── .claude-plugin/plugin.json   # 插件 manifest（版本与 marketplace.json 同步）
├── README.md                    # 面向插件用户的功能说明
├── AGENTS.md                    # 本层知识库
└── skills/
    └── architecture-diagram/
        ├── SKILL.md             # 架构图生成主执行清单（渐进披露架构）
        ├── references/          # 规范指南与底板模板
        │   ├── svg-design.md    # SVG 描述规范、坐标系与走线层级
        │   ├── html-scaffolding.md # HTML 界面构建、Hero 模式、双主题与导出
        │   └── template.html    # 标准工程底板模板
        ├── examples/            # 生产级完备参考样例
        │   ├── example.html     # 全球电商分布式架构完备样例
        │   └── sample-architecture.md # 样例设计背景与链路说明
        └── scripts/
            └── verify-overflow.mjs # 文字越界量化计算器（物理度量 + 字符排印模型）
```

## 导航指南

| 任务 | 位置 | 说明 |
| --- | --- | --- |
| 调整起手底板样式或导出逻辑 | `skills/architecture-diagram/references/template.html` | 保持纯单文件架构，内联 Lucide SVG，无外部依赖 |
| 查阅 SVG 描述与走线规范 | `skills/architecture-diagram/references/svg-design.md` | 曼哈顿正交、米字 45° 切角、八向箭头与 Straight-over-Bent 规则 |
| 查阅 HTML 构建与导出工程规范 | `skills/architecture-diagram/references/html-scaffolding.md` | Hero 模式、明暗主题 CSS 变量、平铺工具栏与导出函数 |
| 查看完整生产级参考样例 | `skills/architecture-diagram/examples/example.html` | 经过 0 越界验证的全球电商微服务架构全景蓝图 |
| 验证图纸文字是否越界 | `skills/architecture-diagram/scripts/verify-overflow.mjs` | 支持无头浏览器物理度量与纯数学算法双引擎 |
| 调整触发词与场景描述 | `SKILL.md` frontmatter 的 `description` | 控制技能唤醒边界，保持 ≤1024 字符 |

## 核心规约

1. **反 AI Slop 铁律**：严禁霓虹荧光发光（避免 `#22d3ee` / `#a78bfa` 霓虹套路）；严禁呼吸灯动效；严禁在任何地方使用 Emoji（一律采用 Lucide 矢量图标）；
2. **主题双层形态**：外层主题（Header/工具栏/面板/卡片）严格采用**硬核直角（`border-radius: 0`）**，内部拓扑节点保持精致微圆角（`rx="6"` 或 `rx="8"`）；支持深浅双主题切换与持久化；
3. **走线与层级五原则**：
   - 走线尽量不要重叠、零交叉（通过分层走廊排布）；
   - 若必须重叠，**直线的展示优先级层级更高**（`<g id="connections-straight">` 覆盖于 `<g id="connections-bent">` 之上）；
   - 长线只允许十字星（正交水平或垂直）；
   - 折线与近尾端只允许米字型（45° 斜角过渡或短偏置）；
   - 箭头仅允许米字八个离散方向；
4. **Hero 标题模式与平铺工具栏**：右上角工具栏严禁收缩，直接平铺展开明暗切换、复制、PNG、SVG 纯矢量导出与 PDF 导出功能；Header 采用超粗 800 字重 Hero 标题；
5. **节点防越界与防透底**：节点采用圆角（`rx="6"`），内部文字必须保留充裕呼吸空间（节点左右内边距建议 $\ge 12\text{px}$）；在绘制半透明色块前必须垫一层与画布同色的不透明底矩形，防止底层连线穿透；
6. **图例结构化**：图例必须使用独立的结构化直角面板有序陈列，严禁随手丢在画板角落；
7. **版本与清单同步**：更新版本时需同步 `.claude-plugin/plugin.json`、根目录 `.claude-plugin/marketplace.json` 以及根 `README.md`。

## 调试路径

1. 连线出现斜角或曲线 → 检查路径 `d` 属性，确保只有 `M`、`L` 且坐标变化要么仅在 X 轴要么仅在 Y 轴，45° 倒角时须保证 $|\Delta x| = |\Delta y|$；
2. 箭头朝向不正 → 检查进入节点端口前最后一段向量的方向是否严格落在八个米字方向上；
3. 连线交叉繁乱 → 重新梳理组件层次，调整左右/上下分层顺序，并将异步消息通道移至外侧边界；
4. 文字被外框切断或贴边 → 运行 `node skills/architecture-diagram/scripts/verify-overflow.mjs <file>`，根据计算出的溢出像素直接调大节点宽度。
