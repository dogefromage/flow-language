

export function ihash(x: number) {
    // hash x
    x = Math.imul((x >> 16) ^ x, 0x45d9f3b);
    x = Math.imul((x >> 16) ^ x, 0x45d9f3b);
    x = (x >> 16) ^ x;
    return x;
}

function iadd(a: number, b: number) {
    return (a + b) | 0;
}

export function hashIntSequence(X: number[]) {
    let x = 0;
    for (const y of X) {
        x = ihash(iadd(x, y));
    }
    return x;
}

export function randomU32() {
    return (Math.random()*(2**32)) | 0;
}

const nullHash = randomU32();
const undefinedHash = randomU32();
const trueHash = randomU32();
const falseHash = randomU32();

const weakCache = new WeakMap<object, number>(); // makes objects garbage collectable
export function hashAnyU32(value: any): number {
    switch (typeof value) {
        case 'number':
            return value;
        case 'boolean':
            return value ? trueHash : falseHash;
        case 'string':
            const charCodes: number[] = [];
            for (let i = 0; i < value.length; i++) {
                charCodes.push(value.charCodeAt(i))
            }
            return hashIntSequence(charCodes);
        case 'object':
            if (value === null) {
                return nullHash;
            }
            const cached = weakCache.get(value);
            if (cached != null) {
                return cached;
            }
            const hash = randomU32();
            weakCache.set(value, hash);
            return hash;
        case 'undefined':
            return undefinedHash;
    }
    throw new Error(`Unsupported type '${typeof value}'`);
}
