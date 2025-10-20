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
            { text: 'Guide', link: '/introduction' },
            { text: 'API', link: '/api' },
            { text: 'Examples', link: '/examples' }
        ],

        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Introduction', link: '/introduction' },
                    { text: 'Installation', link: '/installation' },
                ]
            },
            {
                text: 'Framework Guides',
                items: [
                    { text: 'React', link: '/installation/react' },
                    { text: 'Vue', link: '/installation/vue' },
                    { text: 'Svelte', link: '/installation/svelte' },
                    { text: 'SolidJS', link: '/installation/solid-js' },
                ]
            },
            {
                text: 'Core Concepts',
                items: [
                    { text: 'Navigation', link: '/usage/navigation' },
                    { text: 'Forms', link: '/usage/forms' },
                    { text: 'State Management', link: '/usage/state' },
                    { text: 'Polling', link: '/usage/polling' },
                    { text: 'Loading When Visible', link: '/usage/visible' },
                    { text: 'Prefetching', link: '/usage/prefetching' },
                ]
            },
            {
                text: 'API Reference',
                items: [
                    { text: 'Core API', link: '/api' },
                    { text: 'Extensions', link: '/extensions' },
                ]
            },
            {
                text: 'Examples & Patterns',
                items: [
                    { text: 'Usage Examples', link: '/examples' },
                    { text: 'Advanced Patterns', link: '/advanced' },
                ]
            },
            {
                text: 'Migration & Integration',
                items: [
                    { text: 'From Inertia.js', link: '/migration/inertia' },
                    { text: 'From React Router', link: '/migration/react-router' },
                    { text: 'From Vue Router', link: '/migration/vue-router' },
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/westacks/vortex' }
        ],

        search: {
            provider: 'local'
        },

        footer: {
            message: 'Released under the MIT License.',
            copyright: `Copyright © 2024-${new Date().getFullYear()} Westacks`
        }
    },
    markdown: {
        config(md) {
            // @ts-ignore
            md.use(tabsMarkdownPlugin)
        }
    }
})
