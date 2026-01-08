pipeline {
    agent any

    environment {
      DOCKER_IMAGE = 'vitepress'
      PATH = "${env.PATH}:/usr/bin"
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/gukaitest/vitePress.git'
            }
        }
        stage('构建项目') {
            steps {
                nodejs('node 23.8.0') {
                    sh 'rm -rf node_modules' // 删除 node_modules 目录
                    sh 'rm -f package-lock.json pnpm-lock.yaml' // 删除锁文件
                    // 安装 pnpm
                    sh 'pnpm config set registry https://registry.npmmirror.com' // 设置镜像源
                    sh 'npm install -g pnpm'
                    sh 'pnpm cache clean'
                    sh 'pnpm store prune'
                    sh 'echo $PATH'
                    sh 'node -v'
                    sh 'pnpm -v'
                    sh 'echo "开始安装依赖..."'
                    sh 'pnpm install'
                    sh 'echo "依赖安装完成，开始构建项目..."'
                    sh 'pnpm run docs:build'
                    sh 'echo "项目构建完成。"'
                }
            }
        }
        stage('Prepare SSL Certificates') {
            steps {
                script {
                    // 从 Jenkins 凭据中提取 SSL 证书文件
                    withCredentials([
                        file(credentialsId: 'ssl-cert-pem', variable: 'SSL_CERT_PEM'),
                        file(credentialsId: 'ssl-cert-key', variable: 'SSL_CERT_KEY')
                    ]) {
                        sh 'echo "提取 SSL 证书文件..."'
                        sh 'mkdir -p ssl'
                        sh "cp ${SSL_CERT_PEM} ssl/gukai.top.pem"
                        sh "cp ${SSL_CERT_KEY} ssl/gukai.top.key"
                        sh 'chmod 644 ssl/gukai.top.pem'
                        sh 'chmod 600 ssl/gukai.top.key'
                        sh 'echo "SSL 证书文件准备完成"'
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script {
                    // 使用 Docker Pipeline 插件语法
                      sh 'echo "构建镜像..."'
                      sh 'pwd'          // 输出当前工作区绝对路径
                      sh 'ls -l'         // 列出所有文件，确认是否存在 Dockerfile
                      sh 'find . -name Dockerfile'  // 搜索整个目录树1
                      sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }

        stage('Cleanup Old Container') {
            steps {
                script {
                    sh 'docker stop vitepress-container || true'
                    sh 'docker rm vitepress-container || true'
                }
            }
        }

        stage('Run Container') {
            steps {
                script {
                     // 停止并删除旧容器
                    sh "docker stop vitepress-container || true && docker rm vitepress-container || true"
                    // 运行新容器，映射 443 端口用于 HTTPS，80 端口用于 HTTP 重定向
                    sh "docker run -d -p 443:443 -p 8080:80 --name vitepress-container ${DOCKER_IMAGE}"
                }
            }
        }
    }

    post {
        always {
            script {
                // 清理旧镜像
                sh 'docker system prune -af'
            }
        }
    }
}

