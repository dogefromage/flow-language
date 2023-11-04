import { assertTruthy } from '.';
import { Obj } from '../types/internal';
import { mem } from './mem';

export const always = <T>(v: T) => () => v;

export const memoObjectByFlatEntries = mem(
    <T extends Exclude<any, string>>(...flatEntries: (T | string)[]) => {
        // type V = T extends string ? never : T;
        const res: Obj<T> = {};
        assertTruthy(flatEntries.length % 2 == 0);
        for (let i = 0; i < flatEntries.length; i += 2) {
            const [key, value] = flatEntries.slice(i);
            assertTruthy(typeof key === 'string');
            res[key as string] = value as T;
        }
        return res;
    },
    undefined,
    { tag: 'memoObjectByFlatEntries' },
)

export function memoObject<T extends any>(obj: Obj<T>): Obj<T> {
    const flatEntries: (string | T)[] = Object.entries(obj).flat();
    return memoObjectByFlatEntries(...flatEntries);
}

export const memoList = mem(
    <T>(...items: T[]) => items, 
    undefined, 
    { tag: 'memoList' }
);

export const zipInner = <X, Y>(x: X[], y: Y[]) => {
    const pairs: [X, Y][] = [];
    const sharedLength = Math.min(x.length, y.length);
    for (let i = 0; i < sharedLength; i++) {
        pairs.push([x[i], y[i]]);
    }
    return pairs;
}

export function mapObj<X, Y>(
    obj: Record<string, X>, map: (value: X, key: string) => Y
): Record<string, Y> {
    const pairs = Object.entries(obj);
    const mapped = pairs.map<[ string, Y ]>(([ k, x ]) => [ k, map(x, k) ]);
    return Object.fromEntries(mapped);
}
export function mapObjKeys<X>(
    obj: Record<string, X>, map: (oldKey: string) => string
): Record<string, X> {
    const pairs = Object.entries(obj);
    const mapped = pairs.map<[ string, X ]>(([ oldKey, x ]) => [ map(oldKey), x ]);
    return Object.fromEntries(mapped);
}
export function filterObj<X>(
    obj: Record<string, X>, predicate: (x: X, key: string) => any
): Record<string, X> {
    const pairs = Object.entries(obj);
    const filtered = pairs.filter(([ key, x ]) => predicate(x, key));
    return Object.fromEntries(filtered);
}

/**
 * Expects array to contain numberic keys
 */
export function objToArr<T>(obj: Record<string, T>) {
    // collect
    const maxNumKey = findMaxIntegerKey(obj);
    const arr: (T | undefined)[] = [];
    for (let i = 0; i <= maxNumKey; i++) {
        arr[i] = obj[i];
    }
    return arr;
}

// -1 if none, otherwise positive integer
export function findMaxIntegerKey(obj: Record<string, any>) {
    let maxNumKey = -1;
    for (const key of Object.keys(obj)) {
        if (key.match(/^-?\d+$/)) {
            maxNumKey = Math.max(maxNumKey, parseInt(key));
        }
    }
    return maxNumKey;
}