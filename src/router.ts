import type { AxiosRequestConfig, AxiosResponse, AxiosInstance, AxiosInterceptorManager, HeadersDefaults, AxiosHeaderValue, InternalAxiosRequestConfig } from "axios";
import { getPage, setPage } from "./page";
import http from "axios";

export interface Router extends AxiosInstance {
    new(config?: RouterRequestConfig);
    interceptors: {
        request: AxiosInterceptorManager<InternalRouterRequestConfig>;
        response: AxiosInterceptorManager<RouterResponse>;
    };
    getUri(config?: RouterRequestConfig): string;
    request<T = any, R = RouterResponse<T>, D = any>(config: RouterRequestConfig<D>): Promise<R>;
    get<T = any, R = RouterResponse<T>, D = any>(url: string, config?: RouterRequestConfig<D>): Promise<R>;
    delete<T = any, R = RouterResponse<T>, D = any>(url: string, config?: RouterRequestConfig<D>): Promise<R>;
    head<T = any, R = RouterResponse<T>, D = any>(url: string, config?: RouterRequestConfig<D>): Promise<R>;
    options<T = any, R = RouterResponse<T>, D = any>(url: string, config?: RouterRequestConfig<D>): Promise<R>;
    post<T = any, R = RouterResponse<T>, D = any>(url: string, data?: D, config?: RouterRequestConfig<D>): Promise<R>;
    put<T = any, R = RouterResponse<T>, D = any>(url: string, data?: D, config?: RouterRequestConfig<D>): Promise<R>;
    patch<T = any, R = RouterResponse<T>, D = any>(url: string, data?: D, config?: RouterRequestConfig<D>): Promise<R>;
    postForm<T = any, R = RouterResponse<T>, D = any>(url: string, data?: D, config?: RouterRequestConfig<D>): Promise<R>;
    putForm<T = any, R = RouterResponse<T>, D = any>(url: string, data?: D, config?: RouterRequestConfig<D>): Promise<R>;
    patchForm<T = any, R = RouterResponse<T>, D = any>(url: string, data?: D, config?: RouterRequestConfig<D>): Promise<R>;
    reload<T = any, R = AxiosResponse<T>, D = any>(config?: RouterRequestConfig<D>): Promise<R>

    <T = any, R = RouterResponse<T>, D = any>(config: RouterRequestConfig<D>): Promise<R>;
    <T = any, R = RouterResponse<T>, D = any>(url: string, config?: RouterRequestConfig<D>): Promise<R>;

    defaults: Omit<RouterDefaults, 'headers'> & {
        headers: HeadersDefaults & {
            [key: string]: AxiosHeaderValue
        }
    };
}

interface RouterDefaults<D = any> extends Omit<RouterRequestConfig<D>, 'headers'> {
    headers: HeadersDefaults;
}

export interface VortexConfig {
    [key: string]: unknown
}

export interface RouterRequestConfig<D = any> extends AxiosRequestConfig<D> {
    vortex?: VortexConfig | boolean;
    [key: string]: unknown;
}

export interface InternalRouterRequestConfig<D = any> extends InternalAxiosRequestConfig<D> {
    vortex?: VortexConfig | boolean;
}

export interface RouterResponse<T = any, D = any> extends AxiosResponse<T, D> {
    config: InternalRouterRequestConfig<D>
}

export type VortexExtension = (interceptors: {
    request: AxiosInterceptorManager<InternalRouterRequestConfig<any>>,
    response: AxiosInterceptorManager<RouterResponse<any, any>>,
}) => { request?: number, response?: number, name?: string } | void

export let axios: Router

const popstate = (event) => {
    if (!event.state) return
    setPage(event.state.page)
}

/**
 * Register Vortex extensions
 *
 * @param extensions Vortex extensions
 * @returns Uninstall function
 */
export function install(...extensions: VortexExtension[]): () => void {
    if (!axios) throw new Error("Router not initialized!");

    const uninstall = extensions.reduce((acc, x) => {
        const extension = x(axios.interceptors)

        if (extension?.name && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(`vortex:extension-installed`, { detail: extension.name }))
        }

        acc.request = [...acc.request, ...(extension?.request ? [extension.request] : [])]
        acc.response = [...acc.response, ...(extension?.response ? [extension.response] : [])]
        return acc
    }, { request: [] as number[], response: [] as number[] })

    return () => {
        uninstall.request.forEach(x => axios?.interceptors.request.eject(x))
        uninstall.response.forEach(x => axios?.interceptors.response.eject(x))
    }
}

export function createRouter() {
    axios = http.create() as Router

    axios.reload = function (config) {
        return this({ url: getPage()?.url, ...config })
    }

    window.history.replaceState({ page: getPage() }, "", getPage()?.url)

    window.addEventListener("popstate", popstate)

    axios.defaults.withCredentials = true
    axios.defaults.vortex = true
}

export function destroyRouter() {
    window.removeEventListener("popstate", popstate)

    axios = undefined as any
}

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
        axios(options)
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