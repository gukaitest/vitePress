# Canvas 性能优化实战

## 概述

Canvas 的性能优化核心在于：**减少不必要的重绘**（局部重绘、分层渲染）和 **降低单次绘制的开销**（合并 API 调用、复用样式与路径），并借助浏览器 DevTools 以 **数据驱动优化决策**。

---

## 核心思路总览

- **减少重绘范围**：优先使用局部重绘（脏矩形、剪裁），避免整屏重绘。
- **分层渲染**：静态背景与频繁变化的前景拆分到不同 Canvas 或图层。
- **降低调用成本**：合并绘制操作、复用路径和样式，减少状态切换与 save()/restore() 调用。
- **合理用内存**：缓存中间结果与离屏缓冲（`OffscreenCanvas` 或隐藏 Canvas），避免重复计算。
- **异步/离线处理**：耗时逻辑放到 Web Worker + OffscreenCanvas，减少主线程阻塞。
- **借助工具分析**：通过 DevTools 监控 FPS、内存与主线程阻塞时间，验证优化效果。

---

## 控制重绘：局部重绘与分层渲染

### 1. 减少绘制区域（脏矩形、剪裁）

**场景**：只有少量元素发生变化（例如拖拽一个节点、移动少数图形），但默认写法每帧会 `clearRect(0, 0, width, height)` 再全量重绘所有图形 → 浪费大量算力。

- **脏矩形（Dirty Rect）思路**：
  - 记录本帧发生变化的区域矩形（或矩形集合）。
  - 只对这些区域进行清除和重绘。

```ts
function renderDirty(ctx: CanvasRenderingContext2D, dirtyRect: { x: number; y: number; w: number; h: number }) {
  const { x, y, w, h } = dirtyRect;
  ctx.clearRect(x, y, w, h);

  // 只重绘与 dirtyRect 相交的元素
  drawShapesInRegion(ctx, dirtyRect);
}
```

- **剪裁（clip）配合脏矩形**：
  - 在重绘前通过 `ctx.rect` + `ctx.clip()` 限制绘制区域，进一步避免超出区域的绘制操作。

> 避坑：不要为每个小元素都单独维护一个脏矩形集合，否则管理成本过高。可以按“逻辑区域”分块（如网格单元、图层块）。

### 2. 分层渲染（多 Canvas / 多图层）

当背景（栅格线、背景图、静态装饰）很少变化，而前景（鼠标轨迹、动画元素）频繁变化时，可以将其拆分：

- **背景层**：单独一个 Canvas，仅在初始化或尺寸变化时绘制一次。
- **前景层**：另一个 Canvas，每帧只重绘前景元素。

```html
<div style="position: relative;">
  <canvas id="bg" width="800" height="600" style="position:absolute;left:0;top:0;"></canvas>
  <canvas id="fg" width="800" height="600" style="position:absolute;left:0;top:0;"></canvas>
</div>
```

```ts
const bgCtx = (document.getElementById("bg") as HTMLCanvasElement).getContext("2d")!;
const fgCtx = (document.getElementById("fg") as HTMLCanvasElement).getContext("2d")!;

// 只在初始化或配置变化时绘制背景
drawStaticBackground(bgCtx);

// 每帧只更新前景
function renderFrame() {
  fgCtx.clearRect(0, 0, width, height);
  drawDynamicObjects(fgCtx);
  requestAnimationFrame(renderFrame);
}
```

> 好处：大大减少每帧计算量，尤其是背景复杂或分辨率较高时效果明显。

---

## 降低绘制操作开销：合并调用与状态管理

### 1. 合并 API 调用，复用样式与路径

- 将属性设置与绘制操作尽量**按批次集中**：
  - 同一种样式下的图形一起画，避免在循环中频繁切换 `fillStyle` / `strokeStyle` / `lineWidth` 等。

