import { signal, effect } from "./signals";
import { axios, RouterRequestConfig } from "./router";
import { isEqual } from "./helpers";

export type FData<T extends object> = T & Form<T>

export class Form<TForm extends object> {
    _defaults: TForm;
    _transform: unknown = undefined;
    _recentlySuccessfulTimeout: NodeJS.Timeout | null = null;
    readonly _handler: ProxyHandler<FData<TForm>>

    public wasSuccessful: boolean = false;
    public recentlySuccessful: boolean = false;
    public processing: boolean = false;
    public errors: Record<string, string> = {};

    public get hasErrors() {
        return Object.keys(this.errors).length > 0;
    }

    public get isDirty() {
        return !isEqual(this.data(), this._defaults);
    }

    constructor (initial: TForm, handler: ProxyHandler<FData<TForm>>) {
        this._defaults = initial
        this._handler = handler

        Object.defineProperty(this, "_defaults", { enumerable: false })
        Object.defineProperty(this, "_transform", { enumerable: false })
        Object.defineProperty(this, "_recentlySuccessfulTimeout", { enumerable: false })
        Object.defineProperty(this, "_handler", { enumerable: false, writable: false, configurable: false })

        this.reset()
    }

    data(): TForm {
        const keys = Object.keys(this._defaults);

        return keys.reduce((acc, key) => {
            acc[key] = unwrap(this[key]);
            return acc;
        }, {} as TForm);
    }

    transform(fn: (data: TForm) => unknown) {
        this._transform = fn(this.data());

        return this;
    }

    reset(...fields: string[]) {
        const data = fields.length > 0
            ? Object.keys(this._defaults)
                .filter(key => fields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = this._defaults[key];
                    return obj
                }, {})
            : this._defaults

        Object.assign(this, wrap(data, this._handler));

        return this;
    }

    fill(data: TForm) {
        Object.assign(this, wrap(data, this._handler));

        return this;
    }

    defaults(field?: string | Record<string, unknown>, value?: unknown) {
        if (typeof field === 'string') {
            field = { [field]: value };
        }

        if (!field) {
            field = unwrap(Object.keys(this._defaults).reduce((obj, key) => {
                obj[key] = this[key];
                return obj
            }, {}))
        }

        this._defaults = { ...this._defaults, ...field };

        return this;
    }

    clearErrors(...fields: string[]) {
        if (fields.length === 0) {
            this.errors = {};
        } else for (const field of fields) {
            delete this.errors[field];
        }

        return this;
    }

    setError(field: string | Record<string, string>, message?: string) {
        if (typeof field === 'string') {
            field = { [field]: message as string };
        }

        this.errors = { ...this.errors, ...field };

        return this;
    }

    request<TForm>(options: RouterRequestConfig<TForm>) {
        if (this._recentlySuccessfulTimeout) {
            clearTimeout(this._recentlySuccessfulTimeout);
        }
        this.wasSuccessful = false;
        this.processing = true;

        let data: object | FormData = this._transform || this.data();

        if (containsFile(data)) {
            data = objectToFormData(data)
        }

        return axios.request({ ...options, data })
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

    const [get, set] = signal<FData<T>>(undefined, isEqual)
    const subscribe = (fn: (form: FData<T>) => void) => effect(() => fn(get()))

    set(createProxy(data, set) as FData<T>);

    return { get, set, subscribe }
}

function createProxy<T extends object>(data: T, set: (form: FData<T>, changed?: boolean) => void) {
    const handler : ProxyHandler<FData<T>> = {
        set(target, key: string, value, receiver) {
            const changed = target[key] !== value
            const result = Reflect.set(target, key, value, receiver);

            if (result && !key.startsWith('_')) {
                set(proxy as FData<T>, changed);
            }

            return result
        }
    }

    const form = new Form(data, handler)
    const proxy = new Proxy(form, handler)

    return proxy
}

function wrap<T extends object>(data: T, handler: ProxyHandler<FData<T>>) {
    if (typeof data !== 'object' || data === null || data instanceof File || data instanceof Blob) {
        return data
    }

    if (Array.isArray(data)) {
        return data.map(item => wrap(item, handler));
    }

    return Object.entries(data).reduce(
        (acc, [key, value]) => {
            acc[key] = typeof value !== 'object' || value === null ? value : new Proxy(wrap(value, handler), handler);

            return acc
        },
        {} as T)
}


function unwrap<T extends object>(data: T): T {
    if (typeof data !== 'object' || data === null || data instanceof File || data instanceof Blob) {
        return data
    }

    if (Array.isArray(data)) {
        return data.map(unwrap) as unknown as T;
    }

    return Object.keys(data).reduce((acc, key) => {
        acc[key] = unwrap(data[key]);
        return acc
    }, {} as T)
}

function containsFile<T extends object>(obj: T): boolean {
    if (typeof obj !== 'object' || obj === null) {
        return false
    }

    return Object.values(obj).some(item => item instanceof File || item instanceof Blob
        ? true
        : containsFile(item)
    )
}

function objectToFormData(obj, form = new FormData(), namespace = '') {
    for (const key in obj) {
        if (!Object.hasOwn(obj, key)) continue;
        const value = obj[key];
        const formKey = namespace ? `${namespace}[${key}]` : key;

        if (value instanceof File || value instanceof Blob) {
            form.append(formKey, value);
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const arrayKey = `${formKey}[${index}]`;
                if (typeof item === 'object' && item !== null) {
                    objectToFormData(item, form, arrayKey);
                } else {
                    form.append(arrayKey, item);
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            objectToFormData(value, form, formKey);
        } else if (value !== undefined && value !== null) {
            form.append(formKey, value);
        }
    }

    return form;
}