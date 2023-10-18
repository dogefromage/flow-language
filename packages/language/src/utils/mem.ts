import { deepFreeze } from '.';
import { ListCache } from './ListCache';
import { randomU32 } from './hashing';

export type MemFunction = (...args: any[]) => any;

export interface MemOptions<F extends MemFunction> {
    tag: string;
    generateInfo?: (args: Parameters<F>) => string,
    printGroup?: boolean,
    debugHitMissRate?: boolean;
}

export const ALWAYS_PRINT_GROUP = false;

// custom console.group because chrome/firefox sucks
const groupStack: string[] = [];
const GROUP_INDENT = 2;
export function print(...args: any[]) {
    if (groupStack.length) {
        console.log(' '.repeat(GROUP_INDENT * groupStack.length), ...args);
    } else {
        // otherwise <empty-string> is printed
        console.log(...args);
    }
}
export function groupStart(startText: string) {
    print(startText);
    groupStack.push(startText);
}
export function groupEnd(endText = '') {
    groupStack.pop();
    print(endText);
}


export function mem<F extends MemFunction>(
    fn: F,
    cache = new ListCache(233),
    options: MemOptions<F>
) {
    let hits = 0;
    let misses = 0;
    const handlerTag = randomU32(); // unique for every handler instance
    const printGroup = options?.printGroup || ALWAYS_PRINT_GROUP;
    const tag = options?.tag || '<untagged>';

    return ((...plainArgs: Parameters<F>) => {
        const taggedArgs = [handlerTag, ...plainArgs];

        const cached = cache.get(taggedArgs);
        if (typeof cached !== 'undefined') {
            hits++;

            if (printGroup) {
                const info = options?.generateInfo?.(plainArgs) || '<noinfo>';
                print(`hit [${tag}] (${info})`);
            }

            return cached;
        }

        misses++;
        if (options?.debugHitMissRate) {
            print(`Hits/Misses: ${options.tag} ${(hits / misses).toFixed(4)}`);
        }

        let groupMsg = '';
        if (printGroup) {
            const info = options?.generateInfo?.(plainArgs) || '<noinfo>';
            groupMsg = `miss [${tag}] (${info}) {`;
            groupStart(groupMsg);
        }

        const result = fn(...plainArgs);
        deepFreeze(result);
        cache.set(taggedArgs, result);

        if (printGroup) {
            groupEnd('}');
        }

        return result;
    }) as F;
}