```ts
// 不推荐：循环内频繁改样式
for (const item of items) {
  ctx.fillStyle = item.color;
  ctx.fillRect(item.x, item.y, item.w, item.h);
}

// 推荐：按颜色分组批量绘制
const groupByColor = groupItemsByColor(items);
for (const [color, group] of groupByColor) {
  ctx.fillStyle = color;
  for (const item of group) {
    ctx.fillRect(item.x, item.y, item.w, item.h);
  }
}
```

- 对频繁绘制的复杂路径（如图标、曲线）可以预先构建 `Path2D` 并复用：

```ts
const starPath = new Path2D();
// ... 构建星形路径 ...

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fill(starPath);
  ctx.restore();
}
```

### 2. 避免频繁 save()/restore()

`save()`/`restore()` 会压栈/出栈整个绘图状态，频繁调用会带来额外开销。

- **推荐做法**：
  - 仅在必要时使用（如局部变换、复杂嵌套状态），而不是给每个图形都包一对 `save()`/`restore()`。
  - 通过**手动还原关键状态**（如 `setTransform(1,0,0,1,0,0)`、重置 `globalAlpha`）代替深度嵌套的状态栈。

> 避坑：在复杂场景中，滥用 `save()`/`restore()` 容易导致栈过深、难以追踪状态来源，并增加 CPU 开销。

### 3. 减少 CPU/GPU 状态切换

Canvas 在渲染过程中会涉及 CPU 计算与 GPU 绘制：

- 合理管理以下状态，避免频繁切换：
  - `globalCompositeOperation`
  - `shadow*` 系列属性
  - `filter` / `globalAlpha`

**原则**：

- 相同混合模式与阴影设置的绘制集中到一起。
- 避免在高频渲染路径中使用复杂滤镜和阴影效果，如有需要可考虑只在静态层使用（通过分层渲染）。

---

## 合理利用内存：缓存与复用

### 1. 缓存中间结果（离屏 Canvas / OffscreenCanvas）

对于复杂但重复使用的图形，可以渲染到离屏 Canvas 中，之后再通过 `drawImage` 快速复制：

```ts
const offscreen = document.createElement("canvas");
offscreen.width = 200;
offscreen.height = 200;
const offCtx = offscreen.getContext("2d")!;

// 只绘制一次复杂图形
drawComplexShape(offCtx);

// 每帧直接 drawImage，避免重复计算
function render(ctx: CanvasRenderingContext2D) {
  ctx.drawImage(offscreen, x, y);
}
```

在支持的环境中，可使用 `OffscreenCanvas` 并结合 Web Worker，将耗时绘制从主线程移出。

### 2. 复用对象与数组

- 复用坐标、缓冲数组，避免在动画循环中频繁创建临时对象，减少 GC 压力。
- 对于粒子系统、大量小图形，尽量使用结构化数组或 TypedArray 存储状态。

> 避坑：缓存/离屏过多也会增加显存/内存占用，需要结合实际设备与场景权衡，适时清理不再使用的缓存。

---

## 离屏渲染与 Web Worker：处理长耗时逻辑

当某些与 Canvas 相关的计算（物理模拟、路径规划、大量数据处理等）在主线程执行时间过长，会直接影响帧率和交互流畅度。

### 1. 使用 OffscreenCanvas 移出主线程绘制（支持的浏览器）

在支持 `OffscreenCanvas` 的浏览器中，可以将 Canvas 交给 Worker 绘制：

