import { axios, getPage, setPage, type VortexExtension, type VortexConfig, type Page } from "../index";
import type { AxiosError, AxiosResponse } from "axios";
import { RouterRequestConfig } from "../router";

declare module '../index' {
    interface VortexConfig {
        only?: string[]
        except?: string[]
        reset?: string[]
        preserveHistory?: boolean
        preserveScroll?: boolean
        replaceHistory?: boolean
    }
}

/**
 * Vortex Inertia extension
 *
 * @see https://inertiajs.com
 */
const inertia = (initialPage: Page): VortexExtension => {

    const afterInstall = (e: Event) => {
        if ((e as CustomEvent<string>).detail === "inertia") {
            loadDeferredProps(initialPage)

            window.removeEventListener("vortex:extension-installed", afterInstall)
        }
    }

    if (typeof window !== "undefined") {
        window.addEventListener("vortex:extension-installed", afterInstall)
    }

    return ({ request, response }) => ({
        name: "inertia",
        request: request.use(function (request) {
            if (!request.vortex) {
                return request
            }

            const page = getPage()
            const config = (typeof request.vortex === "object" ? request.vortex : {}) as VortexConfig

            request.headers['accept'] = 'text/html, application/xhtml+xml, application/json'
            request.headers['x-inertia'] = true
            request.headers['x-inertia-version'] = page?.version
            request.headers['x-inertia-partial-component'] = page?.component

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
        }),
        response: response.use(resolveResponse, function (error: AxiosError) {
            if (!(error.response?.config as RouterRequestConfig).vortex || !error.response?.headers['x-inertia']) {
                return response
            }

            if (error.response?.headers['x-inertia-location']) {
                window.location.href = error.response.headers['x-inertia-location'];
                return Promise.resolve(error.response)
            }

            if (!error.response?.headers['x-inertia']) {
                renderError(error.response as AxiosResponse)
            } else {
                resolveResponse(error.response as AxiosResponse)
            }

            return Promise.reject(error)
        })
    })
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

function loadDeferredProps(page: Page) {
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

function resolveResponse(response) {
    if (!response.config.vortex || !response.headers['x-inertia']) {
        return response
    }

    const page = getPage()
    const config = (typeof response.config.vortex === "object" ? response.config.vortex : {}) as VortexConfig

    if (Array.isArray(config.only) && config.only.length > 0) {
        const replace = {}

        for (const prop of config.only) {
            replace[prop] = response.data.props[prop]
        }

        response.data.props = { ...page.props, ...replace }
    }

    if (Array.isArray(config.except) && config.except.length > 0) {
        const replace = {}

        for (const prop of config.except) {
            replace[prop] = page.props[prop]
        }

        response.data.props = { ...response.data.props, ...replace }
    }

    response.data = pageMutations(response.data, page)

    if (config?.preserveHistory) {
        response.data.url = page?.url || response.data.url
    } else if (config?.replaceHistory || (window.history.state.url === response.data.url && config?.replaceHistory !== false)) {
        window.history.replaceState({ page: response.data }, "", response.data.url)
    } else {
        window.history.pushState({ page: response.data }, "", response.data.url)
    }

    setPage(response.data)

    loadDeferredProps(response.data)

    if (!config?.preserveScroll) {
        window.scrollTo(0, 0)
    }

    return response
}

function renderError(response: AxiosResponse) {
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

export default inertia