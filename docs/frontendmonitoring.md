# 前端监控系统核心功能分析

http://47.103.169.121:8083/personal-content/frontendmonitoring

该前端监控系统包含三个模块，覆盖性能、错误和用户行为监控。

---

## 一、前端性能监控 (PerformanceOptimization)

### 1. Web Vitals 核心指标监控

```typescript
// 监控的核心指标
- FCP (First Contentful Paint) - 首次内容绘制
- LCP (Largest Contentful Paint) - 最大内容绘制
- FID (First Input Delay) - 首次输入延迟
- TTFB (Time to First Byte) - 首字节时间
- CLS (Cumulative Layout Shift) - 累积布局偏移
- INP (Interaction to Next Paint) - 交互到下次绘制
- FMP (First Meaningful Paint) - 首次有意义绘制
- Speed Index - 速度指数
```

功能特点：

- 自动采集 Web Vitals 指标
- 评级：good / needs-improvement / poor
- 数据上报到后端
- 表格展示历史数据

### 2. FPS 监控

```typescript
fpsConfig: {
  duration: 2000,        // 监控2秒
  sampleInterval: 100,    // 100ms采样一次
  enabled: true
}
```

功能特点：

- 实时监控帧率
- 可配置采样间隔和持续时间
- 支持阈值告警（默认 30fps）

### 3. 长任务监控 (Long Task)

```typescript
longTaskConfig: {
  enabled: true,
  threshold: 50,         // 50ms阈值
  maxTasks: 100,         // 最多记录100个
  includeAttribution: true // 包含任务详情
}
```

功能特点：

- 监控超过 50ms 的长任务
- 记录任务来源（脚本、样式等）
- 定位性能瓶颈

### 4. 内存监控与泄漏检测

```typescript
memoryLeakConfig: {
  enabled: true,
  interval: 5000,                    // 5秒监控一次
  warningThreshold: 80,              // 80%警告
  dangerThreshold: 90,               // 90%危险
  growthRateThreshold: 10,           // 10MB/分钟
  trendWindowSize: 10                // 10个样本检测趋势
}
```

功能特点：

- 监控 JS 堆内存使用
- 检测内存增长趋势
- 计算泄漏评分（0-100）
- 趋势分析：stable / increasing / decreasing

### 5. 数据展示与统计

- 表格展示：性能指标、值、评级、时间
- 单位自动添加：ms、MB、fps 等
- 分页加载：支持滚动加载更多
- 历史数据查询：按时间查看趋势

---

## 二、前端错误监控 (ErrorMonitor)

### 1. 错误类型覆盖

```typescript
enum ErrorType {
  JAVASCRIPT = "javascript", // JS运行时错误
  VUE = "vue", // Vue组件错误
  PROMISE = "promise", // Promise未捕获错误
  RESOURCE = "resource", // 资源加载错误
  AJAX = "ajax", // 请求错误
  CUSTOM = "custom", // 自定义错误
}
```

### 2. 错误级别分类

```typescript
enum ErrorLevel {
  LOW = "low", // 低级别
  MEDIUM = "medium", // 中级别
  HIGH = "high", // 高级别
  CRITICAL = "critical", // 严重级别
}
```

### 3. 错误信息收集

收集的信息包括：

- 基础信息：错误类型、级别、消息、堆栈
- 位置信息：文件名、行号、列号
- 上下文信息：URL、UserAgent、时间戳、用户 ID、会话 ID
- Vue 信息：组件名、组件堆栈、Props 数据
- 路由信息：当前路由、参数、查询
- 资源错误：资源类型、资源 URL
- 请求错误：请求 URL、方法、数据、响应状态
- 自定义数据：任意扩展信息

### 4. 错误捕获机制

```typescript
// 1. 全局错误捕获
window.addEventListener('error', ...)
window.addEventListener('unhandledrejection', ...)

// 2. Vue错误捕获
app.config.errorHandler = ...

// 3. 资源错误捕获
window.addEventListener('error', (e) => {
  if (e.target !== window) { // 资源错误
    ...
  }
})

// 4. 请求错误拦截
axios.interceptors.response.use(..., (error) => {
  // 捕获请求错误
})
```

### 5. 错误过滤与采样

```typescript
// 忽略常见错误
ignoreErrors: [
  "Script error",
  "Non-Error promise rejection captured",
  /ResizeObserver loop limit exceeded/,
];

// 忽略第三方资源
ignoreUrls: [/chrome-extension/, /moz-extension/, /safari-extension/];

// 采样率控制
sampleRate: 1; // 100%采样率
```

### 6. 批量上报机制

```typescript
batchConfig: {
  enabled: true,
  batchSize: 10,              // 达到10条上报
  batchInterval: 120000       // 120秒超时上报
}
```

### 7. 错误测试功能

