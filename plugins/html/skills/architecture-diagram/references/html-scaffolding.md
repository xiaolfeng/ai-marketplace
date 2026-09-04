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
      <div class="tenet-tags">
        <span class="tag-item">MANHATTAN 90°</span>
        <span class="tag-item">OCTILINEAR 45°</span>
        <span class="tag-item">PLANAR ZERO-CROSSING</span>
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

## 3. 双主题（Dark / Light）与 CSS 变量联动

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

## 4. 导出工具链实现（SVG / PNG / PDF / Copy）

### 4.1 导出 SVG（纯矢量独立源文件）
**关键细节**：SVG 若直接序列化，外部 CSS 变量在其他矢量编辑软件（Illustrator/Figma）中会失效。导出脚本必须动态克隆 SVG，并向其根部注入内联计算样式表：
```javascript
function downloadSVG(btn) {
  const svg = document.getElementById('main-diagram-svg');
  const clone = svg.cloneNode(true);
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isDark = currentTheme === 'dark';

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    svg { font-family: 'Inter', sans-serif; background: ${isDark ? '#090d16' : '#f8fafc'}; }
    .node-title { fill: ${isDark ? '#f8fafc' : '#0f172a'}; font-weight: 600; font-size: 11.5px; }
    .node-subtitle { fill: ${isDark ? '#94a3b8' : '#475569'}; font-size: 9px; }
    .line-label { fill: ${isDark ? '#94a3b8' : '#475569'}; font-size: 8.5px; }
  `;
  clone.insertBefore(styleEl, clone.firstChild);

  const serializer = new XMLSerializer();
  const svgString = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'architecture-topology.svg';
  link.click();
  URL.revokeObjectURL(url);
}
```

### 4.2 导出 PNG & 复制到剪贴板
采用固定 CDN 的 `html2canvas`（带有 Subresource Integrity）：
- 自动读取当前主题底色（`#090d16` 或 `#f8fafc`），避免透明背景撕裂；
- 设置 `scale: 2` 生成 Retina 视网膜高清图像；
- 过滤 `.toolbar-flat`，防止操作栏污染截图。

### 4.3 导出 PDF
采用 `jspdf` 将 2x Canvas 数据组装为矢量比例 PDF，`orientation` 自适应横竖屏。

---

## 5. 外部引用与安全规范（CDN & SRI）

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
