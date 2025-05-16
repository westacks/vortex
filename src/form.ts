import { getPage } from "./page";
import { signal, effect, type Signal, type SignalSetter, type SignalGetter } from "./signals";
import { axios, RouterRequestConfig } from "./router";
import { AxiosProgressEvent } from "axios";
import { isEqual } from "./helpers";

type FormData<T extends object> = T & Form<T>

class Form<TForm extends object> {
    protected _initial: TForm;
    protected _data: any = undefined;
    protected _recentlySuccessfulTimeout: NodeJS.Timeout | null = null;

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

    constructor (initial: TForm) {
        this._initial = initial;

        Object.assign(this, initial);
    }

    data(): TForm {
        const keys = Object.keys(this._initial);

        return keys.reduce((acc, key) => {
            acc[key] = this[key];
            return acc;
        }, {} as TForm);
    }

    transform<T>(fn: (data: TForm) => T) {
        this._data = fn(this.data());

        return this;
    }

    reset() {
        return Object.assign(this, this._initial);
    }

    submit<TForm>(options: RouterRequestConfig<TForm>) {
        this._recentlySuccessfulTimeout && clearTimeout(this._recentlySuccessfulTimeout);
        this.wasSuccessful = false;
        this.processing = true;

        return axios.request({...options, data: this._data || this.data()})
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
                this._data = undefined;
                this.processing = false;
            })
    }

    get(url: string, options?: RouterRequestConfig) {
        return this.submit({ ...options, url, method: 'get' });
    }

    post(url: string, options?: RouterRequestConfig) {
        return this.submit({ ...options, url, method: 'post' });
    }

    put(url: string, options?: RouterRequestConfig) {
        return this.submit({ ...options, url, method: 'put' });
    }

    patch(url: string, options?: RouterRequestConfig) {
        return this.submit({ ...options, url, method: 'patch' });
    }

    delete(url: string, options?: RouterRequestConfig) {
        return this.submit({ ...options, url, method: 'delete' });
    }
}

export function useForm<T extends object>(
    rememberKeyOrData: string | T | (() => T),
    maybeData?: T | (() => T)
) {
    const rememberKey = typeof rememberKeyOrData === "string" ? rememberKeyOrData : undefined
    const input: T | (() => T) = (typeof rememberKeyOrData === 'string' ? maybeData : rememberKeyOrData) ?? ({} as T)
    const initial: T = typeof input === 'function' ? input() : input

    const [get, set] = signal<FormData<T>>(undefined, isEqual)
    const subscribe = (fn: (form: FormData<T>) => void) => effect(() => fn(get()))

    const form = new Proxy(new Form(initial) as FormData<T>, {
        set(target, key: string, value, receiver) {
            if (! (key in target)) {
                return false
            }

            const changed = target[key] !== value
            const result = Reflect.set(target, key, value, receiver);

            if (result && !key.startsWith('#')) {
                set(form, changed);
            }

            return result
        }
    })

    set(form as FormData<T>);

    return { get, set, subscribe }
}