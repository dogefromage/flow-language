import _ from "lodash";

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