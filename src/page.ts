import { isEqual } from "./helpers";
import { signal, effect } from "./signals";

/**
 * Page instance
 */
export type Page = {
    component: string
    props: Record<string, unknown>
    url: string
    version: string|null
    clearHistory: boolean
    encryptHistory: boolean
    deferredProps?: Record<string, string[]>
    mergeProps?: string[]
    deepMergeProps?: string[]
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
