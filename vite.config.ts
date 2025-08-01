import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { builtinModules } from 'node:module'
import types from 'vite-plugin-dts'
import eslint from 'vite-plugin-eslint';

export default defineConfig({
    plugins: [
        types({
            copyDtsFiles: true
        }),
        eslint({
            include: resolve(__dirname, 'src/**/*.ts'),
            fix: true,
        }),
    ],
    build: {
        lib: {
            name: 'vortex',
            entry: {
                "index": resolve(__dirname, 'src/index.ts'),
                "server": resolve(__dirname, 'src/server.ts'),
                // Extensions
                "extensions/inertia/index": resolve(__dirname, 'src/extensions/inertia/index.ts'),
                "extensions/bprogress": resolve(__dirname, 'src/extensions/bprogress.ts'),
                // Adapters
                "adapters/svelte": resolve(__dirname, 'src/adapters/svelte.ts'),
                "adapters/vue": resolve(__dirname, 'src/adapters/vue.ts'),
                "adapters/solid-js": resolve(__dirname, 'src/adapters/solid-js.ts'),
                "adapters/react": resolve(__dirname, 'src/adapters/react.ts'),
            },
        },
        rollupOptions: {
            external: [
                ...builtinModules,
                /^node:/,
                'axios',
                /^\@bprogress\/core/,
                /^svelte/,
                'vue',
                /^solid\-js/,
                /^react/,
            ],
        }
    },
})
