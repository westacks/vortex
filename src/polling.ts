import type { RouterRequestConfig } from "./router";
import { subscribe, getPage } from "./page";
import { axios } from "./router";

type PollOptions = {
    keepAlive?: boolean
    autoStart?: boolean
}

export default function usePoll(
    interval: number,
    requestOptions: RouterRequestConfig = {},
    options: PollOptions = {
        keepAlive: false,
        autoStart: true
    }
) {
    if (typeof window === "undefined") {
        return { start: () => {}, stop: () => {} }
    }

    const currentComponent = getPage()?.component
    let poll: NodeJS.Timeout
    let unsubscribe: () => void
    let hidden = document.hidden
    let count = 0

    function updateVisibility() {
        if (hidden = document.hidden) {
            count = 0
        }
    }

    function start() {
        poll = setInterval(() => {
            // Throttle polling by 90% when document is hidden
            if (hidden && !options.keepAlive && ++count < 10) {
                return
            }

            axios.reload(requestOptions)
        }, interval)

        unsubscribe = subscribe((page) => {
            if (page.component !== currentComponent) {
                stop()
            }
        })

        document.addEventListener('visibilitychange', updateVisibility)
    }

    function stop() {
        poll && clearInterval(poll)
        unsubscribe && unsubscribe()
        document.removeEventListener('visibilitychange', updateVisibility)
    }

    if (options.autoStart) {
        start()
    }

    return { start, stop }
}