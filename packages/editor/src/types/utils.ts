
// export type Obj<T> = { [ key: string ]: T };

// export type NullArr<T> = (T | null)[];

// export type Override<T, K extends keyof T, N> = Omit<T, K> & { [ K1 in K ]: N };

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

// export type MapEvery<M extends string, T> = { [ K in M ]: T };

// export type RotationModels = 'xyzw' | 'xyz';
// export const rotationModelNames: MapEvery<RotationModels, string> = {
//     'xyzw': 'Quaternion',
//     'xyz':  'Euler XYZ',
// };

// export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
// type _TupleOf<T, N extends number, R extends unknown[]> = R[ 'length' ] extends N ? R : _TupleOf<T, N, [ T, ...R ]>;

export type SelectionStatus = 
    | 'nothing'
    | 'selected'
