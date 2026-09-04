# Excalidraw JSON 数据结构参考

本文件描述 Excalidraw 原生 `.excalidraw` 文件的标准 JSON Schema 与关键字段定义。

## 顶层结构 (Top-Level)

```typescript
interface ExcalidrawFile {
  type: "excalidraw";          // 固定值 "excalidraw"
  version: 2;                  // 固定版本 2
  source: string;              // 数据来源，通常为 "https://excalidraw.com"
  elements: ExcalidrawElement[]; // 图元数组
  appState: AppState;          // 画布全局状态
  files: Record<string, any>;  // 嵌入式图片等媒体文件，代码生成场景通常为 {}
}
```

## AppState 画布状态

```typescript
interface AppState {
  viewBackgroundColor: string; // 画布底色，浅色默认 "#ffffff"，深色 "#121212"
  gridSize: number;            // 网格吸附尺寸，通常为 20
}
```

## 图元通用基础属性 (Base Properties)

所有图元（矩形、椭圆、菱形、连线、箭头、文本）共享以下核心属性：

```typescript
interface BaseElement {
  id: string;                  // 全局唯一标识符（如 "node-start"、"arrow-1"）
  type: ElementType;           // "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text" | "freedraw"
  x: number;                   // 绝对 X 轴像素坐标（左上角基准）
  y: number;                   // 绝对 Y 轴像素坐标（左上角基准）
  width: number;               // 宽度像素值
  height: number;              // 高度像素值
  angle: number;               // 旋转弧度（通常为 0）
  strokeColor: string;         // 描边十六进制色值（默认 "#1e1e1e"）
  backgroundColor: string;     // 背景填充色（十六进制或 "transparent"）
  fillStyle: "solid" | "hachure" | "cross-hatch"; // 填充风格
  strokeWidth: number;         // 描边粗细（1, 2, 3，推荐 2）
  strokeStyle: "solid" | "dashed" | "dotted";    // 线条样式
  roughness: number;           // 手绘自然粗糙度（0-2，推荐固定为 1）
  opacity: number;             // 不透明度（0-100，默认 100）
  groupIds: string[];          // 所属分组 ID 列表
  frameId: null;               // 框架容器 ID（通常为 null）
  index: string;               // 图层堆叠层级（如 "a0", "a1"）
  roundness: { type: number } | null; // 圆角配置：3 为矩形手绘圆角，2 为弧线
  seed: number;                // 伪随机数种子，保证手绘确定性渲染
  version: number;             // 版本号，编辑时递增
  versionNonce: number;        // 随机版本计数器
  isDeleted: boolean;          // 是否已删除，必须为 false
  boundElements: any;          // 绑定的连线，可为 null
  updated: number;             // 更新时间戳毫秒数
  link: null;                  // 超链接，通常为 null
  locked: boolean;             // 是否锁定，通常为 false
}
```

## 文本扩展属性

```typescript
interface TextAttributes {
  text?: string;               // 节点显示文本
  fontSize?: number;           // 字体大小（14-28，标题 32+）
  fontFamily?: number;         // 字体族：5 为 Excalifont 手绘体，1 为 Virgil，2 为 Helvetica
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}
```

## 箭头与连线特有属性 (Arrow & Line)

```typescript
interface ArrowElement extends BaseElement {
  type: "arrow" | "line";
  points: [number, number][];  // 相对起点 [0, 0] 的坐标数组
  startBinding: Binding | null;
  endBinding: Binding | null;
  roundness: { type: 2 };      // 微弯手绘弧度
}
```

**Points 相对坐标说明**：
- 第一个点恒为 `[0, 0]`，基准点即为图元的 `(x, y)`；
- 沿 X 轴向右延伸 `120px` 的直线箭头：`points: [[0, 0], [120, 0]]`，`width: 120`，`height: 0`；
- 沿 Y 轴向下延伸 `80px` 的直线箭头：`points: [[0, 0], [0, 80]]`，`width: 0`，`height: 80`。

## 常用语义色板速查

| 语义角色 | 常用背景色 Hex | 说明 |
| --- | --- | --- |
| 客户端与接入 | `#a5d8ff` | 浅蓝底，代表用户侧与流量入口 |
| 业务微服务 | `#b2f2bb` | 浅绿底，代表正常业务流转与核心服务 |
| 判定与中间件 | `#ffd43b` | 金黄底，代表分支判断、缓存与状态判定 |
| 告警与拦截 | `#ffc9c9` | 绯红底，代表异常分支、校验失败与风控阻断 |
| 存储与事件 | `#d0bfff` | 浅紫底，代表数据库、Kafka 总线与持久化 |
| 无填充背景 | `transparent` | 透明底衬，配合线框表达外层容器边界 |
