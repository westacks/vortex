import { isEqual } from "./helpers";
import { signal } from "./signals";

/**
 * Page instance
 */
export interface Page {
    [key: string]: unknown
}

export const page = signal<Page>(undefined, isEqual)
