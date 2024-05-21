import { signal, effect } from "./signals";

/**
 * Page instance
 */
export type Page = {
    component: string
    props: Record<string, unknown>
    url: string
    version: string|null
}

/**
 * @see https://lodash.com/docs#isEqual
 */
function isEqual<T>(x: T, y: T) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
        ok(x).length === ok(y).length &&
        ok(x).every(key => isEqual(x[key], y[key]))
    ) : (x === y);
}

const page = signal<Page>(undefined, isEqual)

/**
 * Get current page
 *
 * @returns Current page
 */
export const getPage = page[0]

/**
 * Set current page
 *
 * @param page Page instance
 */
export const setPage = page[1]

/**
 * Subscribe to page changes
 * @param fn Callback function will be executed each time the page changes
 * @returns Destructor function that disposes the effect
 */
export const subscribe = (fn: (page: Page) => void) => effect(() => fn(getPage()))
