import { getPage, Page, subscribe, useForm as useVortexForm, useRemember as useVortexRemember } from '../index'
import { reactive, onBeforeUnmount, Reactive, Directive, Plugin  } from 'vue'
import { Signal } from '../signals'
import { link as vortexLink, visible as vortexVisible, Action } from '../dom'

const link = convertActionToDirective(vortexLink)
const visible = convertActionToDirective(vortexVisible)

export const vortex: Plugin = {
    install: (app) => app.directive('link', link).directive('visible', visible)
}

export function usePage() {
    return convertSignalToReactive({ get: getPage, subscribe } as Signal<Page>)
}

export function useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
    return convertSignalToReactive(useVortexForm(data, rememberKey))
}

export function useRemember<T extends object>(data: T, key: string = 'default') {
    return convertSignalToReactive(useVortexRemember(data, key))
}

function convertSignalToReactive<T extends object>({ get, subscribe }: Signal<T>): Reactive<T> {
    const state = reactive(get())

    const unsubscribe = subscribe((data) => {
        for (const key in state) {
            if (!(key in data)) delete state[key]
        }
        for (const key in data) {
            (state as any)[key] = data[key]
        }
    })

    onBeforeUnmount(unsubscribe)

    return state
}

function convertActionToDirective<E extends HTMLElement,T>(action: Action<E,T>): Directive<E,T> {
    const id =  Symbol("vortex-directive-" + Math.random().toString(36).substring(2, 12))

    return {
        mounted(el, binding) {
            const dir = action(el, binding.value)

            if (dir) {
                el[id] = dir
            }
        },
        updated(el, binding) {
            const dir = el[id]

            if (dir && typeof dir.update === 'function') {
                dir.update(binding.value)
            }
        },
        unmounted(el) {
            const dir = el[id]

            if (dir && typeof dir.destroy === 'function') {
                dir.destroy()
            }

            delete el[id]
        }
    }
}