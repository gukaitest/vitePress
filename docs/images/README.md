# 图片管理说明

## 目录结构

```
docs/
├── public/
│   └── images/          # 公共图片目录（所有文档共享）
│       └── logo.png
│
└── images/              # 文档专属图片目录
    ├── select-optimization/     # 下拉框优化相关图片
    │   ├── image.png
    │   └── demo.png
    ├── table-optimization/       # 表格优化相关图片
    └── ...
```

## 使用方式

### 方式 1: 使用 public 目录（推荐用于公共图片）

将图片放在 `docs/public/images/` 目录下，使用绝对路径引用：

```markdown
![图片描述](/images/图片名称.png)
```

**优点：**

- 所有文档都可以访问
- 路径简洁
- 适合共享的图片（如 logo、图标等）

**示例：**

```markdown
![下拉框优化效果](/images/select-optimization-demo.png)
```

### 方式 2: 使用相对路径（推荐用于文档专属图片）

将图片放在 `docs/images/文档名称/` 目录下，使用相对路径引用：

```markdown
![图片描述](./images/文档名称/图片名称.png)
```

**优点：**

- 图片与文档关联更清晰
- 便于管理，每个文档的图片独立
- 适合文档专属的截图、示意图等

**示例：**

```markdown
![下拉框优化效果](./images/select-optimization/demo.png)
```

## 多张图片展示

### 方式 1: 垂直排列（默认）

```markdown
![图片1](./images/select-optimization/image1.png)
![图片2](./images/select-optimization/image2.png)
```

### 方式 2: 水平排列（使用 HTML）

```markdown
<div style="display: flex; gap: 10px; flex-wrap: wrap;">
  <img src="./images/select-optimization/image1.png" alt="图片1" style="max-width: 300px;" />
  <img src="./images/select-optimization/image2.png" alt="图片2" style="max-width: 300px;" />
</div>
```

### 方式 3: 图片网格

```markdown
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
  <img src="./images/select-optimization/image1.png" alt="图片1" />
  <img src="./images/select-optimization/image2.png" alt="图片2" />
  <img src="./images/select-optimization/image3.png" alt="图片3" />
  <img src="./images/select-optimization/image4.png" alt="图片4" />
</div>
```

## 图片命名规范

建议使用有意义的文件名：

- ✅ `select-optimization-demo.png`
- ✅ `table-before-after.png`
- ❌ `image.png`
- ❌ `123.png`

## 注意事项

1. **图片格式**：推荐使用 PNG（适合截图）或 JPG（适合照片），WebP 格式也支持
2. **图片大小**：建议压缩图片以提升加载速度
3. **路径区分**：
   - `/images/` 开头的路径指向 `docs/public/images/`
   - `./images/` 开头的路径指向当前文档同级的 `images/` 目录
4. **Alt 文本**：始终为图片添加有意义的 alt 文本，提升可访问性
