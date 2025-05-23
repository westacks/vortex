import { getPage, subscribe, useForm as useVortexForm } from '../../index'
import { readable } from 'svelte/store'
export { link } from '../../index'

export const page = readable(getPage(), subscribe)

export function useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
    const { get, subscribe } = useVortexForm(data, rememberKey)

    const store = readable(get(), subscribe)
    // @ts-expect-error Prevent svelte's writable calls
    store.set = () => {}

    return store
}
