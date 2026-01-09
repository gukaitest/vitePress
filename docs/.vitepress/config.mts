import { defineConfig } from 'vitepress'

// 前端重难点侧边栏配置（共享配置）
const frontEndQuestionSidebar = [
  {
    text: '前端重难点',
    items: [
      { text: '前端重难点', link: '/front-end-question' },
      { text: '下拉框性能优化', link: '/select-optimization' },
      { text: '下拉树优化', link: '/el-select-tree-optimization' },
      { text: 'table性能优化', link: '/table-optimization' },
      { text: '图片滚动加载优化', link: '/image-loading-optimization' },
      { text: 'echarts优化', link: '/echarts-optimization' },
      { text: '大文件上传', link: '/large-file-upload' },
      { text: '前端监控', link: '/frontendmonitoring' },
      { text: 'Jenkins CI/CD', link: '/jenkins-ci-cd' },
      { text: 'Webpack配置优化', link: '/webpack-optimization' },
      { text: 'Vite配置优化', link: '/vite-optimization' },
      { text: '单点登录', link: '/sso' },
      { text: 'Canvas优化', link: '/canvas-optimization' },
      { text: 'Dify', link: '/dify' },
      { text: 'Nginx配置', link: '/nginx-config' },
      { text: 'https/SSL与域名配置', link: '/https-ssl-domain-config' }
    ]
  }
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Awesome Project",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '前端重难点', link: '/front-end-question' },
      { text: '其它项目链接', link: '/other-project' },

    ],

    sidebar: {
      // 前端重难点相关路由的侧边栏配置
      // 为所有前端重难点相关的页面配置相同的侧边栏
      '/front-end-question': frontEndQuestionSidebar,
      '/select-optimization': frontEndQuestionSidebar,
      '/el-select-tree-optimization': frontEndQuestionSidebar,
      '/table-optimization': frontEndQuestionSidebar,
      '/image-loading-optimization': frontEndQuestionSidebar,
      '/echarts-optimization': frontEndQuestionSidebar,
      '/large-file-upload': frontEndQuestionSidebar,
      '/frontendmonitoring': frontEndQuestionSidebar,
      '/jenkins-ci-cd': frontEndQuestionSidebar,
      '/webpack-optimization': frontEndQuestionSidebar,
      '/vite-optimization': frontEndQuestionSidebar,
      '/sso': frontEndQuestionSidebar,
      '/canvas-optimization': frontEndQuestionSidebar,
      '/dify': frontEndQuestionSidebar,
      '/nginx-config': frontEndQuestionSidebar,
      '/https-ssl-domain-config': frontEndQuestionSidebar,
      // 其他项目链接路由配置
      '/other-project': [
        {
          text: '其它项目链接',
          items: [
            { text: '其它项目链接', link: '/other-project' }
          ]
        }
      ],
      // 首页侧边栏配置
      '/': [
        {
          text: '其它项目链接',
          items: [
            { text: '其它项目链接', link: '/other-project' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
