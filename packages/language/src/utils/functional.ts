import { assertTruthy, deepFreeze } from '.';
import { Obj } from '../types/utilTypes';
import { ListCache } from './ListCache';
import { randomU32 } from './hashing';

interface MemOptions {
    tag: string;
    debugHitMiss?: boolean;
    // debugCacheFull?: boolean;
    debugHitMissRate?: boolean;
    // debugPrint?: boolean;
    // debugValues?: boolean;
}

export function mem<F extends (...args: any[]) => any>(
    fn: F,
    cache = new ListCache(1009),
    options?: MemOptions
) {
    let hits = 0;
    let misses = 0;
    const handlerTag = randomU32(); // unique for every handler instance

    return ((...plainArgs: Parameters<F>) => {
        const taggedArgs = [handlerTag, ...plainArgs];

        const cached = cache.get(taggedArgs);
        if (typeof cached !== 'undefined') {
            if (options?.debugHitMiss) {
                console.log(`Cache hit: ${options.tag}`);
            }
            hits++;
            // if (options?.debugValues) {
            //     console.log('hit', taggedArgs, cached);
            // }
            return cached;
        }

        if (options?.debugHitMiss) {
            console.log(`Cache miss: ${options.tag}`);
        }
        const result = fn(...plainArgs);
        deepFreeze(result);
        cache.set(taggedArgs, result);
        // if (options?.debugValues) {
        //     console.log('miss', taggedArgs, result);
        // }
        misses++;
        // if (options?.debugCacheFull) {
        //     console.log(`Cache full: ${options.tag} ${cache.getCacheFull().toFixed(4)}`);
        // }
        // if (options?.debugPrint) {
        //     console.log(cache);
        // }
        if (options?.debugHitMissRate) {
            console.log(`Hits/Misses: ${options.tag} ${(hits / misses).toFixed(4)}`);
        }
        return result;
    }) as F;
}

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
)

export function memoObject<T extends any>(obj: Obj<T>): Obj<T> {
    const flatEntries: (string | T)[] = Object.entries(obj).flat();
    return memoObjectByFlatEntries(...flatEntries);
}

export const memoList = mem(<T>(...items: T[]) => items);

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