```ts
// 主线程
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker(new URL("./renderer.js", import.meta.url), { type: "module" });
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

```ts
// renderer.js（Worker 内）
self.onmessage = (event) => {
  const canvas = event.data.canvas as OffscreenCanvas;
  const ctx = canvas.getContext("2d")!;

  function render() {
    // 在 Worker 中完成绘制
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawScene(ctx);

    requestAnimationFrame(render);
  }

  render();
};
```

这样可以让主线程更多用于处理用户输入和页面其它逻辑，减轻卡顿感。

### 2. 仅将重逻辑放入 Worker

如果无法使用 `OffscreenCanvas`，也可以只将复杂计算放到 Worker 中，Canvas 仍在主线程绘制：

- Worker 负责计算动画下一帧状态（坐标、速度等）。
- 主线程接收结果后进行最小化的绘制工作。

> 原则：主线程只做“最后一步的绘制”，尽量把计算型工作拆到 Worker。

---

## 使用浏览器 DevTools 验证优化效果

Canvas 优化一定要配合工具做 **前后对比**，否则很难评估改动是否真正有效。

### 1. 监控 FPS 与主线程阻塞

- 在 Chrome 中打开 Performance 面板：
  - 录制一段动画过程。
  - 查看 FPS 曲线、主线程火焰图（Main），检查是否存在长时间的绘制或 JS 执行。
- 关注：
  - 单帧总时长是否接近或超过 16ms（60 FPS）。
  - 是否有长时间的 `Rendering` 或 `Scripting` 区块。

### 2. 监控内存与对象分配

- 使用 Memory 面板查看：
  - 是否存在离屏 Canvas 或缓存对象未被释放。
  - 动画长时间运行后，内存是否持续上升（内存泄漏）。

> 实战建议：每做完一次优化（例如引入局部重绘、分层渲染），都用同样的场景录制一次性能数据，对比帧率、CPU 占用和内存曲线，确保是“真优化”。

---

## 关键避坑与降级策略

### 1. 避免全量重绘与循环内 DOM 操作

- **尽量避免**在每一帧都：
  - 全屏 `clearRect` + 全量重绘所有图形。
  - 同时伴随大量 DOM 操作（如修改布局、添加/删除元素）。
- 如果必须更新 DOM（比如展示坐标、统计信息），建议：
  - 降低更新频率（例如每 10 帧更新一次）。
  - 集中在一个元素中更新（减少节点数变化）。

### 2. 控制绘制数量和大小

- 绘制的**图形数量和尺寸**直接影响性能：
  - 上万级小图形或极大尺寸的渐变/阴影区域都会明显拖慢渲染。
  - 对于不可见或极小的元素可以适当合并/忽略（视距裁剪、LOD 思路）。
- 如果图形数量过多、但每帧只刷新一部分：
  - 结合 **局部渲染（脏矩形）** 与 **分层渲染** 是非常有效的组合。

### 3. 低性能设备的降级处理

- 根据设备性能（可通过 UA、能力检测、首帧耗时等简单指标）进行适当降级：
  - 降低帧率目标（如从 60 FPS 降到 30 FPS）。
  - 减少粒子数量、细节层级或关闭部分特效（阴影、模糊等）。
  - 限制最大分辨率，或采用缩放策略（逻辑分辨率低、显示等比放大）。

> 总结：在低端设备上，“稳定但简单” 比 “炫但卡” 体验更好。

---

## 数据驱动的 Canvas 优化流程

综合以上内容，可以将 Canvas 性能优化归纳为一个简单流程：

1. **测量**：使用 DevTools 记录基线数据（FPS、主线程耗时、内存）。
2. **定位**：根据火焰图和内存曲线，识别瓶颈是：
   - 全量重绘还是计算逻辑过重？
   - 图形数量/尺寸过大还是状态切换过于频繁？
3. **优化**：有针对性地应用：
   - 局部重绘（脏矩形、剪裁）。
   - 分层渲染（逻辑层与背景层拆分）。
   - 合并绘制与状态管理（减少 save()/restore()、样式切换）。
   - 离屏渲染与 Worker（长逻辑或复杂绘制）。
4. **再测量**：重复使用同一场景进行对比，确认指标是否改善。

通过这样**持续迭代 + 数据驱动**的方式，Canvas 应用既能在高性能设备上释放效果，又能在低性能设备上保持可用和流畅。

