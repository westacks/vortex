import { createServer, IncomingMessage } from 'node:http'
import { argv, stdout, exit } from 'node:process'
import { getPage, setPage, type Page } from './page'

/**
 * Prerendered page instance
 */
export type SsrResponse = {
    head: string[] | string,
    body: string[] | string,
}

/**
 * Initializes a Vortex server renderer
 *
 * @param renderer A function that returns a prerendered page instance
 * @param port The port to listen on SSR server (in server mode)
 */
export function createVortexServer(renderer: (page: Page) => (SsrResponse | Promise<SsrResponse>), port: number = 13714) {
    if (argv.length >= 3) {
        return createCli(renderer)
    }

    return createSrv(renderer, port)
}

const read = (message: IncomingMessage): Promise<string> => new Promise((resolve, reject) => {
    let data = ''
    message.on('data', (chunk) => (data += chunk))
    message.on('end', () => resolve(data))
    message.on('error', reject)
})

async function createCli(renderer: (page: Page) => (SsrResponse | Promise<SsrResponse>)) {
    try {
        const page = JSON.parse(argv[2] ?? 'null')

        if (page) setPage(page)

        stdout.write(JSON.stringify(await renderer(getPage())) + '\n')
    } catch (error) {
        const res = new Error('Unable to parse page data', {cause: error})
        console.error(res)

        exit(1)
    }
}

async function createSrv(renderer: (page: Page) => (SsrResponse | Promise<SsrResponse>), port: number = 13714) {
    const routes: Record<string, (req: IncomingMessage) => Promise<unknown> | unknown> = {
        '/up': () => ({status: 'OK', timestamp: Date.now()}),
        '/down': () => exit(),
        '/render': async (request) => {
            const timer = performance.now()
            const page = JSON.parse(await read(request) ?? 'null')
            setPage(page)
            const result = await renderer(getPage())
            console.log(`[VORTEX] Rendered page '${page?.url}' in ${performance.now() - timer} ms`)
            return result
        },
        '*' : () => ({status: 'NOT_FOUND', timestamp: Date.now()}),
    }

    console.log(`[VORTEX] Starting server on port ${port}...`)

    return createServer(async (request, response) => {
        const timer = Date.now()
        const route = routes[request.url ?? ''] || routes['*']

        try {
            const result = await route(request)
            response.writeHead(200, {'Content-Type': 'application/json', 'Server': 'Vortex'})
            response.write(JSON.stringify(result))
        } catch (error) {
            response.writeHead(500, {'Content-Type': 'application/json', 'Server': 'Vortex'})
            response.end(JSON.stringify({status: 'ERROR', timestamp: Date.now(), error}))

            console.error(error)
        }

        response.end()
    }).listen(port, () => console.log(`[VORTEX] Listening on port ${port}`))
}
