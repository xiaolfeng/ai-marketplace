# Excalidraw HTML 壳层、交互与浏览器验证

Excalidraw 网页模板采用单一文件自由壳层架构，在保留完整原生 `.excalidraw` JSON 结构的同时，利用客户端轻量 Rough.js 引擎在原生 `<svg id="main-diagram-svg">` 画布中进行高保真手绘白板渲染，兼具视觉美感与二次编辑能力。

## 1. 页面结构

整体外壳的配色与圆角与 replay-html 同源（暖纸笔记本体系，圆角 token `--radius-*`），字体只用系统字体栈（标题衬线、正文无衬线、标注等宽），不引入外部 Web 字体；内部画布保持手绘自然呼吸感。工具栏直接平铺展开，提供主题切换、剪贴板复制、PNG、SVG、PDF 导出以及原生 `.excalidraw` 文件导出与官方白板在线打开。

```html
<div class="container">
  <header class="hero-header">
    <div class="hero-top-bar">
      <div class="status-badge">EXCALIDRAW WHITEBOARD · v1.0.0</div>
      <div class="toolbar-flat">...</div>
    </div>
    <div class="hero-main">
      <h1>[图表主标题]</h1>
      <p class="subtitle">[图表说明与数据链路摘要]</p>
    </div>
  </header>

  <div class="diagram-panel" id="diagram-panel">
    <div class="viewport-controls">...</div>
    <svg id="main-diagram-svg" class="diagram-canvas">
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      <g id="excalidraw-content"></g>
    </svg>
  </div>

  <section class="legend-deck">...</section>
  <section class="spec-cards">...</section>
  <footer class="footer">...</footer>
</div>

<!-- 单一事实源：原生 Excalidraw JSON 数据 -->
<script type="application/json" id="excalidraw-data">
  {
    "type": "excalidraw",
    "version": 2,
    "source": "https://excalidraw.com",
    "elements": [ ... ],
    "appState": { ... }
  }
</script>
```

### 二次元点缀

模板样式末尾有一段独立的「ACCENT · 二次元点缀」，只借漫画的表达语法，不放角色素材：樱粉点缀色 `--sakura` / `--sakura-tint`、用 CSS 遮罩画的 ✦ 四角星 `--sparkle`、从角落径向淡出的极淡网点 `--tone`、平涂错位阴影（`box-shadow: 5px 5px 0 var(--sakura-tint)`）。点缀全部集中在这一段，生成页面时整段保留、不要另加；删掉整段即回到素版。打印时网点与错位阴影自动关闭。外壳上的落点：Header 右上角网点、标题樱粉荧光笔下划线、规格卡片右上角网点与樱粉图标、页脚开头的 ✦。画布内部（SVG 节点、手绘图元）不加任何点缀，导出结果不受影响。

## 2. 画板交互与自动视口计算

- **自动边界计算（Auto Bounding Box）**：渲染引擎在加载或重绘时，会自动遍历所有未删除图元（含矩形、椭圆、菱形、连线多点与自由曲线），计算全局极值 `(minX, minY, maxX, maxY)`，外加舒适呼吸边距（默认 `60px`），动态设定 `viewBox` 与 `data-export-viewbox`，无需人工写死画布尺寸；
- **画板激活**：默认不接管滚轮或触摸，允许页面正常滚动；首次点击（包括悬浮控件）只激活画板，显示蓝色边框与光晕，随后才允许平移、缩放和重置。点击画板外部、焦点移出、窗口失焦或按 `Esc` 退出；键盘聚焦画板后可按 `Enter` / 空格激活。提示文案随激活状态更新。
- **平移（Pan）**：按住鼠标左键拖拽或单指滑动触摸面板；
- **缩放（Zoom）**：以鼠标当前光标或双指中心为焦点滚轮缩放；
- **比例指示与重置**：悬浮栏显示当前缩放百分比（如 `100%`），双击空白画板或点击还原按钮立即重置为全局自适应视图；
- **独立导出尺寸**：交互缩放仅影响屏幕当前视口，不污染导出时的基准 `DESIGN_VIEWBOX`。

## 3. 移动端自适应规范

针对移动端视口（约 `390px`）自适应优化，仅调整外壳排版，不篡改画布内部手绘坐标系：

```css
@media (max-width: 768px) {
  body {
    padding: 1.25rem 0.75rem;
    overflow-x: hidden;
  }
  .container {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .hero-top-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
  }
  .toolbar-flat {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
  }
  .btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
    font-size: 0.75rem;
  }
  .btn-theme-toggle {
    grid-column: span 2;
  }
  .hero-main h1 {
    font-size: 1.6rem;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .diagram-panel {
    height: 480px;
    min-height: 380px;
  }
  .legend-grid,
  .spec-cards {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  .footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
}
```

## 4. 双主题与多格式导出

深浅双主题由 CSS 变量与渲染器颜色映射双重保障：

1. **主题变量**：页面底色 `--bg-page` 为暖纸色，白板底色 `--board-bg` 浅色为米白纸面 (`#fffdf8`)、深色为夜读暖黑 (`#211e19`)，点阵网格随主题反相；`:root` 写浅色，`@media (prefers-color-scheme: dark)` 下的 `:root:not([data-theme="light"])` 与 `:root[data-theme="dark"]` 写深色。未手动切换时跟随系统并实时同步重渲染，手动切换后才写入 `localStorage`；
2. **手绘颜色映射**：深色模式下，图元与文本默认黑边 (`#1e1e1e`) 自动映射为暖白墨色 (`#ece4d4`)，纯白填充映射为暖黑纸面 (`#262219`)，避免暗色背景下图形隐形；实色浅底（相对亮度 > 0.5）图元内的文字保持深色墨水 (`#1e1e1e`)，避免浅底浅字；
3. **导出格式全覆盖**：
   - **SVG 矢量**：克隆 `#main-diagram-svg`，补充主题背景底板，实体化所有样式后下载；
   - **PNG 视网膜图**：以 `2x` 分辨率通过离屏 Canvas 栅格化生成清晰抗锯齿位图；
   - **PDF 文档**：使用 `jspdf` 输出横向高清图纸；
   - **剪贴板复制**：直接写入 `ClipboardItem({'image/png': blob})`；
   - **原生 .excalidraw 源码**：导出完整 JSON 文本，可直接拖拽至 [excalidraw.com](https://excalidraw.com) 或 VS Code 扩展继续手绘与二开。

## 5. 强制浏览器验证

交付前需使用真实浏览器（如 Chrome / Playwright）做完整性核验：

- **桌面端视口**：标题、状态标识、操作工具栏、手绘图形、连线箭头、文本居中、图例与规格卡片完整清晰；
- **交互功能**：明暗主题切换正常、放大/缩小/拖拽/双击重置功能流畅；
- **导出能力**：SVG、PNG、PDF、.excalidraw 均能正常触发下载且内容完整无畸变；
- **移动端视口（约 390px）**：页面无横向滚动溢出，工具栏两列网格对齐，卡片自动收缩为单列。
