
export interface Vec2 {
    x: number;
    y: number;
}
export interface Size2 {
    w: number;
    h: number;
}
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type ColorTuple = [number, number, number];

export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object | undefined ? RecursivePartial<T[P]> :
    T[P];
};

export type SelectionStatus = 'nothing' | 'selected';
