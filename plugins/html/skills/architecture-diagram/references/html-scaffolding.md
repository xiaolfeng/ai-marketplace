# HTML 壳层、交互与浏览器验证

模板只是自由页面壳层，不拥有任何组件结构或布局。节点、流式关系、分层服务、事件与安全组件统一从 [components/README.md](components/README.md) 选择，再按 [svg-design.md](svg-design.md) 的语义流程重新组合；禁止把组件约束重新写回模板。

## 1. 页面结构

页面外壳保持直角，内部 SVG 节点可使用小圆角。Header 只展示真实标题、说明与操作，不添加无信息量标签。工具栏直接显示主题、复制、PNG、SVG、PDF 操作。

```html
<div class="container">
  <header class="hero-header">...</header>
  <div class="diagram-panel">
    <div class="viewport-controls">...</div>
    <svg id="main-diagram-svg" class="diagram-canvas">...</svg>
  </div>
  <section class="legend-deck">...</section>
  <section class="spec-cards">...</section>
</div>
```

## 2. 画板交互

- 默认 `viewBox` 显示完整画布；画布尺寸由当前 SVG 内容决定，不由模板写死；
- `#main-diagram-svg` 同时声明 `viewBox` 与 `data-export-viewbox`，两者可按内容自由设置；
- 滚轮以指针为中心缩放；
- 鼠标/触摸拖拽平移；
- 双击或重置按钮恢复标准 `viewBox`；
- 交互视口不改变标准导出尺寸。

## 3. 移动端默认规则

移动端只改变页面阅读布局，不改变 SVG 标准坐标系：

```css
@media (max-width: 768px) {
  body { padding: 1.25rem .75rem; overflow-x: hidden; }
  .container { width: 100%; min-width: 0; max-width: 100%; }
  .hero-top-bar { flex-direction: column; align-items: stretch; }
  .toolbar-flat { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .btn { width: 100%; min-width: 0; justify-content: center; }
  .btn-theme-toggle { grid-column: span 2; }
  .hero-main h1 { overflow-wrap: anywhere; word-break: break-word; }
  .legend-grid, .spec-cards { grid-template-columns: minmax(0, 1fr); }
  .legend-deck, .spec-card { min-width: 0; }
  .diagram-panel { height: 480px; min-height: 380px; }
}
```

使用 Chrome `--window-size` 不能证明 CSS viewport 精确。移动端验证优先使用 Playwright、Puppeteer，或 Chrome DevTools Protocol 的 `Emulation.setDeviceMetricsOverride`。

至少读取：

```js
{
  innerWidth: window.innerWidth,
  pageScrollWidth: document.documentElement.scrollWidth,
  toolbarRect: toolbar.getBoundingClientRect(),
  titleRect: title.getBoundingClientRect(),
  panelRect: panel.getBoundingClientRect(),
  buttonRects: [...buttons].map(button => button.getBoundingClientRect())
}
```

`390px` 视口必须满足：页面无横向溢出；标题完整换行；按钮均在视口内；图例与规格卡片单列；画板和控制栏完整可见。

## 4. 主题与导出

深浅主题通过 CSS 变量驱动。导出前要把 SVG 计算样式实体化：

1. 克隆 `#main-diagram-svg`；
2. 把最终 `fill`、`stroke`、字体等写入克隆；
3. 保留 `url(#marker)`、`url(#pattern)` 引用；
4. 注入当前主题背景；
5. 恢复当前 SVG 自己声明的 `data-export-viewbox`、`width`、`height`，不使用模板固定尺寸；
6. 确认序列化结果无 `var(...)`。

SVG、PNG、PDF、Copy 都只导出 `#main-diagram-svg`，不包含 Header、工具栏、图例或规格卡片。PNG/Copy/PDF 统一从独立 SVG 栅格化，不截整个页面。

## 5. 强制浏览器验证

脚本通过不等于交互完成。交付前必须实际执行：

- 桌面：完整渲染、标题、工具栏、画布、节点/线路/标签、图例、规格卡片、深浅主题；
- 交互：主题切换、放大、缩小、拖拽、重置；
- 导出：独立 SVG、PNG Canvas、PDF；环境支持时测试 Copy；
- 移动：精确约 `390px` CSS viewport，无页面级横向溢出。

可重复回归命令：

```bash
node tests/browser-regression.mjs examples/example.html
```

一张静态截图不是完整验证。
