import { axios } from "./router";
import { RouterRequestConfig } from "./router";

type PollConfig = {
    autoStart?: boolean
    keepAlive?: boolean
}

type Poll = {
    start: () => void
    stop: () => void
}

export function usePoll(interval: number, config: RouterRequestConfig & PollConfig = {}): Poll {
    const { autoStart = true, keepAlive = false } = config
    delete config.autoStart
    delete config.keepAlive

    let id: NodeJS.Timeout
    let inBackground = document.hidden
    let count = 0
    let controller : AbortController

    const onvisibilitychange = () => {
        inBackground = document.hidden
        count = 0
    }

    function start() {
        document.addEventListener('visibilitychange', onvisibilitychange)

        id = setInterval(() => {
            if (keepAlive || !inBackground || count !== 0 && count % 10 === 0) {
                count = 0
                controller = new AbortController()
                return axios.reload({...config, signal: controller.signal})
            }

            count++
        }, interval)
    }

    function stop() {
        clearInterval(id)
        controller?.abort()
        document.removeEventListener('visibilitychange', onvisibilitychange)
    }

    if (autoStart) {
        start()
    }

    return { start, stop }
}