
export interface Vec2 {
    x: number;
    y: number;
}
export interface Size2 {
    w: number;
    h: number;
}

export type Obj<T> = Record<string, T>;

// https://stackoverflow.com/questions/52489261/typescript-can-i-define-an-n-length-tuple-type
export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;