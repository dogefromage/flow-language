

export function maybe<T>(t: T) {
    return t as T | undefined;
}