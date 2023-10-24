

export function assertDef<T>(x: T, msg?: string): asserts x is NonNullable<T> {
    if (x == null) {
        throw new Error(`Assertion Failed: ${msg || ''}`);
    }
}
export function assertNonNull<T>(x: T, msg?: string): NonNullable<T> {
    if (x == null) {
        throw new Error(`Assertion Failed: ${msg || ''}`);
    }
    return x;
}

export async function wait(millis: number) {
    return new Promise<void>((res, rej) => {
        setTimeout(() => {
            res();
        }, millis);
    });
}