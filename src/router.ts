import type { AxiosRequestConfig, AxiosResponse, AxiosInstance, AxiosInterceptorManager, AxiosRequestHeaders, HeadersDefaults, AxiosHeaderValue } from "axios";
import { getPage as page, setPage } from "./page";
import http from "axios";

export interface Router extends AxiosInstance {
    constructor(config?: RouterRequestConfig);
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
    reload<T = any, R = AxiosResponse<T>, D = any>(config: RouterRequestConfig<D>): Promise<R>

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

type VortexConfig = {
    preserve?: boolean
}

interface RouterRequestConfig<D = any> extends AxiosRequestConfig<D> {
    vortex: VortexConfig | Record<string, unknown> | boolean
    [key: string]: unknown
}

interface InternalRouterRequestConfig<D = any> extends RouterRequestConfig<D> {
    headers: AxiosRequestHeaders;
}

interface RouterResponse<T = any, D = any> extends AxiosResponse<T, D> {
    config: InternalRouterRequestConfig<D>
}

export type VortexExtension = (interceptors: {
    request: AxiosInterceptorManager<InternalRouterRequestConfig<any>>,
    response: AxiosInterceptorManager<RouterResponse<any, any>>,
}) => { request?: number, response?: number } | void

export let axios: Router

const popstate = (event) => {
    if (!event.state) return
    setPage(event.state)
}

/**
 * Register Vortex extensions
 *
 * @param extensions Vortex extensions
 * @returns Uninstall function
 */
export function extend(...extensions: VortexExtension[]): () => void {
    if (!axios) throw new Error("Router not initialized!");

    const uninstall = extensions.reduce((acc, x) => {
        const extension = x(axios.interceptors)
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
        return this({ url: page()?.url, ...config })
    }

    window.history.replaceState(page(), "", window.location.href)

    window.addEventListener("popstate", popstate)

    axios.defaults.vortex = true

    extend(({ request, response }) => ({
        request: request.use(function (request) {
            if (!request.vortex) {
                return request
            }

            request.headers["x-vortex"] = true
            request.headers["x-vortex-version"] = page()?.version
            request.headers["x-vortex-component"] = page()?.component

            return request
        }),
        response: response.use(function (response) {
            if (!response.config.vortex || !response.headers["x-vortex"]) {
                return response
            }

            const config = typeof response.config.vortex === "object" ? response.config.vortex : {}

            setPage(response.data)

            if (config?.preserve || (window.history.state.url === response.data.url && config?.preserve !== false)) {
                window.history.replaceState(response.data, "", response.data.url)
            } else {
                window.history.pushState(response.data, "", response.data.url)
            }

            return response
        }, function (error) {
            if (error.response?.headers["x-vortex-location"]) {
                window.location.href = error.response.headers["x-vortex-location"];
                return Promise.resolve(error.response)
            }

            if (error.response?.headers["x-vortex"]) {
                return Promise.resolve(error.response)
            }

            return Promise.reject(error)
        })
    }))
}

export function destroyRouter() {
    window.removeEventListener("popstate", popstate)

    axios = undefined as any
}
