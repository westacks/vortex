import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Vortex",
    description: "Server-based routing for SPA",
    base: '/vortex',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Examples', link: '/markdown-examples' }
        ],

        sidebar: [
            { text: 'Introduction', link: '/introduction', },
            {
                text: 'Installation',
                items: [
                    { text: 'Server', link: '/installation/server' },
                    { text: 'Client', link: '/installation/client' },
                ]
            },
            {
                text: 'Usage',
                items: [
                    { text: 'Navigation', link: '/usage/navigation' },
                    { text: 'Extensions API', link: '/usage/extensions' },
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/westacks/vortex' }
        ]
    },
    markdown: {
        config(md) {
            // @ts-ignore
            md.use(tabsMarkdownPlugin)
        }
    }
})
