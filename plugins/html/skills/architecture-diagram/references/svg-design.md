# SVG 架构拓扑描述与几何制图规范

本手册详细定义系统架构图 SVG 内部的结构描述、几何走线算法、图层堆叠顺序与矢量图标标准。

---

## 1. 画布与视口坐标系（Canvas & ViewBox）

### 1.1 基础尺寸与纵横比
- **推荐基础尺寸**：`viewBox="0 0 1200 660"` 或 `viewBox="0 0 1260 700"`；
- **自适应响应**：SVG 元素设置 `width: 100%; height: auto; min-width: 1100px; display: block;`，外层包裹 `overflow-x: auto` 的直角面板，保证小屏幕平滑横向滚动，大屏幕矢量自适应。

### 1.2 背景点阵参考网格
在 `<defs>` 中使用轻量 pattern，不增加额外 DOM 负担：
```xml
<pattern id="grid-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="var(--grid-line)" stroke-width="0.75"/>
  <circle cx="0" cy="0" r="0.8" fill="var(--grid-dot)"/>
</pattern>
<rect width="100%" height="100%" fill="url(#grid-pattern)"/>
```

---

## 2. 纯矢量 Lucide 图标标准（杜绝 Emoji）

技术架构图要求严谨沉稳的工程质感，**严禁使用任何系统 Emoji**。图标一律内联 Lucide 规范路径：

### 2.1 `<defs>` 符号库定义
在 `<defs>` 内部定义 `16×16` 视口的常用技术符号：
```xml
<!-- 网络网关 -->
<g id="icon-network">
  <rect x="2" y="2" width="4" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="10" y="2" width="4" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="6" y="10" width="4" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M4 6v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M8 10v-2" fill="none" stroke="currentColor" stroke-width="1.5"/>
</g>
<!-- 服务节点 -->
<g id="icon-server">
  <rect x="2" y="2" width="12" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <rect x="2" y="8" width="12" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="4.5" cy="4" r="0.75" fill="currentColor"/>
  <circle cx="4.5" cy="10" r="0.75" fill="currentColor"/>
</g>
<!-- 数据库存储 -->
<g id="icon-database">
  <ellipse cx="8" cy="4" rx="6" ry="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M2 4v4c0 1.1 2.7 2 6 2s6-.9 6-2V4M2 8v4c0 1.1 2.7 2 6 2s6-.9 6-2V8" fill="none" stroke="currentColor" stroke-width="1.5"/>
</g>
```

### 2.2 节点中引用
在节点 `<g>` 内部通过 `<use>` 复用，动态继承所在组件的颜色：
```xml
<g transform="translate(14, 18)" color="var(--c-service)">
  <use href="#icon-server"/>
</g>
```

---

## 3. 架构分层与栅格布局（Tiered Layering）

拓扑布局从左向右严格按照四层职责流水线排布：

```
[Layer 1: Ingress]  ->  [Layer 2: Gateway]  ->  [Layer 3: Computing]  ->  [Layer 4: Persistence]
 x: 30 ~ 195             x: 255 ~ 420            x: 485 ~ 855              x: 920 ~ 1150
 Web Frontend            API Gateway             Auth / Core / Order       PostgreSQL / Redis
 Mobile App              Ingress Controller      Kafka Event Broker        S3 Object Storage
```

### 3.1 节点尺寸与内边距铁律
- **卡片标准宽度**：
  - 接入端：`160px`（高度 `64px`）
  - 网关端：`165px ~ 170px`（高度 `74px`）
  - 微服务集群：`175px`（高度 `64px`）
  - 消息总线/持久层：`185px`（高度 `60px ~ 64px`）
- **文字呼吸边距**：文字距卡片右侧边界必须保留 $\ge 12\text{px}$，严禁字长贴边！
- **不透明防透底底衬**：节点底层必须绘制 `<rect fill="var(--node-base)"/>`，防止穿底透出背景连线。

---

## 4. 走线几何约束与图层优先级（Straight-over-Bent）

### 4.1 核心五项几何铁律
1. **长线十字星（Manhattan 90°）**：长距离走线只允许水平（$\Delta y = 0$）或垂直（$\Delta x = 0$）；
2. **折线米字型（Octilinear 45°）**：折角与偏置接入（Dogleg）严格使用 45° 方向切角，保持 $|\Delta x| = |\Delta y|$；
3. **离散八向箭头**：箭头末端切线角度收敛于米字型 8 个离散角度（`0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°`）；
4. **平面零交叉规划**：同步主调用走中央水平走廊，异步事件与鉴权验证走上下外围通道，主链路 100% 零交叉；
5. **直线层级高于折线（Straight-over-Bent）**：若存在视觉重叠，**直线的图层优先级永远高于折线**。

### 4.2 图层分层书写顺序
SVG 遵循文档序渲染（后写的元素覆盖先写的元素）。连线层必须严格分为两组：
```xml
<!-- 1. 折线组（底层）：先绘制所有包含 45° 切角或直角偏置的连线 -->
<g id="connections-bent">
  <path d="M 195 342 L 215 342 L 235 222 L 255 222" ... />
  <path d="M 337 170 L 337 137 L 485 137" ... />
  <path d="M 337 244 L 337 327 L 485 327" ... />
  <path d="M 577 359 L 577 455" ... />
  <path d="M 855 485 L 875 485 L 895 452 L 920 452" ... />
</g>

<!-- 2. 直线组（高优先级层）：后绘制所有主数据流正交直线，覆盖于折线上方 -->
<g id="connections-straight">
  <path d="M 195 202 L 255 202" ... />
  <path d="M 420 212 L 485 212" ... />
  <path d="M 660 212 L 920 212" ... />
  <path d="M 660 327 L 920 327" ... />
  <path d="M 670 485 L 690 485" ... />
</g>

<!-- 3. 节点卡片组（最上层）：节点完全覆盖连线端口 -->
<g id="nodes"> ... </g>
```

---

## 5. 八向箭头定义（Markers）

在 `<defs>` 中为不同语义的连线定义 `orient="auto"` 的离散箭头：
```xml
<marker id="arrow-gateway" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
  <polygon points="0 0.5, 7 3, 0 5.5" fill="var(--c-gateway)" />
</marker>
<marker id="arrow-service" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
  <polygon points="0 0.5, 7 3, 0 5.5" fill="var(--c-service)" />
</marker>
```
由于连线在接入节点前已正交或 45° 对齐，箭头会自动对齐到 8 个离散方向之一，呈现整洁的机械制图质感。
