import { isEqual, proxyWrap, proxyUnwrap } from "./helpers";
import { Signal, signal, type SignalSetter } from "./signals";

export const cache: Map<string, any> = new Map

export function useRemember<T extends object>(data: T, key: string = 'default'): Signal<T> {
    data = key ? (cache.get(key) || data) : data

    const { get, set, subscribe } = signal<T>(undefined, isEqual)

    subscribe((remember) => cache.set(key, proxyUnwrap(remember)))
    set(createProxy(data, set) as T);

    return { get, set, subscribe }
}

function createProxy<T extends object>(data: T, set: SignalSetter<T>) {
    const handler : ProxyHandler<T> = {
        set(target, key, value, receiver) {
            const changed = target[key] !== value
            const result = Reflect.set(target, key, value, receiver);

            if (result) {
                set(proxy as T, changed);
            }

            return result
        }
    }

    const proxy: T = new Proxy(proxyWrap(data, handler), handler)

    return proxy
}
