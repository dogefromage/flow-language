import _ from "lodash";

export function assert<T>(condition: T, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}
export function assertDef<T>(element: T | null | undefined, msg?: string) {
    if (element == null) {
        throw new Error(msg || `Assertion failed, not defined`);
    }
    return element;
}
export function assertTruthy(value: any, msg?: string) {
    if (!value) {
        throw new Error(msg || `Assertion failed, value false`);
    }
}
export function assertNever(msg?: string): never {
    throw new Error(msg || `Assertion failed, code was reached.`);
}

export function wrapDefined<T>(...items: T[]) {
    return items.filter(item => item != null) as NonNullable<T>[];
}

export function deepFreeze<T extends any>(obj: T): void {
    if (typeof obj !== 'object' || obj == null) {
        return;
    }
    Object.keys(obj).forEach((prop) => {
        // @ts-ignore
        if (typeof obj[prop] === "object" && !Object.isFrozen(obj[prop])) {
            // @ts-ignore
            deepFreeze(obj[prop]);
        }
    });
    Object.freeze(obj);
};

export function prettifyLabel(propertyName: string) {
    return _.startCase(propertyName.replaceAll('_', ' ').trim());
}

export function base26StringToIndex(id: string) {
    let acc = 0;
    while (id.length) {
        const x = id.charCodeAt(0) - 'a'.charCodeAt(0);
        id = id.slice(1);
        acc = 26 * acc + x;
    }
    return acc;
}
export function convertToBase(x: number, base: number) {
    if (base <= 1) {
        throw new Error(`Invalid base`);
    }
    if (x === 0) return [ 0 ];
    const result: number[] = [];
    while (x > 0) {
        let remainder = x % base;
        result.push(remainder);
        x = (x - remainder) / base;
    }
    return result;
}
export function indexToBase26String(n: number) {
    return convertToBase(n, 26)
        .reverse()
        .map(x => String.fromCharCode('a'.charCodeAt(0) + x))
        .join('');
}

export const bracketize = (s: string, open='(', close=')') => 
    s.includes(' ') ? `${open}${s}${close}` : s;


