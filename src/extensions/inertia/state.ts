import { axios, page, type Page } from "../../index";
import { encrypt, decrypt } from "./encryption";
import { cache } from "../../remember";

const resolveState = (state: ArrayBuffer | any) => state instanceof ArrayBuffer
    ? decrypt(state)
    : Promise.resolve(state)

const makeState = (page: Page, remember: Record<string, unknown> = {}) => page.encryptHistory
    ? encrypt({page, remember})
    : Promise.resolve({page, remember})

export async function pushState(data: Page, replace: boolean = false) {
    const pageState = replace ? data : page.get()

    if (cache.size > 0) {
        const remember = Object.fromEntries(cache)
        history.replaceState(await makeState(pageState, remember), "", window.location.href)

        if (replace) {
            return
        }
    }

    const method = replace ? "replaceState" : "pushState"

    cache.clear()
    window.history[method](await makeState(data), "", data.url)
}

export async function popState(event: PopStateEvent) {
    if (!event.state) {
        return
    }

    let state: { page: Page, remember: Record<string, unknown> }

    try {
        state = await resolveState(event.state)
    } catch (error) {
        console.warn('Failed to resolve state', { cause: error })

        return axios.get(window.location.href, {
            vortex: {
                preserveScroll: true,
                replaceHistory: true,
            }
        })
    }

    Object.entries(state.remember).forEach(([key, value]) => cache.set(key, value))
    page.set(state.page)
}