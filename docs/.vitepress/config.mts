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
      { text: '前端监控', link: '/frontendmonitoring' }
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
      { text: 'Examples', link: '/markdown-examples' },
      { text: '前端重难点', link: '/front-end-question' }
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
      // 其他路由下的侧边栏，显示Examples相关内容
      '/': [
        {
          text: 'Examples',
          items: [
            { text: 'Markdown Examples', link: '/markdown-examples' },
            { text: 'Runtime API Examples', link: '/api-examples' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
