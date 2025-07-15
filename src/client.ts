
import { page, type Page } from "./page";
import { Signal } from "./signals";
import { createRouter, destroyRouter, install as installExtension } from "./router";

type VortexDestructor = void | (() => void) | Promise<void | (() => void)>;

/**
 * Initialize Vortex client.
 * Prepares root element, detects SSR, subscribes to `window`'s events and initializes `axios` instance
 *
 * @param setup Setup callback
 * @param element Root element. Defaults to `#app`
 * @returns Destructor function
 */
export async function createVortex(setup: (el: HTMLElement, page: Signal<Page>, install: typeof installExtension, hydrate: boolean) => VortexDestructor, element: string|HTMLElement = "#app") {
    if (typeof element === 'string') {
        element = document.querySelector(element) as HTMLElement;
    }

    if (!element) throw new Error('Root element not found!');

    const initialPage: Page = JSON.parse(element.dataset?.page ?? 'null');

    if (!initialPage) throw new Error('Initial page data not defined!');

    page.set(initialPage);

    createRouter();

    const dispose = await setup(element, page, installExtension, !!element.dataset?.ssr);

    return () => {
        if (dispose instanceof Function) {
            dispose();
        }
        destroyRouter();
    }
}
