# 图片加载性能优化

http://47.103.169.121:8083/personal-content/image-loading-optimization

## 场景

当一次性加载渲染所有图片导致页面卡顿性能问题

## 解决方案

按需渲染，一次性只加载部分图片

## 传统实现方式效果展示

![image优化效果图](./images/image-optimization/image1.png)

![image优化效果图](./images/image-optimization/image2.png)

## IntersectionObserver 实现方式

![image优化效果图](./images/image-optimization/image3.png)

![image优化效果图](./images/image-optimization/image4.png)
