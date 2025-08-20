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

export function formDataToObject(formData: FormData): Record<string, unknown> {
    const obj = {};

    function assign(obj, path, value) {
        let current = obj;

        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            const isLast = i === path.length - 1;

            if (isLast) {
                // type cast
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value.trim() !== '') value = +value;

                if (Array.isArray(current) && key === '') current.push(value);
                else current[key] = value;
            } else {
                const nextKey = path[i + 1];
                if (!(key in current)) {
                    if (nextKey === '' || !isNaN(nextKey)) current[key] = [];
                    else current[key] = {};
                }
                current = current[key];
            }
        }
    }

    for (const [fullKey, value] of formData.entries()) {
        const path: string[] = [];
        let buffer = '';
        let bracketMode = false;
        let escapeNext = false;

        for (let char of fullKey) {
            if (escapeNext) {
                buffer += char;
                escapeNext = false;
            } else if (char === '\\') {
                escapeNext = true;
            } else if (char === '.' && !bracketMode) {
                if (buffer) path.push(buffer);
                buffer = '';
            } else if (char === '[') {
                if (buffer) path.push(buffer);
                buffer = '';
                bracketMode = true;
            } else if (char === ']' && bracketMode) {
                path.push(buffer);
                buffer = '';
                bracketMode = false;
            } else {
                buffer += char;
            }
        }
        if (buffer) path.push(buffer);

        assign(obj, path, value);
    }

    return obj;
}
