import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { builtinModules } from 'node:module'
import types from 'vite-plugin-dts'

export default defineConfig({
    plugins: [types()],
    build: {
        minify: true,
        lib: {
            name: 'vortex',
            entry: {
                "index": resolve(__dirname, 'src/index.ts'),
                "server": resolve(__dirname, 'src/server.ts'),
                "inertia": resolve(__dirname, 'src/extensions/inertia.ts'),
                "bprogress": resolve(__dirname, 'src/extensions/bprogress.ts'),
            },
        },
        rollupOptions: {
            external: [...builtinModules, /^node:/, 'axios', /^\@bprogress\/core/],
        }
    },
})
