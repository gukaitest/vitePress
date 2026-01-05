# 下拉树性能优化

http://47.103.169.121:8083/personal-content/el-select-tree-optimization

## 场景

一次性渲染所有下拉树的所有节点，当下拉树节点过多时，导致性能卡顿

## 解决方案

按需渲染，下拉框按需渲染只渲染下拉框窗口的数据

## 效果展示

![下拉树优化效果图](./images/tree-optimization/image.png)
