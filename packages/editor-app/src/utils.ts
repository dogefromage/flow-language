

export function assertDef<T>(x: T, msg?: string): asserts x is NonNullable<T> {
    if (x == null) {
        throw new Error(`Assertion Failed: ${msg || ''}`);
    }
}
