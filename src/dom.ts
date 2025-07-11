import { axios, type RouterRequestConfig, type VortexConfig } from "./router"

export function link(node: HTMLElement, options: RouterRequestConfig = {}) {
    function mergeOptions(options) {
        options.method = options.method || 'get'
        options.url = options.url || (node as HTMLAnchorElement).href || ''
        options.data = options.data || {}

        if (node instanceof HTMLAnchorElement) {
            node.href = options.url
        }

        return options
    }

    function navigate(event) {
        event.preventDefault()
        axios.request(options)
    }

    options = mergeOptions(options)

    node.addEventListener('click', navigate)

    return {
        update(newOptions) {
            options = mergeOptions(newOptions)
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

export function visible(node: HTMLElement, rawOptions: VisibleConfig | VortexConfig) {
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
        update(newOptions: VisibleConfig | VortexConfig) {
            options = mergeOptions(newOptions)
        },
        destroy() {
            observer.disconnect()
        }
    }
}
