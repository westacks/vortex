import { getPage, subscribe, useForm as useVortexForm, useRemember as useVortexRemember } from '../index'
import { readable, type Writable } from 'svelte/store'
import { type Signal } from '../signals'
export { link, visible } from '../index'

export const page = readable(getPage(), subscribe)

export function useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
    return convertSignalToWritable(useVortexForm(data, rememberKey))
}

export function useRemember<T extends object>(data: T, key: string = 'default') {
    return convertSignalToWritable(useVortexRemember(data, key))
}

function convertSignalToWritable<T>(
    { get, subscribe }: Signal<T>
): Writable<T> {
    const store = readable(get(), subscribe) as Writable<T>
    store.set = () => {}

    return store
}
