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

function trecord(mapT: Record<string, TExpr>, rest: TExpr = { kind: 'ROWEMPTY' }): TRecord {
    let row = rest;
    for (const [key, field] of Object.entries(mapT)) {
        row = { kind: 'ROWEXTEND', key, field, row };
    }
    return { kind: 'RECORD', row };
}

export const typeConstructors = {
    tconst: (name: string): TConst => ({ kind: 'CONST', name }),
    tapp: (head: TExpr, arg: TExpr): TApp => ({ kind: 'APP', head, arg }),
    tarrow: (param: TExpr, ret: TExpr): TArrow => ({ kind: 'ARROW', param, ret }),
    trecord,
    tgeneric: newGenericVar,
    // trecord: (row: TExpr): TRecord => ({ kind: 'RECORD', row }),
    // trowempty: (): TRowEmpty => ({ kind: 'ROWEMPTY' }),
    // trowextend: (key: string, field: TExpr, row: TExpr): TRowExtend => ({ kind: 'ROWEXTEND', key, field, row }),
};


export interface GenericNamingContext {
    nameMap: Map<number, string>;
    nameCounter: number;
}
export function createGenericNamingContext(): GenericNamingContext {
    return {
        nameMap: new Map(),
        nameCounter: 0,
    };
}

export function populateGenericNamingContext(ty: TExpr, ctx: GenericNamingContext) {
    const generateName = (id: number) => {
        if (!ctx.nameMap.has(id)) {
            const name = String.fromCharCode(97 + ctx.nameCounter % 26);
            // const name = String.fromCharCode(97 + nameCounter % 26) + (nameCounter / 26 | 0);
            ctx.nameMap.set(id, name);
            ctx.nameCounter++;
        }
    }
    const f = (ty: TExpr): void => {
        switch (ty.kind) {
            case 'APP':
                f(ty.head);
                f(ty.arg);
                return;
            case 'ARROW':
                f(ty.param);
                f(ty.ret);
                return;
            case 'RECORD':
                f(ty.row);
                return;
            case 'ROWEXTEND': {
                f(ty.field);
                f(ty.row);
                return;
            }
            case 'VAR':
                switch (ty.ref.kind) {
                    case 'GENERIC':
                        generateName(ty.ref.id);
                        return;
                    case 'LINK':
                        f(ty.ref.type);
                        return;
                    case 'UNBOUND':
                        return;
                }
            case 'CONST':
            case 'ROWEMPTY':
                return;
        }
        assert(false);
    }
    f(ty);
}

export function tyToString(ty: TExpr, ctx?: GenericNamingContext): string {
    const usedNames = new Set<string>();
    const getName = (id: number) => {
        const name = ctx?.nameMap.get(id)! || '$' + id;
        usedNames.add(name);
        return name;
    }
    const f = (ty: TExpr): string => {
        switch (ty.kind) {
            case 'CONST':
                return ty.name;
            case 'APP':
                return `${brk(f(ty.head))}[${brk(f(ty.arg))}]`;
            case 'ARROW':
                return `(${brk(f(ty.param))}) -> ${brk(f(ty.ret))}`;
            case 'RECORD':
                return `{ ${f(ty.row)} }`;
            case 'ROWEMPTY':
                return '{}';
            case 'ROWEXTEND': {
                let extensions: TRowExtend[] = [];
                while (ty.kind === 'ROWEXTEND') {
                    extensions.push(ty);
                    ty = ty.row;
                }
                const fields = extensions.map(e => `${e.key}: ${brk(f(e.field))}`).join(', ');
                if (ty.kind !== 'ROWEMPTY') {
                    return `${fields} | ${brk(f(ty))}`;
                }
                return `${fields}`
            }
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
    if (usedNames.size > 0) {
        const usedNameVars = [...usedNames]
            .sort((a, b) => a.localeCompare(b))
            .join(' ');
        return `forall[${usedNameVars}] ${body}`;
    }
    return body;
}
function brk(s: string): string {
    const isBracketed = /{.*}|\(.*\)|\[.*\]/.test(s);
    if (!isBracketed && s.includes(' ')) {
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
