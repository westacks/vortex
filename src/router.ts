import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from "axios";
import http from "axios";
import { getPage as page, setPage } from "./page";

declare module "axios" {
    export interface AxiosRequestConfig {
        vortex?: any
    }
}

export interface Router extends AxiosInstance {
    reload<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>
}

export let axios: Router

const popstate = (event) => {
    if (!event.state) return
    setPage(event.state)
}

export function createRouter() {
    axios = http.create() as Router

    axios.reload = function (config) {
        return this({ url: page()?.url, ...config })
    }

    window.history.replaceState(page(), "", window.location.href)

    window.addEventListener("popstate", popstate)

    axios.defaults.vortex = true

    axios.interceptors.request.use(function (request) {
        if (!request.vortex) {
            return request
        }

        request.headers.Accept = "application/json"
        request.headers["x-vortex"] = true
        request.headers["x-vortex-version"] = page()?.version
        request.headers['x-vortex-errors'] = JSON.stringify(page()?.props?.errors)

        if (request.vortex.only) {
            request.headers["x-vortex-only"] = request.vortex.only.join(",")
            request.headers["x-vortex-component"] = page()?.component
        }

        return request
    })

    axios.interceptors.response.use(function (response) {
        if (!response.headers["x-vortex"]) {
            return response
        }

        setPage(response.data)

        if (response.config.vortex.preserveState
            || (window.history.state.url === response.data.url && response.config.vortex.preserveState !== false)
        ) {
            window.history.replaceState(response.data, "", response.data.url)
        } else {
            window.history.pushState(response.data, "", response.data.url)
        }

        if (!response.config.vortex.preserveScroll) {
            window.scrollTo(0, 0)
        }

        return response
    }, function (error) {
        if (error?.response?.status === 409 && error.response?.headers["x-vortex-location"]) {
            window.location.href = error.response.headers["x-vortex-location"];
            return Promise.resolve(error.response)
        }

        return Promise.reject(error)
    })
}

export function destroyRouter() {
    window.removeEventListener("popstate", popstate)

    axios = undefined as any
}
