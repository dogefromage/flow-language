

export function whatChanged(last: any, next: any, skipDepth: number) {

    if (skipDepth > 0) {
        if (last != next) {
            return [ 'changed', last, next ];
        }
    }

    if (typeof last === typeof next ||
        typeof last === 'boolean' ||
        typeof last === 'number' ||
        typeof last === 'string') {
        return;
    }

    if (typeof last === 'object') {
        // only compare same keys
        const intersection = new Set<string>();
        const nextKeys = new Set(Object.keys(next));
        for (const lastKey of Object.keys(last)) {
            if (nextKeys.has(lastKey)) {
                intersection.add(lastKey);
            }
        }

        const changeMap: Record<string, any> = {};
        let changed = false;
        for (const key of intersection) {
            const prop = whatChanged(last[key], next[key], skipDepth - 1);
            if (prop != null) {
                changeMap[key] = prop;
                changed = true;
            }
        }
        if (changed) {
            return changeMap;
        } else {
            return;
        }
    }

    throw new Error(`Unknown typeof, JSON content expected`);
}

// export function whatChanged(last: any, next: any) {
//     if (last == next) {
//         return;
//     }

//     if (typeof last !== typeof next ||
//         typeof last === 'boolean' ||
//         typeof last === 'number' ||
//         typeof last === 'string') {
//         return [ 'changed', last, next ];
//     }

//     if (typeof last === 'object') {
//         // only compare same keys
//         const intersection = new Set<string>();
//         const nextKeys = new Set(Object.keys(next));
//         for (const lastKey of Object.keys(last)) {
//             if (nextKeys.has(lastKey)) {
//                 intersection.add(lastKey);
//             }
//         }

//         const changeMap: Record<string, any> = {};
//         let changed = false;
//         for (const key of intersection) {
//             const prop = whatChanged(last[key], next[key]);
//             if (prop != null) {
//                 changeMap[key] = prop;
//                 changed = true;
//             }
//         }
//         if (changed) {
//             return changeMap;
//         } else {
//             return;
//         }
//     }

//     throw new Error(`Unknown typeof, JSON content expected`);
// }