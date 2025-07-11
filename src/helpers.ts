/**
 * @see https://lodash.com/docs#isEqual
 */
export function isEqual<T>(x: T, y: T): boolean {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
        ok(x).length === ok(y).length &&
        ok(x).every(key => isEqual(x[key], y[key]))
    ) : (x === y);
}

export function proxyWrap<T extends object>(data: T, handler: ProxyHandler<T>) {
    if (typeof data !== 'object' || data === null || data instanceof File || data instanceof Blob) {
        return data
    }

    if (Array.isArray(data)) {
        return data.map(item => proxyWrap(item, handler));
    }

    return Object.entries(data).reduce(
        (acc, [key, value]) => {
            acc[key] = typeof value !== 'object' || value === null ? value : new Proxy(proxyWrap(value, handler), handler);

            return acc
        },
        {} as T)
}

export function proxyUnwrap<T>(data: T): T {
    if (typeof data !== 'object' || data === null || data instanceof File || data instanceof Blob) {
        return data
    }

    if (Array.isArray(data)) {
        return data.map(proxyUnwrap) as unknown as T;
    }

    return Object.keys(data).reduce((acc, key) => {
        acc[key] = proxyUnwrap(data[key]);
        return acc
    }, {} as T)
}