提供测试按钮，可触发：

- JS 错误
- Vue 错误
- Promise 错误
- 资源错误
- 请求错误（含高级场景）
- 自定义错误

---

## 三、前端用户行为监控 (Behavior)

### 1. 行为类型监控

```typescript
enum UserBehaviorType {
  CLICK = "click", // 点击行为
  SCROLL = "scroll", // 滚动行为
  INPUT = "input", // 输入行为
  FOCUS = "focus", // 焦点行为
  BLUR = "blur", // 失焦行为
  RESIZE = "resize", // 窗口大小变化
  NAVIGATION = "navigation", // 页面导航
  PAGE_VIEW = "page_view", // 页面浏览
  SESSION_START = "session_start", // 会话开始
  SESSION_END = "session_end", // 会话结束
  CUSTOM = "custom", // 自定义行为
}
```

### 2. 行为级别分类

```typescript
enum UserBehaviorLevel {
  LOW = "low", // 低级别（如滚动）
  MEDIUM = "medium", // 中级别（如点击、输入）
  HIGH = "high", // 高级别（如导航、页面浏览）
  CRITICAL = "critical", // 严重级别
}
```

### 3. 点击行为监控

```typescript
click: {
  enabled: true,
  debounceTime: 300,      // 防抖300ms
  trackText: true,        // 记录元素文本
  trackPosition: true     // 记录点击位置
}
```

收集信息：

- 元素标签、ID、类名、文本
- 点击坐标（x, y）
- 元素尺寸
- 滚动位置

### 4. 滚动行为监控

```typescript
scroll: {
  enabled: true,
  throttleTime: 100,      // 节流100ms
  trackDirection: true,    // 记录滚动方向
  trackSpeed: false       // 不记录滚动速度
}
```

### 5. 输入行为监控

```typescript
input: {
  enabled: true,
  debounceTime: 500,      // 防抖500ms
  trackValue: false,      // 不记录输入值（隐私保护）
  sensitiveFields: [      // 敏感字段列表
    'password', 'pwd',
    'secret', 'token', 'key'
  ]
}
```

隐私保护：

- 默认不记录输入值
- 敏感字段自动过滤

### 6. 页面与导航监控

```typescript
page: {
  enabled: true,
  trackPageView: true,      // 页面浏览
  trackNavigation: true,    // 路由导航
  trackResize: true         // 窗口大小变化
}
```

### 7. 会话管理

```typescript
session: {
  enabled: true,
  sessionTimeout: 30 * 60 * 1000, // 30分钟超时
  trackSessionStart: true,
  trackSessionEnd: true
}
```

功能特点：

- 自动生成会话 ID
- 30 分钟无活动自动结束会话
- 记录会话开始/结束时间

### 8. 行为数据收集

收集的信息包括：

- 基础信息：行为类型、级别、动作、目标、值
- 位置信息：坐标、元素尺寸、滚动位置
- 元素信息：标签、ID、类名、文本、链接、图片源
- 上下文信息：URL、UserAgent、时间戳、用户 ID、会话 ID
- 路由信息：当前路由、参数、查询、上一路由
- 页面信息：页面标题、来源、视口尺寸
- 设备信息：设备类型、浏览器类型、操作系统

---

## 四、核心特性总结

### 1. 批量上报优化

所有监控模块都支持批量上报：

- 减少网络请求次数
- 提高上报效率
- 支持超时自动上报

### 2. 数据过滤机制

- 错误过滤：忽略常见系统错误
- 行为过滤：忽略系统元素和常见行为
- URL 过滤：忽略扩展程序资源

### 3. 采样率控制

```typescript
sampleRate: 1; // 0-1之间，控制上报比例
```

### 4. 内存保护

```typescript
maxErrors: 100; // 最多保存100个错误
maxBehaviors: 1000; // 最多保存1000个行为
```

### 5. 环境变量配置

```typescript
// 通过环境变量配置上报URL
VITE_WEB_VITALS_REPORT_URL;
VITE_ERROR_MONITOR_REPORT_URL;
VITE_USER_BEHAVIOR_REPORT_URL;
```

### 6. 控制台日志

```typescript
enableConsoleLog: true; // 开发环境便于调试
```

---

## 五、数据展示功能

三个模块都提供：

- 虚拟表格展示（ElTableV2）
- 分页加载（滚动加载更多）
- 数据格式化（时间、单位、颜色标签）
- 实时数据更新

---

## 六、技术架构

1. 模块化设计：性能、错误、行为独立模块
2. 可配置：支持丰富的配置选项
3. 批量上报：减少网络开销
4. 隐私保护：敏感信息过滤
5. 性能优化：防抖、节流、采样
6. 类型安全：完整的 TypeScript 类型定义

该监控系统覆盖了前端监控的主要场景，可用于生产环境。
