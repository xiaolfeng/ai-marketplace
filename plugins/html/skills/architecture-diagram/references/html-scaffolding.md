# HTML 脚手架与前端工程规范

本手册指导如何将架构拓扑 SVG 封装为工业级、自包含（Self-contained）的单文件 HTML 工程交付物。

---

## 1. 架构总览与设计原则

生成的 HTML 是一份完全独立的单文件技术蓝图，无需启动 Node.js 或 Web 开发服务器，双击即开。

### 1.1 外层硬核直角 vs 内部图优雅圆角
- **外层硬核直角（`border-radius: 0`）**：
  - 网页容器 `.container`
  - 顶部规格徽章 `.status-badge` 与标签 `.tag-item`
  - 平铺工具栏所有按钮 `.btn`
  - 图例面板 `.legend-deck`
  - 规格技术卡片 `.spec-card`
  - 彻底杜绝软绵绵的消费级圆角卡片，呈现严谨硬核的工业图纸质感；
- **内部架构图优雅圆角（SVG 内 `rx="6"` 或 `rx="8"`）**：
  - 微服务节点卡片保持 `rx="6"`
  - 网段边界保持 `rx="8"`
  - 图标与图形识别度更高，与外层直角形成刚柔并济的层次对比。

---

## 2. Hero 模式 Header 构建

Header 采用醒目清晰的双行 Hero 结构，突出技术图纸的核心定位：

```html
<header class="hero-header">
  <div class="hero-top-bar">
    <div class="hero-meta">
      <div class="status-badge">
        <svg ...><!-- Lucide 状态图标 --></svg>
        <span>PRODUCTION BLUEPRINT · v1.0.0</span>
      </div>
    </div>

    <!-- 平铺展开工具栏（严禁收缩） -->
    <div class="toolbar-flat">
      <button class="btn btn-theme-toggle" onclick="toggleTheme()"><!-- 主题切换 --></button>
      <button class="btn" onclick="copyAsImage(this)"><!-- 复制图片 --></button>
      <button class="btn" onclick="downloadPNG(this)"><!-- 导出 PNG --></button>
      <button class="btn" onclick="downloadSVG(this)"><!-- 导出 SVG --></button>
      <button class="btn" onclick="downloadPDF(this)"><!-- 导出 PDF --></button>
    </div>
  </div>

  <div class="hero-main">
    <h1>[PROJECT NAME] 系统架构全景拓扑</h1>
    <p class="subtitle">端到端微服务集群全景拓扑 · 零信任接入网络 · 曼哈顿十字正交平面零交叉数据流走廊</p>
  </div>
</header>
```

---

## 3. 画板自适应与自由平移缩放引擎（Pan & Zoom Engine）

技术架构图通常具备丰富的微服务节点与长走线链路，固定的画板宽度会导致小屏幕出现粗笨横向滚动条、大屏幕受限憋屈。

### 3.1 默认自适应与视口交互规则
1. **默认自适应（Auto-fit by Default）**：SVG 默认以 `viewBox="0 0 1200 660"` 与 `preserveAspectRatio="xMidYMid meet"` 完整填充容器视口，打开即是一览无余的全景图，绝无死板固定宽度与截断；
2. **鼠标自由平移（Drag to Pan）**：按住鼠标左键在画板空白区域滑动，光标自 `grab` 切换为 `grabbing`，画板跟随指针顺滑平移；
3. **滚轮焦点缩放（Wheel to Zoom at Cursor）**：滚轮缩放以当前鼠标指针所在的实际 SVG 物理坐标为中心缩放，支持 `0.25x ~ 6x` 缩放范围；
4. **悬浮工程控制栏与双击还原**：右下角提供极简平铺控制栏（放大、当前缩放比、缩小、自适应还原），双击画板任何位置即可瞬时恢复 100% 自适应全景；
5. **视口与导出严格解耦**：导出 SVG、PNG、PDF 或复制图片时，程序自动克隆并强制将 viewBox 锁定回设计尺寸 `0 0 1200 660`，同时自动滤除悬浮控制栏与操作提示，确保导出的图纸永远是居中、完整、没有任何交互偏移的工业蓝图。

---

## 4. 双主题（Dark / Light）与 CSS 变量联动

