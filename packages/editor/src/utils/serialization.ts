
// https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
export function jsonReplacer(key: string, value: any) {
    if (value instanceof Map) {
        return {
            __type__: 'Map',
            data: Array.from(value.entries()),
        };
    }
    if (value instanceof Set) {
        return {
            __type__: 'Set',
            data: Array.from(value.values()),
        };
    }
    return value;
}
export function jsonReviver(key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.__type__ === 'Map') {
            return new Map(value.data);
        }
        if (value.__type__ === 'Set') {
            return new Set(value.data);
        }
    }
    return value;
}
