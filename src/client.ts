
import { setPage, type Page } from "./page";
import { createRouter, destroyRouter } from "./router";

type VortexDestructor<T> = (callback?: (app: Awaited<T>) => void) => void;

/**
 * Initialize Vortex client.
 * Prepares root element, detects SSR, subscribes to `window`'s events and initializes `axios` instance
 *
 * @param setup Setup callback
 * @param element Root element. Defaults to `#app`
 * @returns Destructor function
 */
export async function createVortex<T>(setup: (el: HTMLElement, page: Page, hydrate: boolean) => T, element: string|HTMLElement = "#app"): Promise<VortexDestructor<T>> {
    if (typeof element === 'string') {
        element = document.querySelector(element) as HTMLElement;
    }

    if (!element) throw new Error('Root element not found!');

    const page: Page = JSON.parse(element.dataset?.page ?? 'null');

    if (!page) throw new Error('Initial page data not defined!');

    setPage(page);
    createRouter();

    const app = await setup(element, page, !!element.dataset?.ssr);

    return (callback) => {
        callback instanceof Function && callback(app);
        destroyRouter();
    }
}
