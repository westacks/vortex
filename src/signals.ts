export type Signal<T> = [SignalGetter<T>, SignalSetter<T>]
export type SignalGetter<T> = () => T
export type SignalSetter<T> = (value: T | ((value: T) => T), force?: boolean) => void

export type Effect = () => EffectDestructor | Promise<EffectDestructor>
type EffectDestructor = void | (() => void)
type EffectLink = (instance: EffectInstance) => void
type EffectInstance = { notify: () => void, link: (unlink: EffectLink) => void}

let observer: EffectInstance | null = null

/**
 * Create a new signal
 *
 * @param value Initial signal value
 * @param equals Compare function
 * @returns Signal
 */
export function signal<T>(value: T|undefined = undefined, equals: (a: T, b: T) => boolean = (a, b) => a === b): Signal<T> {
    let state: T = value as T;
    let subscribers: Set<EffectInstance> = new Set;

    function unlink(dependency: EffectInstance) {
        subscribers.delete(dependency)
    }

    function get(): T {
        if (observer && !subscribers.has(observer)) {
            subscribers.add(observer)
            observer.link(unlink)
        }

        return state;
    }

    function set(value: T | ((value: T) => T), force: boolean = false) {
        const next = value instanceof Function ? value(state) : value

        if (!force && equals(state, next)) return

        state = next

        for (const subscriber of [...subscribers]) {
            subscriber.notify()
        };
    }

    return [get, set];
}

/**
 * Create an effect. Effect callback will be executed each time the dependant signals changes
 *
 * @param fn Effect callback
 * @returns Destructor function
 */
export function effect(fn: Effect): () => void {
    let cleaner: EffectDestructor
    let subscribers = new Set<EffectLink>
    const instance: EffectInstance = { notify, link }

    function notify() {
        dispose()
        observer = instance
        try { cleaner = fn() as EffectDestructor }
        catch (e) { console.error(e) }
        observer = null
    }

    function link(unlink: EffectLink) {
        subscribers.add(unlink)
    }

    async function dispose() {
        for (const unlink of subscribers) {
            unlink(instance)
        }
        subscribers.clear()
        const flush = await cleaner
        flush instanceof Function && flush()
        cleaner = undefined
    }

    notify()
    return dispose
}
