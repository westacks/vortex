import { getPage as page, setPage } from "../page";
import type { VortexExtension, VortexConfig } from "../index";

type CoreConfig = {
    detect?: string
    version?: string
    component?: string
    location?: string
    only?: string
}

const core = ({
    detect = 'x-vortex',
    version = 'x-vortex-version',
    component = 'x-vortex-component',
    location = 'x-vortex-location',
    only = 'x-vortex-only',
}: CoreConfig): VortexExtension => ({ request, response }) => ({
    request: request.use(function (request) {
        if (!request.vortex) {
            return request
        }

        const config = (typeof request.vortex === "object" ? request.vortex : {}) as VortexConfig

        request.headers[detect] = true
        request.headers[version] = page()?.version
        request.headers[component] = page()?.component

        if (config.only) {
            request.headers[only] = config.only.join(",")
        }

        return request
    }),
    response: response.use(function (response) {
        if (!response.config.vortex || !response.headers[detect]) {
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
        if (error.response?.headers[location]) {
            window.location.href = error.response.headers[location];
            return Promise.resolve(error.response)
        }

        return Promise.reject(error)
    })
})

export default core