# Dockerfile
FROM nginx:alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 创建 SSL 证书目录
RUN mkdir -p /etc/nginx/ssl

# 复制 SSL 证书文件
COPY ssl/gukai.top.pem /etc/nginx/ssl/gukai.top.pem
COPY ssl/gukai.top.key /etc/nginx/ssl/gukai.top.key

# 设置证书文件权限
RUN chmod 644 /etc/nginx/ssl/gukai.top.pem && \
    chmod 600 /etc/nginx/ssl/gukai.top.key

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制本地构建的静态文件（VitePress 默认输出到 docs/.vitepress/dist）
COPY docs/.vitepress/dist /usr/share/nginx/html

# 暴露 80 和 443 端口
EXPOSE 80 443
