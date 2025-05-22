import { signal, effect } from "./signals";
import { axios, RouterRequestConfig } from "./router";
import { isEqual } from "./helpers";

type FormData<T extends object> = T & Form<T>

class Form<TForm extends object> {
    protected _initial: TForm;
    protected _transform: unknown = undefined;
    protected _recentlySuccessfulTimeout: NodeJS.Timeout | null = null;
    protected _handler: ProxyHandler<FormData<TForm>>

    public wasSuccessful: boolean = false;
    public recentlySuccessful: boolean = false;
    public processing: boolean = false;
    public errors: Record<string, string> = {};

    public get hasErrors() {
        return Object.keys(this.errors).length > 0;
    }

    public get isDirty() {
        return !isEqual(this.data(), this._initial);
    }

    constructor (initial: TForm, handler: ProxyHandler<FormData<TForm>>) {
        this._initial = initial
        this._handler = handler

        Object.defineProperty(this, "_initial", { enumerable: false })
        Object.defineProperty(this, "_transform", { enumerable: false })
        Object.defineProperty(this, "_recentlySuccessfulTimeout", { enumerable: false })
        Object.defineProperty(this, "_handler", { enumerable: false, writable: false, configurable: false })

        this.reset()
    }

    data(): TForm {
        const keys = Object.keys(this._initial);

        return keys.reduce((acc, key) => {
            acc[key] = this[key];
            return acc;
        }, {} as TForm);
    }

    transform(fn: (data: TForm) => unknown) {
        this._transform = fn(this.data());

        return this;
    }

    reset() {
        return Object.assign(this, wrap(this._initial, this._handler));
    }

    request<TForm>(options: RouterRequestConfig<TForm>) {
        if (this._recentlySuccessfulTimeout) {
            clearTimeout(this._recentlySuccessfulTimeout);
        }
        this.wasSuccessful = false;
        this.processing = true;

        return axios.request({...options, data: this._transform || this.data()})
            .catch(error => {
                return Promise.reject(error);
            })
            .then(response => {
                this.errors = response?.data?.props?.errors ?? {};
                if (Object.keys(this.errors).length === 0) {
                    this.wasSuccessful = true;
                    this.recentlySuccessful = true;
                    this._recentlySuccessfulTimeout = setTimeout(() => {
                        this.recentlySuccessful = false;
                    }, 2000);
                }

                return response;
            })
            .finally(() => {
                this._transform = undefined;
                this.processing = false;
            })
    }

    get(url: string, options?: RouterRequestConfig) {
        return this.request({ ...options, url, method: 'get' });
    }

    post(url: string, options?: RouterRequestConfig) {
        return this.request({ ...options, url, method: 'post' });
    }

    put(url: string, options?: RouterRequestConfig) {
        return this.request({ ...options, url, method: 'put' });
    }

    patch(url: string, options?: RouterRequestConfig) {
        return this.request({ ...options, url, method: 'patch' });
    }

    delete(url: string, options?: RouterRequestConfig) {
        return this.request({ ...options, url, method: 'delete' });
    }
}

export function useForm<T extends object>(
    data: T | (() => T),
    rememberKey?: string,
) {
    data = typeof data === 'function' ? data() : data

    const [get, set] = signal<FormData<T>>(undefined, isEqual)
    const subscribe = (fn: (form: FormData<T>) => void) => effect(() => fn(get()))

    set(createProxy(data, set) as FormData<T>);

    return { get, set, subscribe }
}

function createProxy<T extends object>(data: T, set: (form: FormData<T>, changed?: boolean) => void) {
    const handler : ProxyHandler<FormData<T>> = {
        set(target, key: string, value, receiver) {
            const changed = target[key] !== value
            const result = Reflect.set(target, key, value, receiver);

            if (result && !key.startsWith('_')) {
                set(form as FormData<T>, changed);
            }

            return result
        }
    }

    const form = new Proxy(new Form(data, handler), handler)

    return form
}

function wrap<T extends object>(data: T, handler: ProxyHandler<FormData<T>>) {
    return Object.entries(data).reduce(
        (acc, [key, value]) => {
            acc[key] = typeof value !== 'object' ? value : new Proxy(wrap(value, handler), handler);

            return acc
        },
        {} as T)
}