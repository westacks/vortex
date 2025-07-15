import { getPage, subscribe, useForm as useVortexForm, useRemember as useVortexRemember, link, visible, Page } from '../index';
import { Signal } from "../signals"
import { Action } from '../dom';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'

export const usePage = () => convertSignalToState({ get: getPage, subscribe } as Signal<Page>)

export const useLink = convertActionToDirective(link)

export const useVisible = convertActionToDirective(visible)

export function useForm<T extends object>(data: T | (() => T), rememberKey?: string) {
    return convertSignalToState(useVortexForm(data, rememberKey))
}

export function useRemember<T extends object>(data: T, key: string = 'default') {
    return convertSignalToState(useVortexRemember(data, key))
}

function convertSignalToState<T>({ get, subscribe }: Signal<T>) {
    const ref = useRef<T>();
    const [,forceUpdate] = useState({});

    if (ref.current === undefined) {
        ref.current = get();
    }

    useEffect(() => subscribe((_v) => forceUpdate({})), []);

    return ref.current
}

function convertActionToDirective<E extends HTMLElement, T>(action: Action<E, T>) {
    return (params: T | boolean = true) => {
        const paramsRef = useRef(params)
        paramsRef.current = params

        const destroyRef = useRef<() => void | undefined>()
        const updateRef = useRef<((params: T) => void) | undefined>()
        const nodeRef = useRef<E | null>(null);

        const refCallback = useCallback((node: E | null) => {
            if (node === null) {
                destroyRef.current?.()
                destroyRef.current = undefined
                updateRef.current = undefined
                nodeRef.current = null
                return
            }

            nodeRef.current = node
            const result = action(node, paramsRef.current as T)
            destroyRef.current = result?.destroy
            updateRef.current = result?.update
        }, [])

        useEffect(() => {
            updateRef.current?.(paramsRef.current as T)
        }, [params])

        useEffect(() => () => destroyRef.current?.(), [])

        return refCallback
    }
}
