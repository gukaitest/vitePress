# Webpack 配置优化

## 概述

Webpack 配置优化是提升前端项目构建性能和运行时性能的关键。本文档介绍常用的 Webpack 优化策略，包括代码分割、缓存优化、构建速度优化等。

## 1. JS 代码分包（Code Splitting）

### 1.1 入口分包

通过配置多个入口点，将代码分割成多个 bundle：

```javascript
module.exports = {
  entry: {
    main: "./src/index.js",
    vendor: "./src/vendor.js",
    polyfill: "./src/polyfill.js",
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
};
```

### 1.2 动态导入（Dynamic Import）

使用 `import()` 语法实现按需加载：

```javascript
// 路由懒加载
const Home = () => import("./pages/Home.vue");
const About = () => import("./pages/About.vue");

// 条件加载
if (condition) {
  import("./moduleA").then((module) => {
    // 使用 module
  });
}
```

### 1.3 SplitChunks 配置

通过 `optimization.splitChunks` 配置自动代码分割：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all", // 对所有类型的 chunk 进行分割
      cacheGroups: {
        // 提取第三方库
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
          reuseExistingChunk: true,
        },
        // 提取公共代码
        common: {
          name: "common",
          minChunks: 2, // 至少被 2 个 chunk 引用
          priority: 5,
          reuseExistingChunk: true,
        },
        // 提取 CSS
        styles: {
          test: /\.css$/,
          name: "styles",
          type: "css/mini-extract",
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
};
```

### 1.4 路由级别的代码分割

在 Vue Router 中实现路由级别的代码分割：

```javascript
const routes = [
  {
    path: "/home",
    component: () => import(/* webpackChunkName: "home" */ "./views/Home.vue"),
  },
  {
    path: "/about",
    component: () =>
      import(/* webpackChunkName: "about" */ "./views/About.vue"),
  },
];
```

## 2. 缓存优化

### 2.1 文件哈希命名

使用内容哈希生成文件名，实现长期缓存：

```javascript
module.exports = {
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].chunk.js",
    assetModuleFilename: "assets/[name].[contenthash:8][ext]",
  },
};
```

### 2.2 模块 ID 稳定化

使用 `optimization.moduleIds` 和 `optimization.chunkIds` 确保模块 ID 稳定：

```javascript
module.exports = {
  optimization: {
    moduleIds: "deterministic", // 使用确定性 ID
    chunkIds: "deterministic",
    runtimeChunk: {
      name: "runtime", // 将运行时代码单独提取
    },
  },
};
```

### 2.3 缓存组配置

合理配置缓存组，避免不必要的重新构建：

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        default: false,
        vendors: false,
        // 将第三方库单独打包，利用浏览器缓存
        vendor: {
          name: "vendor",
          chunks: "all",
          test: /[\\/]node_modules[\\/]/,
          priority: 20,
        },
        // 将运行时代码单独打包
        runtime: {
          name: "runtime",
          chunks: "all",
          test: /runtime/,
          priority: 10,
        },
      },
    },
  },
};
```

## 3. 构建速度优化

### 3.1 使用缓存

启用持久化缓存，加速二次构建：

```javascript
module.exports = {
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
};
```

### 3.2 减少解析范围

通过 `resolve` 配置减少模块解析范围：

```javascript
module.exports = {
  resolve: {
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    extensions: [".js", ".vue", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      vue$: "vue/dist/vue.esm-bundler.js",
    },
  },
};
```

### 3.3 使用多进程构建

使用 `thread-loader` 或 `HappyPack` 实现多进程构建：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "thread-loader",
            options: {
              workers: 2,
            },
          },
          "babel-loader",
        ],
      },
    ],
  },
};
```

### 3.4 排除不必要的文件

使用 `externals` 排除不需要打包的依赖：

```javascript
module.exports = {
  externals: {
    vue: "Vue",
    "vue-router": "VueRouter",
    axios: "axios",
  },
};
```

## 4. Tree Shaking

### 4.1 启用 Tree Shaking

确保使用 ES6 模块语法，并启用生产模式：

```javascript
module.exports = {
  mode: "production",
  optimization: {
    usedExports: true,
    sideEffects: false, // 标记为无副作用
  },
};
```

### 4.2 package.json 配置

在 `package.json` 中标记副作用：

```json
{
  "sideEffects": ["*.css", "*.scss", "./src/some-side-effect-file.js"]
}
```

## 5. 压缩优化

### 5.1 JS 压缩

使用 TerserPlugin 进行代码压缩：

```javascript
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
            drop_debugger: true,
          },
        },
      }),
    ],
  },
};
```

### 5.2 CSS 压缩

使用 `css-minimizer-webpack-plugin` 压缩 CSS：

```javascript
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [new CssMinimizerPlugin()],
  },
};
```

## 6. 资源优化

### 6.1 图片优化

使用 `image-webpack-loader` 压缩图片：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[contenthash:8].[ext]",
            },
          },
          {
            loader: "image-webpack-loader",
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4,
              },
            },
          },
        ],
      },
    ],
  },
};
```

### 6.2 字体优化

使用 `url-loader` 将小字体文件转为 base64：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 8192, // 小于 8KB 转为 base64
            name: "[name].[contenthash:8].[ext]",
          },
        },
      },
    ],
  },
};
```

## 7. 开发体验优化

### 7.1 Source Map

开发环境使用详细的 source map，生产环境使用简洁版本：

```javascript
module.exports = {
  devtool:
    process.env.NODE_ENV === "production"
      ? "source-map"
      : "eval-cheap-module-source-map",
};
```

### 7.2 热更新优化

配置 HMR（Hot Module Replacement）：

```javascript
module.exports = {
  devServer: {
    hot: true,
    liveReload: false,
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
};
```

## 8. 性能监控

### 8.1 Bundle 分析

使用 `webpack-bundle-analyzer` 分析打包结果：

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      openAnalyzer: false,
    }),
  ],
};
```

### 8.2 构建时间分析

使用 `speed-measure-webpack-plugin` 分析构建时间：

```javascript
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // webpack 配置
});
```

## 总结

Webpack 配置优化是一个持续的过程，需要根据项目实际情况进行调整。主要优化方向包括：

1. **代码分割**：减少初始加载体积
2. **缓存策略**：提升二次加载速度
3. **构建速度**：提升开发体验
4. **资源优化**：减少资源体积
5. **Tree Shaking**：移除无用代码

通过合理配置这些优化策略，可以显著提升项目的构建性能和运行时性能。
