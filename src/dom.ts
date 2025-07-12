import { axios, type RouterRequestConfig, type VortexConfig } from "./router"

export type Action<E extends HTMLElement, T> = (
    node: E,
    parameters: T
) => {
    update?: (parameters: T) => void
    destroy?: () => void
}

type PrefetchMethod = 'click' | 'mount' | 'hover'
type PrefetchLinkConfig = {
    prefetch?: boolean | PrefetchMethod | PrefetchMethod[]
    cacheFor?: number | string | (number | string)[]
}

export const link: Action<HTMLElement, RouterRequestConfig & PrefetchLinkConfig> = (node, options = {})  => {
    function mergeOptions(options: RouterRequestConfig & PrefetchLinkConfig): { options: RouterRequestConfig } & PrefetchLinkConfig {
        options.method = options.method || 'get'
        options.url = options.url || (node as HTMLAnchorElement).href || ''
        options.data = options.data || {}

        if (node instanceof HTMLAnchorElement) {
            node.href = options.url
        }

        let prefetch, cacheFor

        if (options.prefetch) {
            if (Array.isArray(options.prefetch)) {
                prefetch = options.prefetch
            } else if (options.prefetch === true) {
                prefetch = ['hover']
            } else {
                prefetch = [options.prefetch]
            }

            cacheFor = options.cacheFor || "30s"
        }

        delete options.cacheFor
        delete options.prefetch

        return { options, prefetch, cacheFor }
    }

    function navigate(event) {
        event.preventDefault()
        axios.request(options)
    }

    const prefetch = () => axios.request({ ...options, prefetch: config.cacheFor })

    function hover() {
        let loading = false

        setTimeout(() => {
            if (!loading && node.matches(':hover')) {
                loading = true
                prefetch().finally(() => loading = false)
            }
        }, 75)
    }

    function reinstallPrefetchEvents() {
        node.removeEventListener('mouseover', hover)
        node.removeEventListener('mousedown', prefetch)

        const methods = (config.prefetch || []) as PrefetchMethod[]

        if (methods.includes('hover')) {
            node.addEventListener('mouseover', hover)
        }

        if (methods.includes('click')) {
            node.addEventListener('mousedown', prefetch)
        }

        if (methods.includes('mount')) {
            prefetch()
        }
    }

    let config = mergeOptions(options)
    reinstallPrefetchEvents()

    node.addEventListener('click', navigate)

    return {
        update(newOptions) {
            config = mergeOptions(newOptions)
            reinstallPrefetchEvents()
        },
        destroy() {
            node.removeEventListener('click', navigate)
        }
    }
}

type VisibleConfig = {
    vortex: VortexConfig,
    buffer?: number,
    always?: boolean,
}

export const visible: Action<HTMLElement, VisibleConfig | VortexConfig> = (node, rawOptions) => {
    function mergeOptions(options: VisibleConfig | VortexConfig): VisibleConfig {
        return !options.vortex
            ? { buffer: 0, always: false, vortex: options  }
            : { buffer: 0, always: false, ...options as VisibleConfig }
    }

    let options: VisibleConfig = mergeOptions(rawOptions)

    const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) {
            return
        }

        if (!options.always) {
            observer.disconnect()
        }

        if (node.dataset.fetching) {
            return
        }

        node.dataset.fetching = ''

        axios.reload({ vortex: options.vortex })
            .then(() => node.dataset.loaded = '')
            .finally(() => delete node.dataset.fetching)
    }, {
        rootMargin: `${options.buffer}px`,
    })

    observer.observe(node)

    return {
        update(newOptions) {
            options = mergeOptions(newOptions)
        },
        destroy() {
            observer.disconnect()
        }
    }
}
