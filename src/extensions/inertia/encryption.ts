const config = {
    key: 'historyKey',
    iv: 'historyIv',
}

export function clear() {
    sessionStorage.removeItem(config.key)
    sessionStorage.removeItem(config.iv)
}

export async function encrypt(data: any) {
    const iv = getIv()
    const key = await getKey()
    data = JSON.stringify(data)

    const encoded = new Uint8Array(data.length * 3)
    const result = new TextEncoder().encodeInto(data, encoded)

    return await crypto.subtle.encrypt(
        {name: 'AES-GCM', iv},
        key,
        encoded.subarray(0, result.written)
    )
}

export async function decrypt<T>(data: BufferSource): Promise<T> {
    const iv = getIv()
    const key = await getKey()

    const result = await crypto.subtle.decrypt(
        {name: 'AES-GCM', iv},
        key,
        data
    )

    return JSON.parse(new TextDecoder().decode(result))
}

async function getKey() {
    const loadedKey = JSON.parse(sessionStorage.getItem(config.key) || 'null')

    const toCryptoKey = (key) => crypto.subtle.importKey(
        'raw',
        new Uint8Array(key),
        {name: 'AES-GCM', length: 256},
        true,
        ['encrypt', 'decrypt']
    )

    if (loadedKey) {
        return await toCryptoKey(loadedKey)
    }

    const key = await crypto.subtle.generateKey(
        {name: 'AES-GCM', length: 256},
        true,
        ['encrypt', 'decrypt']
    )

    const keyData = await crypto.subtle.exportKey('raw', key)

    sessionStorage.setItem(config.key, JSON.stringify(Array.from(new Uint8Array(keyData))))

    return key
}

function getIv() {
    const loaded = JSON.parse(sessionStorage.getItem(config.iv) || 'null')

    if (loaded) {
        return new Uint8Array(loaded as ArrayBuffer)
    }

    const iv = crypto.getRandomValues(new Uint8Array(12))

    sessionStorage.setItem(config.iv, JSON.stringify(Array.from(iv)))

    return iv
}