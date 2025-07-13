import { getPage, subscribe, useForm as useVortexForm, useRemember as useVortexRemember, Page, link as vortexLink, visible as vortexVisible } from '../index';
import { type Signal } from "../signals";
import { type Action } from '../dom';
import { createEffect, createSignal, onCleanup } from "solid-js";
import { createMutable, modifyMutable, reconcile } from "solid-js/store";

type ExtractAccessorReturn<F> = F extends (
  node: any,
  accessor: () => infer R
) => any ? R : never;

export const [usePage] = convertSignal({ get: getPage, subscribe } as Signal<Page>)

export const link = convertActionToDirective(vortexLink)

export const visible = convertActionToDirective(vortexVisible)

declare module "solid-js" {
    namespace JSX {
        interface Directives {
            link?: ExtractAccessorReturn<typeof link>
            visible?: ExtractAccessorReturn<typeof visible>
        }
    }
}

export function useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
    return convertSignalToMutable(useVortexForm(data, rememberKey))
}

export function useRemember<T extends object>(data: T, key: string = 'default') {
    return convertSignalToMutable(useVortexRemember(data, key))
}

function convertSignal<T>({ get, subscribe }: Signal<T>) {
    const signal = createSignal(get())
    subscribe(signal[1])
    return signal
}

function convertSignalToMutable<T extends object>({ get, subscribe }: Signal<T>) {
    const mutable = createMutable(get())
    subscribe((data) => modifyMutable(mutable, reconcile(data)))
    return mutable
}

function convertActionToDirective<E extends HTMLElement,T>(action: Action<E, T>) {
    return (node: E, accessor: () => T) => {
        const current = action(node, accessor())

        if (current?.destroy) {
            onCleanup(current.destroy)
        }

        if (current?.update) {
            createEffect(() => {
                current?.update?.(accessor())
            })
        } else {
            createEffect(() => {
                accessor()
            })
        }
    }
}