### 3.1 变量映射表
通过 `data-theme="dark"` 与 `data-theme="light"` 统领所有页面颜色与 SVG 内部填充/描边：

```css
:root, [data-theme="dark"] {
  --bg-canvas: #090d16;
  --bg-panel: rgba(15, 23, 42, 0.85);
  --node-base: #0b1329;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --c-client: #38bdf8;
  --c-gateway: #0ea5e9;
  --c-service: #10b981;
  --c-storage: #f59e0b;
  --c-security: #f43f5e;
  --c-message: #8b5cf6;
}

[data-theme="light"] {
  --bg-canvas: #f8fafc;
  --bg-panel: #ffffff;
  --node-base: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --c-client: #0284c7;
  --c-gateway: #0369a1;
  --c-service: #059669;
  --c-storage: #d97706;
  --c-security: #e11d48;
  --c-message: #7c3aed;
}
```

### 3.2 主题切换与持久化脚本
```javascript
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  document.getElementById('theme-icon-sun').style.display = isDark ? 'none' : 'inline-block';
  document.getElementById('theme-icon-moon').style.display = isDark ? 'inline-block' : 'none';
  document.getElementById('theme-btn-text').textContent = isDark ? '浅色模式' : '深色模式';
  localStorage.setItem('arch_diagram_theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
```

---

## 5. 纯画布导出流水线（SVG / PNG / PDF / Copy）

**铁律：导出操作 100% 仅针对架构图画布（Diagram Canvas Only）进行，绝对不导出外层的 Header、图例面板或网页边框！**

### 5.1 导出 SVG（纯矢量独立源文件）
**关键细节**：SVG 若直接序列化，外部 CSS 变量与 class 样式在其他浏览器、Illustrator 或 Figma 中会失效，表现为线条、箭头、文字或节点消失。导出前必须执行“样式实体化”：

1. 克隆 SVG；
2. 逐一对应源节点与克隆节点，通过 `getComputedStyle()` 读取 `fill`、`stroke`、`color`、线宽、虚线、字体与可见性等最终值；
3. 把最终值写入克隆节点的 `style`；若原 `fill` / `stroke` / `color` 属性包含 `var(...)`，还要把解析后的具体色值回写到属性；
4. 保留 `url(#marker)`、`url(#pattern)` 等本地引用，不能被计算样式覆盖；
5. 在 `<defs>` 之后注入与当前主题一致的背景矩形；
6. 强制重置 `viewBox="0 0 1200 660"`，补齐 `xmlns`、`xmlns:xlink`、`width="1200"` 与 `height="660"` 后再序列化下载。

### 5.2 纯画布 Canvas 渲染（createDiagramCanvas）
为了保证 PNG、复制图片与 PDF **完全只包含架构图本身**，摒弃了传统的全局网页截屏工具（`html2canvas` 遍历全局 DOM 会截取外部 Header 和操作栏），改用浏览器原生高质量 SVG 栅格化流水线：

```javascript
async function createDiagramCanvas(scale = 2) {
  await waitForExportAssets();
  const standaloneSvg = createStandaloneSvg();
  const serialized = new XMLSerializer().serializeToString(standaloneSvg);
  const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = DEFAULT_VIEWBOX.w * scale;
    canvas.height = DEFAULT_VIEWBOX.h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = getExportBackground();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
```

- **复制图片 (Copy Image)**：将上述纯画布 Canvas 导出的 2x PNG Blob 写入剪贴板；
- **下载 PNG**：触发下载上述 `2400 × 1320` 视网膜级纯画布 PNG；
- **下载 PDF**：将该纯画布渲染至与 `1200:660` 画布比例完全一致的单页 PDF，呈现干净利落的独立工程图纸。

---

## 6. 外部引用与安全规范（CDN & SRI）

HTML `<head>` 中引入的两个轻量库必须锁定版本并携带 SRI 校验哈希：
```html
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" 
        integrity="sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H" 
        crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js" 
        integrity="sha384-en/ztfPSRkGfME4KIm05joYXynqzUgbsG5nMrj/xEFAHXkeZfO3yMK8QQ+mP7p1/" 
        crossorigin="anonymous"></script>
```
若离线环境不可用 CDN，页面视图与 SVG 渲染 100% 正常工作，仅影响右上角位图/PDF 导出功能。
