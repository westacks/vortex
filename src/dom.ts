import { axios, RouterResponse, type RouterRequestConfig, type VortexConfig } from "./router"
import { useForm, VortexForm } from "./form"
import { formDataToObject, isEqual } from "./helpers"
import { Signal, signal } from "./signals"

export type Action<E extends HTMLElement, T, R = {}> = (
    node: E,
    parameters?: T
) => {
    update?: (parameters: T) => void
    destroy?: () => void
} & R

type PrefetchMethod = 'click' | 'mount' | 'hover'
type PrefetchLinkConfig = {
    prefetch?: boolean | PrefetchMethod | PrefetchMethod[]
    cacheFor?: number | string | (number | string)[]
}

export const link: Action<HTMLElement, RouterRequestConfig & PrefetchLinkConfig | boolean> = (node, options = true)  => {
    if (options === true) {
        options = {}
    }

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
        axios.request(options as RouterRequestConfig & PrefetchLinkConfig)
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

    let config = mergeOptions(options as RouterRequestConfig & PrefetchLinkConfig)
    reinstallPrefetchEvents()

    node.addEventListener('click', navigate)

    return {
        update(newOptions) {
            if (newOptions === true) {
                newOptions = {}
            }

            config = mergeOptions(newOptions as RouterRequestConfig & PrefetchLinkConfig)
            reinstallPrefetchEvents()
        },
        destroy() {
            node.removeEventListener('click', navigate)
        }
    }
}

type VisibleConfig = {
    vortex: VortexConfig | boolean,
    buffer?: number,
    always?: boolean,
}

export const visible: Action<HTMLElement, (VisibleConfig & RouterRequestConfig) | VortexConfig | boolean> = (node, rawOptions = true) => {
    function mergeOptions(options: VisibleConfig | VortexConfig | boolean): VisibleConfig {
        return options === true || !(options as VortexConfig).vortex
            ? { buffer: 0, always: true, vortex: options  }
            : { buffer: 0, always: true, ...options as VisibleConfig }
    }

    let options: VisibleConfig & RouterRequestConfig = mergeOptions(rawOptions)

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

        axios.reload(options)
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

interface FormOptions extends RouterRequestConfig {
    before?: (form: VortexForm<any>) => VortexForm<any>
    after?: (result: Promise<RouterResponse<any>>) => any
}

export const form: Action<HTMLFormElement,FormOptions,{ errors: Signal<Record<string, string>> }> = (node, rawOptions = {}) => {
    let options: FormOptions = {
        before: (form) => form,
        after: (result) => result,
        ...rawOptions
    }
    const form = useForm(formDataToObject(new FormData(node)))
    const errors = signal(form.get().errors, isEqual)

    const unsubscribe = form.subscribe((form) => errors.set(form.errors))

    function submit(event: SubmitEvent) {
        event.preventDefault()

        const { before, after } = options

        // @ts-expect-error
        return after(before(form.get()).request({
            method: node.method || 'post',
            url: node.action || (window.location.origin + window.location.pathname),
            ...options
        }))
    }

    node.addEventListener('submit', submit)

    return {
        errors,
        update(newOptions) {
            options = {
                before: (form) => form,
                after: (result) => result,
                ...newOptions
            }
        },
        destroy() {
            node.removeEventListener('submit', submit)
            unsubscribe()
        }
    }
}