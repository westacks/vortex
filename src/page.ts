import { isEqual } from "./helpers";
import { signal } from "./signals";

/**
 * Page instance
 */
export interface Page {
    [key: string]: unknown
}

export const { get: getPage, set: setPage, subscribe } = signal<Page>(undefined, isEqual)

