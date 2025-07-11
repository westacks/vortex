import { type VortexExtension, type Page, useForm } from "../..";
import { clear } from "./encryption";
import { pushState, popState } from "./state";
import { loadDeferredProps, resolveRequest, resolveResponse, resolveResponseError } from "./core";

declare module '../..' {
    interface VortexConfig {
        only?: string[]
        except?: string[]
        reset?: string[]
        preserveHistory?: boolean
        preserveScroll?: boolean
        replaceHistory?: boolean
    }

    interface Page {
        component: string
        props: Record<string, unknown>
        url: string
        version: string|null
        clearHistory: boolean
        encryptHistory: boolean
        deferredProps?: Record<string, string[]>
        mergeProps?: string[]
        deepMergeProps?: string[]
    }
}

/**
 * Vortex Inertia extension
 *
 * @see https://inertiajs.com
 */
const inertia = (initialPage: Page): VortexExtension => ({ request, response }) => {
    pushState(initialPage, true)
    window.addEventListener("popstate", popState)
    useForm.resolveErrors = (response) =>  response?.data?.props?.errors ?? {}

    const req = request.use(resolveRequest)
    const res = response.use(resolveResponse, resolveResponseError)

    loadDeferredProps(initialPage)

    return () => {
        request.eject(req)
        response.eject(res)
        useForm.resolveErrors = (_response) => ({})
        window.removeEventListener("popstate", popState)
    }
}

inertia.clearHistory = clear

export default inertia