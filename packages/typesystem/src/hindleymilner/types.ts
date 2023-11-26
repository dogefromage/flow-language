import { assert } from "../utils";

export interface VarRefUnbound {
    kind: 'UNBOUND';
    id: number;
    level: number;
}
interface VarRefLink {
    kind: 'LINK';
    type: Ty;
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


interface TConst {
    kind: 'CONST';
    name: string;
}
interface TApp {
    kind: 'APP';
    head: Ty;
    args: Ty[];
}
export interface TArrow {
    kind: 'ARROW';
    params: Ty[];
    ret: Ty;
}
interface TVar {
    kind: 'VAR';
    ref: VarRef;
}
interface TRecord {
    kind: 'RECORD';
    row: Ty;
}
interface TRowEmpty {
    kind: 'ROWEMPTY';
}
interface TRowExtend {
    kind: 'ROWEXTEND';
    key: string;
    field: Ty;
    row: Ty;
}

export type Ty = 
    | TConst
    | TApp
    | TArrow
    | TVar
    | TRecord
    | TRowEmpty
    | TRowExtend

export function tyToString(ty: Ty) {
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
    const f = (ty: Ty): string => {
        switch (ty.kind) {
            case 'CONST':
                return ty.name;
            case 'APP':
                return `${bracketize(f(ty.head))}[${ty.args.map(s => bracketize(f(s))).join(', ')}]`;
            case 'ARROW':
                return `(${ty.params.map(s => bracketize(f(s))).join(', ')}) -> ${bracketize(f(ty.ret))}`;
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
        private content: Record<string, Ty> = {},
    ) {}

    has(name: string): boolean {
        return this.content[name] != null;
    }

    get(name: string): Ty {
        if (!this.has(name)) {
            throw new InferenceError(`Type variable ${name} not found in env.`);
        }
        return this.content[name];
    }

    extend(name: string, ty: Ty) {
        return new TypeEnvironment({
            ...this.content,
            [name]: ty,
        });
    }
}   


// /**
//  * Robinson unification algorithm. Also prunes linked list of references
//  * such that every element in this part of union points directly
//  * to the same representative.
//  */
// function prune(t: TypeStructure): TypeStructure {
//     if (t instanceof TypeVariable && t.representative !== t) {
//         t.representative = prune(t.representative);
//         return t.representative;
//     }
//     return t;
// }

// export function cloneType(t: TypeStructure, bound: Set<TypeVariable>): TypeStructure {
//     const mappings = new Map<TypeVariable, TypeVariable>();
//     function cloneRec(tp: TypeStructure): TypeStructure {
//         const p = prune(tp);
//         if (p instanceof TypeVariable) {
//             if (isGeneric(p, bound)) {
//                 if (!mappings.has(p)) {
//                     mappings.set(p, new TypeVariable());
//                 }
//                 return mappings.get(p)!;
//             }
//             // bound from outside, return original
//             return p;
//         }
//         if (p instanceof TypeApplication) {
//             return new TypeApplication(
//                 p.name,
//                 p.args.map(a => cloneRec(a))
//             );
//         }
//         if (p instanceof TypeLiteral) {
//             return new TypeLiteral(p.name, p.literal);
//         }
//         assertNever();
//     }

//     return cloneRec(t);
// }

// function isGeneric(t: TypeVariable, bound: Set<TypeVariable>) {
//     return !occursIn(t, Array.from(bound));
// }

// function occursInType(v: TypeVariable, t: TypeStructure): boolean {
//     // don't know if necessary
//     v = prune(v) as TypeVariable;
//     t = prune(t);

//     if (t instanceof TypeVariable && t === v) {
//         return t === v;
//     }
//     if (t instanceof TypeApplication) {
//         return occursIn(v, t.args);
//     }
//     if (t instanceof TypeLiteral) {
//         return false;
//     }
//     assertNever();
// }

// function occursIn(v: TypeVariable, types: TypeStructure[]): boolean {
//     return types.find(t => occursInType(v, t)) != null;
// }

// export function unifyTypes(a: TypeStructure, b: TypeStructure) {
//     a = prune(a);
//     b = prune(b);
    
//     if (a instanceof TypeVariable) {
//         if (a != b) {
//             if (occursInType(a, b)) {
//                 throw new InferenceException("Recursive unification.");
//             }
//             a.representative = b;
//         }
//     }
//     else if (b instanceof TypeVariable) {
//         unifyTypes(b, a);
//     }
    
//     else if (a instanceof ListType && b instanceof TupleType) {
//         const listType = a.args[0];
//         for (const tupleElementType of b.args) {
//             unifyTypes(listType, tupleElementType);
//         }
//     }
//     else if (b instanceof ListType && a instanceof TupleType) {
//         unifyTypes(b, a);
//     }

//     else if (a instanceof NonEmptyRecordType && b instanceof NonEmptyRecordType) {
//         // match somehow and unify
//         assertNever('implement');
//     }

//     else if (a instanceof TypeLiteral && b instanceof TypeLiteral) {
//         const areEqual = a.name === b.name && a.literal === b.literal;
//         if (!areEqual) {
//             throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
//         }
//     }
//     else if (a instanceof TypeLiteral && b instanceof TypeApplication) {
//         if (a.name !== b.name || b.args.length > 0) {
//             throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
//         }
//     }
//     else if (a instanceof TypeApplication && b instanceof TypeLiteral) {
//         unifyTypes(b, a);
//     }

//     else if (a instanceof TypeApplication && b instanceof TypeApplication) {
//         if (a.name !== b.name || a.args.length !== b.args.length) {
//             throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
//         }
//         for (let i = 0; i < a.args.length; i++) {
//             unifyTypes(a.args[i], b.args[i]);
//         }
//     }
//     else {
//         assertNever();
//     }


//     // OLD

//     // a = prune(a);
//     // b = prune(b);
//     // if (a instanceof TypeVariable) {
//     //     if (a != b) {
//     //         if (occursInType(a, b)) {
//     //             throw new InferenceException("Recursive unification.");
//     //         }
//     //         a.representative = b;
//     //     }
//     // }
//     // else if (a instanceof TypeApplication && b instanceof TypeVariable) {
//     //     unifyTypes(b, a);
//     // }
//     // else if (a instanceof TypeApplication && b instanceof TypeApplication) {
//     //     if (a.name !== b.name || a.args.length !== b.args.length) {
//     //         throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
//     //     }
//     //     for (const [p, q] of _.zip(a.args, b.args)) {
//     //         unifyTypes(p!, q!);
//     //     }
//     // }
//     // else {
//     //     assertNever();
//     // }
// }
