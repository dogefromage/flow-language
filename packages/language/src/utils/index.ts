
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

export function wrapDefined<T>(...items: T[]) {
    return items.filter(item => item != null) as NonNullable<T>[];
}

export function deepFreeze(obj: any) {
    if (typeof obj !== 'object') {
        return;
    }
    Object.keys(obj).forEach((prop) => {
        if (typeof obj[prop] === "object" && !Object.isFrozen(obj[prop])) {
            deepFreeze(obj[prop]);
        }
    });
    Object.freeze(obj);
};