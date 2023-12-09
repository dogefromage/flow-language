import { assert } from "../utils";

export interface VarRefUnbound {
    kind: 'UNBOUND';
    id: number;
    level: number;
}
interface VarRefLink {
    kind: 'LINK';
    type: TExpr;
}
interface VarRefGeneric {
    kind: 'GENERIC';
    id: number;
}
type VarRef = VarRefUnbound | VarRefLink | VarRefGeneric;

let id = 0;
function nextId() {
    return id++;
}

export function newUnboundVar(level: number): TVar {
    return { kind: 'VAR', ref: { kind: 'UNBOUND', id: nextId(), level } };
}
export function newGenericVar(): TVar {
    return { kind: 'VAR', ref: { kind: 'GENERIC', id: nextId() } };
}


export interface TConst {
    kind: 'CONST';
    name: string;
}
export interface TApp {
    kind: 'APP';
    head: TExpr;
    arg: TExpr;
    // args: TExpr[];
}
export interface TArrow {
    kind: 'ARROW';
    param: TExpr;
    // params: TExpr[];
    ret: TExpr;
}
export interface TVar {
    kind: 'VAR';
    ref: VarRef;
}
export interface TRecord {
    kind: 'RECORD';
    row: TExpr;
}
export interface TRowEmpty {
    kind: 'ROWEMPTY';
}
export interface TRowExtend {
    kind: 'ROWEXTEND';
    key: string;
    field: TExpr;
    row: TExpr;
}

export type TExpr = 
    | TConst
    | TApp
    | TArrow
    | TVar
    | TRecord
    | TRowEmpty
    | TRowExtend

// export const typeExpressions = {
//     const: (name: string): TConst => ({ kind: 'CONST', name }),
//     app: (head: TExpr, args: TExpr[]): TApp => ({ kind: 'APP', head, args }),
//     arrow: (params: TExpr[], ret: TExpr): TArrow => ({ kind: 'ARROW', params, ret }),
//     var: (ref: VarRef): TVar => ({ kind: 'VAR', ref }),
//     record: (row: TExpr): TRecord => ({ kind: 'RECORD', row }),
//     rowEmpty: (): TRowEmpty => ({ kind: 'ROWEMPTY' }),
//     rowExtend: (key: string, field: TExpr, row: TExpr): TRowExtend => ({ kind: 'ROWEXTEND', key, field, row }),
// };

export function tyToString(ty: TExpr) {
    const genericNames = new Map<number, string>();
    let nameCounter = 0;
    const getName = (id: number) => {
        if (genericNames.has(id)) {
            return genericNames.get(id)!;
        }
        const name = String.fromCharCode(97 + nameCounter % 26);
        // const name = String.fromCharCode(97 + nameCounter % 26) + (nameCounter / 26 | 0);
        genericNames.set(id, name);
        nameCounter++;
        return name;
    }
    const f = (ty: TExpr): string => {
        switch (ty.kind) {
            case 'CONST':
                return ty.name;
            case 'APP':
                return `${bracketize(f(ty.head))}[${bracketize(f(ty.arg))}]`;
            case 'ARROW':
                return `(${bracketize(f(ty.param))}) -> ${bracketize(f(ty.ret))}`;
            case 'RECORD':
                return `{ ${tyToString(ty.row)} }`;
            case 'ROWEMPTY':
                return '{}';
            case 'ROWEXTEND':
                return `${ty.key}: ${tyToString(ty.field)} | ${tyToString(ty.row)}`;
            case 'VAR':
                switch (ty.ref.kind) {
                    case 'GENERIC':
                        return getName(ty.ref.id);
                    case 'LINK':
                        return f(ty.ref.type);
                    case 'UNBOUND':
                        return `_${ty.ref.id}`;
                }
        }
        assert(0);
    }
    const body = f(ty);
    if (genericNames.size) {
        return `forall[${Array.from(genericNames.values()).join('')}] ${body}`;
    }
    return body;
}
function bracketize(s: string): string {
    if (s.includes(' ')) {
        return `(${s})`;
    }
    return s;
}

export class InferenceError extends Error {}

export class TypeEnvironment {
    constructor(
        private content: Record<string, TExpr> = {},
    ) {}

    has(name: string): boolean {
        return this.content[name] != null;
    }

    get(name: string): TExpr {
        if (!this.has(name)) {
            throw new InferenceError(`Type variable ${name} not found in env.`);
        }
        return this.content[name];
    }

    extend(name: string, ty: TExpr) {
        return new TypeEnvironment({
            ...this.content,
            [name]: ty,
        });
    }
}   
