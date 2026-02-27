# Vite 配置优化

## 概述

本文介绍在实际项目中常用的 Vite 配置优化思路，涵盖路径别名、环境变量、开发服务器、打包与代码压缩、缓存策略以及性能监控等方面，帮助你在 **开发体验** 和 **构建性能** 之间取得平衡。

> 说明：本文示例基于 Vite 5，使用 TypeScript 配置文件 `vite.config.ts`，但核心思路同样适用于 JavaScript 配置。

---

## 路径别名：提高开发效率与可读性

### 基础别名配置

在中大型项目中，使用相对路径（如 `../../../components/Button`）既不直观又容易出错，推荐通过别名统一为类似 `@/components/Button` 的写法。

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "#components": path.resolve(__dirname, "src/components"),
    },
  },
});
```

- **好处**
  - **可读性更好**：一眼看出模块来源目录。
  - **迁移成本更低**：目录结构调整时只需改别名指向。
  - **IDE 体验更好**：配合对应的 `tsconfig.json` / `jsconfig.json`，可获得跳转与补全支持。

### 与 TypeScript / IDE 对齐

仅在 Vite 中配置别名还不够，还需要让 TypeScript（或 VS Code）也认识这些别名：

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "#components/*": ["src/components/*"]
    }
  }
}
```

> 建议：别名前缀使用 `@` 或 `#`，避免与 npm 包名冲突。

---

## 环境变量：实现环境隔离与配置管理

### 环境变量文件约定

Vite 默认约定以下环境文件（后加载会覆盖先加载）：

- `.env`：所有环境通用配置
- `.env.development`：开发环境专用
- `.env.test`：测试环境专用
- `.env.production`：生产环境专用

> **注意**：Vite 只会暴露以 `VITE_` 开头的变量到客户端代码中。

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000

# .env.production
VITE_API_BASE_URL=https://api.example.com
```

在代码中使用：

```ts
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

### 使用 `define` 注入构建时常量

对于不适合作为环境变量，但需要在构建时替换的常量，可以使用 `define`：

```ts
// vite.config.ts
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
```

在代码中：

```ts
console.log("App version:", __APP_VERSION__);
```

> 建议：**敏感信息（如密钥、数据库密码）不要放在前端环境变量中**，应通过后端或网关代理去封装。

---

## 开发服务器配置：提升开发体验

### 常用 dev server 配置

```ts
// vite.config.ts
export default defineConfig({
  server: {
    host: "0.0.0.0", // 局域网可访问
    port: 5173,
    open: true, // 启动自动打开浏览器
    strictPort: true, // 端口被占用时直接报错，而不是递增
    cors: true, // 开启 CORS
  },
});
```

### 接口代理减少跨域与本地配置成本

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

- **推荐实践**
  - 本地开发统一走 `/api` 前缀，减少环境切换时的判断。
  - 使用 `changeOrigin: true` 解决部分后端服务器的 Host 校验问题。

---

## 打包优化：代码分割与预构建

### 合理的代码分割策略

Vite 底层使用 Rollup 打包，支持通过 `build.rollupOptions.output` 自定义拆包策略。

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 把常用三方库拆成独立 chunk，方便浏览器缓存
          vue: ["vue", "vue-router", "pinia"],
          vendor: ["axios", "lodash-es"],
        },
      },
    },
  },
});
```

- **拆包原则**
  - **高复用三方依赖** 单独拆包，例如 `vue`、`react`、`lodash-es`。
  - **低频访问页面的大型模块** 使用路由懒加载，按需加载。
  - 避免过度拆分导致请求过多，权衡 **请求数** 与 **单包体积**。

### 动态导入与路由懒加载

```ts
// 示例：Vue Router
const Home = () => import("@/views/Home.vue");
const About = () => import("@/views/About.vue");
```

相比静态导入，动态导入会自动生成独立 chunk，在首屏加载时只拉取必要页面代码。

### 预构建优化（esbuild 预打包）

Vite 会对依赖进行预构建，以提升开发服务器启动速度。可通过 `optimizeDeps` 做精细控制：

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ["lodash-es", "axios"],
    exclude: ["some-big-lib-that-you-use-rarely"],
  },
});
```

