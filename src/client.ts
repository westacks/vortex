
import { setPage, type Page } from "./page";
import { createRouter, destroyRouter } from "./router";

type VortexDestructor = void | (() => void) | Promise<void | (() => void)>;

/**
 * Initialize Vortex client.
 * Prepares root element, detects SSR, subscribes to `window`'s events and initializes `axios` instance
 *
 * @param setup Setup callback
 * @param element Root element. Defaults to `#app`
 * @returns Destructor function
 */
export async function createVortex(setup: (el: HTMLElement, page: Page, hydrate: boolean) => VortexDestructor, element: string|HTMLElement = "#app") {
    if (typeof element === 'string') {
        element = document.querySelector(element) as HTMLElement;
    }

    if (!element) throw new Error('Root element not found!');

    const page: Page = JSON.parse(element.dataset?.page ?? 'null');

    if (!page) throw new Error('Initial page data not defined!');

    setPage(page);

    createRouter();

    const dispose = await setup(element, page, !!element.dataset?.ssr);

    return () => {
        if (dispose instanceof Function) {
            dispose();
        }
        destroyRouter();
    }
}
