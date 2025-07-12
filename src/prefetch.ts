import { InternalRouterRequestConfig, RouterResponse, RouterRequestConfig, VortexExtension, axios } from "./router";
import { AxiosAdapter, getAdapter } from "axios";

export type PrefetchedResponse = {
    ttl: number
    stale: number | undefined
    response: Promise<RouterResponse>
    timestamp: number
}

export const prefetch: VortexExtension = ({ request, response }) => {
    const cache = new Map<string, PrefetchedResponse>()
    const req = request.use(async (config) => {
        const key = await hash(config)
        cache.forEach((v, k) => {
            if (isExpired(v)) {
                cache.delete(k)
            }
        })

        const defaultAdapter = getAdapter(config.adapter as AxiosAdapter)
        config.adapter = (config: InternalRouterRequestConfig) => config.prefetch
            ? handlePrefetch(config, key, defaultAdapter)
            : handleRequest(config, key, defaultAdapter)

        return config
    })

    async function handlePrefetch(config: InternalRouterRequestConfig, key: string, adapter: AxiosAdapter): Promise<RouterResponse> {
        const cached = cache.get(key)

        const toResponse = async (response: Promise<RouterResponse>) => {
            const res = await response
            res.config.prefetch = true
            return res
        }

        if (cached) {
            return toResponse(cached.response)
        }

        const response = toResponse(adapter(config))

        cache.set(key, { ...getTimeParams(config.prefetch), response })

        return response
    }

    async function handleRequest(config: InternalRouterRequestConfig, key: string, adapter: AxiosAdapter): Promise<RouterResponse> {
        const cached = cache.get(key)
        const timestamp = Date.now()

        const toResponse = async (response: Promise<RouterResponse>) => {
            const res = await response
            res.config.prefetch = false
            return res
        }

        if (!cached) {
            return toResponse(adapter(config))
        }

        const age = timestamp - cached.timestamp;

        if (cached.ttl && age < cached.ttl) {
            return toResponse(cached.response)
        }

        cache.delete(key)

        if (cached.stale && age < cached.stale) {
            axios.request(config as RouterRequestConfig)
            return toResponse(cached.response)
        }

        return toResponse(adapter(config))
    }

    return () => {
        request.eject(req)
        cache.clear()
    }
}

async function hash(config: InternalRouterRequestConfig): Promise<string> {
    const url = new URL(config.url as string, config.baseURL || window.location.origin)
    const data = JSON.stringify({
        url: url.origin + url.pathname + url.search,
        method: (config.method || 'get').toLowerCase(),
        data: config.data ?? "{}"
    })
    const buffer = await crypto.subtle.digest('sha-1', new TextEncoder().encode(data))
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function isExpired(response: PrefetchedResponse): boolean {
    const age = Date.now() - response.timestamp
    const isStale = !!response.stale && age < response.stale
    const isExpired = age > response.ttl

    return isExpired && !isStale
}

function getTimeParams(prefetch: InternalRouterRequestConfig['prefetch']) {
    let ttl: number, stale: number | undefined

    if (Array.isArray(prefetch)) {
        ttl = durationToMs(prefetch[0])
        stale = durationToMs(prefetch[1])
    } else if (prefetch === true) {
        ttl = durationToMs('30s')
    } else if (typeof prefetch === 'string') {
        ttl = durationToMs(prefetch)
    } else {
        ttl = 0
    }

    const timestamp = Date.now()

    return { ttl, stale, timestamp }
}

function durationToMs(duration): number | any {
    if (typeof duration !== 'string') {
        return duration
    }

    const match = duration.match(/^(\d+)([a-zA-Z]+)$/)

    if (!match) {
        throw new Error(`Invalid duration: ${duration}`)
    }

    const [, value, unit] = match
    const multiplier = {
        ms: 1,
        s: 1000,
        m: 1000 * 60,
        h: 1000 * 60 * 60,
        d: 1000 * 60 * 60 * 24,
        w: 1000 * 60 * 60 * 24 * 7,
    }[unit] || new Error(`Invalid duration unit: ${unit}`)

    if (multiplier instanceof Error) {
        throw multiplier
    }

    return Number(value) * multiplier
}