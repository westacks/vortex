import { BProgress, BProgressOptions } from '@bprogress/core';
import type { VortexExtension } from "../index";
import '@bprogress/core/css';

declare module '../index' {
  interface VortexConfig {
    progress?: boolean;
  }
}

/**
 * Vortex BProgress extension
 */
const bprogress = (config: Partial<BProgressOptions> = {}): VortexExtension => ({ request, response }) => {
    BProgress.configure(config)

    const req = request.use(
        function (request) {
            if (typeof request.vortex === 'object' && request.vortex.progress === false) {
                return request
            }
            BProgress.start()
            return request
        },
        function (error) {
            BProgress.done()
            return Promise.reject(error)
        }
    )

    const res = response.use(
        function (response) {
            BProgress.done()
            return response
        },
        function (error) {
            BProgress.done()
            return Promise.reject(error)
        }
    )

    return () => {
        request.eject(req)
        response.eject(res)
    }
}

export default bprogress