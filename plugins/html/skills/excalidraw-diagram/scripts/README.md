# Excalidraw 辅助工具套件 (Node.js ESM Scripts)

本目录包含用于生成、操作与导出 Excalidraw 图表的 Node.js 自动化脚本工具（基于 Node.js 原生 ESM，零外部运行时依赖）。

## 1. render-to-html.mjs（转换为交互式 HTML 页面）

将原生 `.excalidraw` JSON 图表文件转换为符合项目规范的独立单文件 HTML 网页。

### 功能特性

- 嵌入原生数据与轻量 Rough.js 渲染引擎，无需前端构建工具；
- 具备深浅双主题切换（Dark / Light）、画板平移与滚轮缩放；
- 提供 SVG、PNG (2x)、PDF、剪贴板复制及原生 `.excalidraw` 源码下载。

### 用法

```bash
node render-to-html.mjs <input.excalidraw> [output.html] [选项]
```

**常用选项**：
- `--title TITLE`：设置 HTML 页面主标题
- `--subtitle TEXT`：设置副标题与业务流转说明
- `--template PATH`：指定自定义 `template.html` 路径

**示例**：
```bash
# 自动生成同名 HTML 页面
node render-to-html.mjs order-flow.excalidraw

# 指定标题与输出路径
node render-to-html.mjs order-flow.excalidraw dist/order-flow.html \
  --title "电商订单结算与风控履约业务流" \
  --subtitle "端到端电商订单从客户端提单、风控判定到履约派单全流程"
```

---

## 2. add-arrow.mjs（添加连线与流转箭头）

在现有 `.excalidraw` 图表中快速插入带手绘风格的直线或折线箭头，支持标签与线型定义。

### 用法

```bash
node add-arrow.mjs <diagram_path> <from_x> <from_y> <to_x> <to_y> [选项]
```

**选项**：
- `--style {solid|dashed|dotted}`：线型（实线、虚线、点线，默认 `solid`）
- `--color HEX`：颜色（十六进制，默认 `#1e1e1e`）
- `--label TEXT`：在连线旁添加说明标签
- `--use-edit-suffix`：通过临时 `.edit` 备份安全写入（默认开启）

**示例**：
```bash
# 添加普通实线箭头
node add-arrow.mjs diagram.excalidraw 300 200 500 200

# 添加带文字的虚线异步事件箭头
node add-arrow.mjs diagram.excalidraw 500 200 700 350 --label "Order.Paid" --style dashed --color "#8b5cf6"
```

---

## 3. add-icon-to-diagram.mjs（注入图标图元）

从已拆分的 Excalidraw 图标库中提取特定图元，自动计算包围盒与全局唯一 UUID，并平移插入到指定坐标。

### 用法

```bash
node add-icon-to-diagram.mjs <diagram_path> <icon_name> <x> <y> [选项]
```

**选项**：
- `--library-path PATH`：图标库目录路径
- `--label TEXT`：在图标下方自动添加说明文字

**示例**：
```bash
node add-icon-to-diagram.mjs diagram.excalidraw API-Gateway 300 150 --label "API Gateway"
```

---

## 4. split-excalidraw-library.mjs（图标库切分器）

将官方或社区的 `.excalidrawlib` 库文件拆解为独立的图标 JSON 文件，并生成轻量级 `reference.md` 索引表，大幅降低 AI 搜索时的 Token 消耗。

### 用法

```bash
node split-excalidraw-library.mjs <path-to-library-directory>
```

**示例**：
```bash
# 目录内先放置 aws-architecture-icons.excalidrawlib
node split-excalidraw-library.mjs libraries/aws-architecture-icons/
```
