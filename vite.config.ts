import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { builtinModules } from 'node:module'
import types from 'vite-plugin-dts'

export default defineConfig({
    plugins: [types()],
    build: {
        lib: {
            name: 'vortex',
            entry: {
                "index": resolve(__dirname, 'src/index.ts'),
                "server": resolve(__dirname, 'src/server.ts'),
                "extensions": resolve(__dirname, 'src/extensions/index.ts'),
            },
        },
        rollupOptions: {
            external: [...builtinModules, /^node:/, 'axios']
        }
    },
})
