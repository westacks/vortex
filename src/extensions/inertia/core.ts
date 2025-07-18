import { AxiosError } from "axios";
import { RouterResponse, type InternalRouterRequestConfig } from "../../router";
import { page, type Page, type VortexConfig, axios } from "../..";
import { pushState } from "./state";
import { clear } from "./encryption";

export function resolveRequest(request: InternalRouterRequestConfig): InternalRouterRequestConfig {
    if (!request.vortex) {
        return request
    }

    const pageState = page.get()
    const config = (typeof request.vortex === "object" ? request.vortex : {}) as VortexConfig

    request.headers['accept'] = 'text/html, application/xhtml+xml, application/json'
    request.headers['x-inertia'] = true
    request.headers['x-inertia-version'] = pageState?.version
    request.headers['x-inertia-partial-component'] = pageState?.component

    if (Array.isArray(config.only) && config.only.length > 0) {
        request.headers['x-inertia-partial-data'] = config.only.join(",")
    }

    if (Array.isArray(config.except) && config.except.length > 0) {
        request.headers['x-inertia-partial-except'] = config.except.join(",")
    }

    if (Array.isArray(config.reset) && config.reset.length > 0) {
        request.headers['x-inertia-reset'] = config.reset.join(",")
    }

    return request
}

export function resolveResponse(response: RouterResponse): RouterResponse {
    if (response.config.prefetch || !response.config.vortex || !response.headers['x-inertia']) {
        return response
    }

    const pageState = page.get()
    const config = (typeof response.config.vortex === "object" ? response.config.vortex : {}) as VortexConfig

    if (Array.isArray(config.only) && config.only.length > 0) {
        const replace = {}

        for (const prop of config.only) {
            replace[prop] = response.data.props[prop]
        }

        response.data.props = { ...pageState.props, ...replace }
    }

    if (Array.isArray(config.except) && config.except.length > 0) {
        const replace = {}

        for (const prop of config.except) {
            replace[prop] = pageState.props[prop]
        }

        response.data.props = { ...response.data.props, ...replace }
    }

    response.data = pageMutations(response.data, pageState)

    if (config?.preserveHistory) {
        response.data.url = pageState?.url || response.data.url
    } else {
        pushState(response.data, config?.replaceHistory || (pageState?.url === response.data.url && config?.replaceHistory !== false))
    }

    page.set(response.data)

    if (pageState.clearHistory) {
        clear()
    }

    loadDeferredProps(response.data)

    if (!config?.preserveScroll) {
        window.scrollTo(0, 0)
    }

    return response
}

export function resolveResponseError(error: AxiosError) {
    const config: InternalRouterRequestConfig = error.config as InternalRouterRequestConfig

    if (!config?.vortex) {
        return Promise.reject(error)
    }

    if (error.response?.headers['x-inertia-location']) {
        window.location.href = error.response.headers['x-inertia-location'];
        return Promise.resolve(error.response)
    }

    if (!error.response?.headers['x-inertia']) {
        renderError(error.response as RouterResponse)
    } else {
        return resolveResponse(error.response as RouterResponse)
    }

    return Promise.reject(error)
}

export function loadDeferredProps(page: Page) {
    if (!page.deferredProps) {
        return
    }

    for (const props of Object.values(page.deferredProps)) {
        axios.reload({
            vortex: {
                only: props,
                preserveHistory: true,
                preserveScroll: true,
            }
        })
    }
}

function pageMutations(newPage: Page, oldPage: Page): Page {
    if (newPage.deepMergeProps) {
        for (const prop of newPage.deepMergeProps) {
            newPage.props[prop] = deepMerge(oldPage.props[prop] as any, newPage.props[prop] as any)
        }
    }

    if (newPage.mergeProps) {
        for (const prop of newPage.mergeProps) {
            const incomingProp = newPage.props[prop]

            if (Array.isArray(incomingProp)) {
                newPage.props[prop] = [...((oldPage.props[prop] || []) as any[]), ...incomingProp]
            } else if (typeof incomingProp === 'object' && incomingProp !== null) {
                newPage.props[prop] = {
                    ...((oldPage.props[prop] || []) as Record<string, unknown>),
                    ...incomingProp,
                }
            }
        }
    }

    return newPage
}

function renderError(response: RouterResponse) {
    const dialog = document.createElement('dialog')
    Object.assign(dialog.style, {
        position: 'fixed',
        inset: '0',
        maxWidth: 'none',
        maxHeight: 'none',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        backdropFilter: 'blur(3px)',
        outline: 'none',
    })

    dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            dialog.close()
        }
    });

    const form = document.createElement('form')
    form.method = 'dialog'
    Object.assign(form.style, {
        position: 'absolute',
        inset: '0',
        zIndex: '-1',
        margin: '0',
        padding: '0',
        border: 'none',
    })

    const button = document.createElement('button')
    button.type = 'submit'
    button.innerText = 'close'
    Object.assign(button.style, {
        width: '100%',
        height: '100%',
        opacity: '0',
        cursor: 'pointer',
    })

    const iframe = document.createElement('iframe')
    iframe.src = URL.createObjectURL(
        new Blob([response.data], { type: response.headers['content-type'] })
    )
    Object.assign(iframe.style, {
        width: '90vw',
        height: '90vh',
    })

    form.appendChild(button)
    dialog.appendChild(iframe)
    dialog.appendChild(form)

    dialog.onclose = () => {
        URL.revokeObjectURL(iframe.src)
        document.body.removeChild(dialog)
        document.body.style.overflow = ''
    }

    document.body.appendChild(dialog)
    document.body.style.overflow = 'hidden'

    dialog.showModal()
    dialog.focus()
}

const deepMerge = (target: Array<unknown>|object, source: Array<unknown>|object) => {
    if (Array.isArray(source)) {
        // Merge arrays by concatenating the existing and incoming elements
        return [...(Array.isArray(target) ? target : []), ...source]
    }

    if (typeof source === 'object' && source !== null) {
        // Merge objects by iterating over keys
        return Object.keys(source).reduce(
            (acc, key) => {
                acc[key] = deepMerge(target ? target[key] : undefined, source[key])
                return acc
            },
            { ...target },
        )
    }

    // If the source is neither an array nor an object, return it directly
    return source
}