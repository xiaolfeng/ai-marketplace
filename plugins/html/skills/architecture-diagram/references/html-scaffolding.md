# HTML 壳层、交互与浏览器验证

模板只是自由页面壳层，不拥有任何组件结构或布局。节点、流式关系、分层服务、事件与安全组件统一从 [components/README.md](components/README.md) 选择，再按 [svg-design.md](svg-design.md) 的语义流程重新组合；禁止把组件约束重新写回模板。

## 1. 页面结构

页面外壳使用 `--radius-*` 圆角 token（与 replay 一致：徽标胶囊、按钮 8px、卡片 12px、画板 14px），内部 SVG 节点保持组件库规定的小圆角。Header 只展示真实标题、说明与操作，不添加无信息量标签。工具栏直接显示主题、复制、PNG、SVG、PDF 操作。

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

### 二次元点缀

模板样式末尾有一段独立的「ACCENT · 二次元点缀」，只借漫画的表达语法，不放角色素材：樱粉点缀色 `--sakura` / `--sakura-tint`、用 CSS 遮罩画的 ✦ 四角星 `--sparkle`、从角落径向淡出的极淡网点 `--tone`、平涂错位阴影（`box-shadow: 5px 5px 0 var(--sakura-tint)`）。点缀全部集中在这一段，生成页面时整段保留、不要另加；删掉整段即回到素版。打印时网点与错位阴影自动关闭。外壳上的落点：Header 右上角网点、标题樱粉荧光笔下划线、规格卡片右上角网点与樱粉图标、页脚开头的 ✦。画布内部（SVG 节点、手绘图元）不加任何点缀，导出结果不受影响。

## 2. 画板交互

- 默认 `viewBox` 显示完整画布；画布尺寸由当前 SVG 内容决定，不由模板写死；
- `#main-diagram-svg` 同时声明 `viewBox` 与 `data-export-viewbox`，两者可按内容自由设置；
- **画板激活**：默认不接管滚轮或触摸，允许页面正常滚动；首次点击（包括悬浮控件）只激活画板，显示蓝色边框与光晕，随后才允许平移、缩放和重置。点击画板外部、焦点移出、窗口失焦或按 `Esc` 退出；键盘聚焦画板后可按 `Enter` / 空格激活。提示文案随激活状态更新。
- 滚轮以指针为中心缩放；
- 鼠标/触摸拖拽平移；
- 双击或重置按钮恢复标准 `viewBox`；
- 交互视口不改变标准导出尺寸。

## 3. 移动端默认规则

移动端只改变页面阅读布局，不改变 SVG 标准坐标系：

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
  }
  .toolbar-flat {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
  }
  .btn-theme-toggle {
    grid-column: span 2;
  }
  .hero-main h1 {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .legend-grid,
  .spec-cards {
    grid-template-columns: minmax(0, 1fr);
  }
  .legend-deck,
  .spec-card {
    min-width: 0;
  }
  .diagram-panel {
    height: 480px;
    min-height: 380px;
  }
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

外壳配色与 replay-post-html 同源的纸白墨蓝体系：页面底色 `--bg-page`、画布底色 `--bg-canvas`、图例与规格卡片面板 `--bg-panel` / `--bg-card`，强调色 `--accent` 用于徽标、主题按钮与画板激活光晕；节点语义色 `--c-*` 不随外壳调整。字体只用系统字体栈 `--sans` / `--serif` / `--mono`，标题使用衬线体，不引入外部 Web 字体。

深浅主题通过 CSS 变量驱动：`:root` 写浅色，`@media (prefers-color-scheme: dark)` 下的 `:root:not([data-theme="light"])` 与 `:root[data-theme="dark"]` 写深色。未手动切换时跟随系统并实时同步，手动切换后写入 `localStorage` 持久化；读写存储均包在 `try/catch` 中。组件 SVG 绘制满幅背景时使用 `var(--bg-canvas)`，与画板底色保持一致。

导出前要把 SVG 计算样式实体化：

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
