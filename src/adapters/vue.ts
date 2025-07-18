import { page, useForm as useVortexForm, useRemember as useVortexRemember, link as vortexLink, visible as vortexVisible } from '../index'
import { reactive, onBeforeUnmount, Reactive, Directive, Plugin  } from 'vue'
import { type Signal } from '../signals'
import { type Action } from '../dom'

const link = convertActionToDirective(vortexLink)
const visible = convertActionToDirective(vortexVisible)

declare module '@vue/runtime-core' {
    export interface GlobalDirectives {
        link: typeof link
        visible: typeof visible
    }
}

export const vortex: Plugin = {
    install: (app) => app.directive('link', link).directive('visible', visible)
}

export const usePage = () => convertSignalToReactive(page)

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