- **include**：强制某些依赖参与预构建，避免运行时首次访问卡顿。
- **exclude**：排除部分极大但很少用的库，必要时再做优化。

---

## 使用构建分析工具：持续优化包体积

### 内置 `--mode` + 构建报告

可通过 `build.rollupOptions` 配合社区插件来分析打包结果。

```bash
npm install --save-dev rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: true,
    }) as any,
  ],
});
```

构建完成后打开 `dist/stats.html`，即可可视化查看各个 chunk 的体积构成，指导后续拆包与依赖精简。

---

## 代码压缩：平衡压缩效果与构建时间

### JS 压缩配置

Vite 默认使用 esbuild 进行压缩，速度非常快；如需更强压缩率，可切换为 Terser，但构建时间会增加。

```ts
// vite.config.ts
export default defineConfig({
  build: {
    minify: "esbuild", // 默认值，也可以设置为 'terser'
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

- **推荐做法**
  - **开发环境**：保持默认 `minify: false` 或使用 esbuild，构建速度优先。
  - **生产环境**：视项目体积，决定是否启用 Terser 并移除 `console` 等调试代码。

### CSS 压缩与提取

Vite 在生产环境下自动进行 CSS 压缩，一般无需额外配置。但可以通过以下方式改善输出：

```ts
// vite.config.ts
export default defineConfig({
  build: {
    cssCodeSplit: true, // 按需拆分 css
  },
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
});
```

- **建议**
  - 开启 `cssCodeSplit`，减少单个 CSS 文件体积，避免一次性加载过多样式。
  - 对于公共样式和变量通过预处理器统一注入，减少重复引入。

### 图片与静态资源压缩

原生 Vite 不内置图片压缩，建议配合插件或构建前预处理：

```bash
npm install vite-plugin-imagemin -D
```

```ts
// vite.config.ts
import viteImagemin from "vite-plugin-imagemin";

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: {
        plugins: [{ name: "removeViewBox", active: false }],
      },
    }),
  ],
});
```

- **补充建议**
  - 优先使用 **现代格式**：例如 WebP、AVIF。
  - 对于大图使用 **懒加载** 与 **占位图**，进一步优化首屏。

---

## 性能提升与缓存策略

### 构建缓存：提升二次构建速度

Vite 默认会在 `node_modules/.vite` 中缓存预构建依赖，一般无需特殊配置。但可以注意：

- 依赖升级后可以手动删除 `node_modules/.vite`，避免缓存不一致问题。
- 在 CI 环境下缓存 `node_modules` 与 `.vite` 可显著加快构建时间。

### 浏览器缓存策略

Vite 生产构建默认会对输出文件使用 **内容哈希**，因此可以安全设置较长的缓存时间。

在典型的 Nginx 配置中：

```nginx
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location / {
  add_header Cache-Control "no-store";
}
```

- 静态资源（带哈希）长期缓存，提高重复访问性能。
- `index.html` 不缓存，确保用户获取最新的资源引用。

### 开发服务器性能优化

- **减少不必要的插件**：开发阶段可以禁用部分仅用于生产构建的插件。
- **合理划分模块**：避免单个文件过于庞大，影响 HMR 性能。
- **关闭不必要的 Sourcemap**：

```ts
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false, // 生产环境仅在需要排错时开启
  },
});
```

---

## 小结

- **路径别名与环境变量**：提升开发体验与配置管理能力。
- **打包与代码压缩**：通过代码分割、预构建与压缩策略，控制包体积与构建时间。
- **缓存与性能监控**：利用构建缓存与浏览器缓存方案，配合性能监控工具形成持续优化闭环。

根据项目规模和团队情况，逐步引入上述优化策略，而不是一次性全部启用，始终以 **可维护性** 和 **稳定性** 为第一优先级。
