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
                link: '/installation',
                items: [
                    { text: 'React', link: '/installation/react' },
                    { text: 'Vue', link: '/installation/vue' },
                    { text: 'Svelte', link: '/installation/svelte' },
                    { text: 'SolidJS', link: '/installation/solid-js' },
                ]
            },
            {
                text: 'Usage',
                items: [
                    { text: 'Navigation', link: '/usage/navigation' },
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
