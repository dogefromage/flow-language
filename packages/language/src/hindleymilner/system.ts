import _ from "lodash";
import { assertNever, bracketize } from "../utils";

export type TypeEnvironment = Record<string, TypeStructure>;

export class TypeVariable {
    // for Robinson unification of HM
    public representative: TypeStructure = this;

    private static idCounter = 1;
    private id: number;

    constructor() {
        this.id = TypeVariable.idCounter++;
    }

    public toString(): string {
        prune(this);
        if (this.representative !== this) {
            return this.representative.toString();
        }
        // is representative
        return `τ${this.id}`;
    }
}
export class TypeApplication {
    constructor(
        public name: string,
        public args: TypeStructure[],
    ) {}

    public toString(): string {
        const args = this.args
            .map(T => T.toString())
            .map(s => bracketize(s));
        return [this.name, ...args].join(' ');
    }
}
export class FunctionType extends TypeApplication {
    constructor(arg: TypeStructure, ret: TypeStructure) {
        super('function', [arg, ret]);
    }
    toString(): string {
        const arg = bracketize(this.args[0].toString());
        const ret = bracketize(this.args[1].toString());
        return `${arg} -> ${ret}`;
    }
}
export class ListType extends TypeApplication {
    constructor(arg: TypeStructure) {
        super('list', [arg]);
    }
    public toString(): string {
        return `[${this.args[0]}]`;
    }
}
export class TupleType extends TypeApplication {
    constructor(tupleArgs: TypeStructure[]) {
        super('tuple', tupleArgs);
    }
    public toString(): string {
        return `(${this.args.join(', ')})`;
    }
}
export class EmptyRecordType extends TypeApplication {
    constructor() {
        super('empty_record', []);
    }
    public toString(): string {
        return `{}`;
    }
}
export class NonEmptyRecordType extends TypeApplication {
    constructor(
        key: TypeStructure,
        value: TypeStructure,
        next: EmptyRecordType | NonEmptyRecordType
    ) {
        super('nonempty_record', [ key, value, next ]);
    }
    public toString(): string {
        const [ key, value, next ] = this.args;
        const wrappedKey = bracketize(this.args[0].toString(), '[', ']');
        return `{ ${wrappedKey}: ${value}, ...${next} }`;
    }
}
export class TypeLiteral {
    constructor(
        public name: string, 
        public literal: string
    ) {}

    public toString(): string {
        return `${this.name}(${this.literal})`;
    }
}

type TypeStructure = TypeVariable | TypeApplication | TypeLiteral;

class InferenceException extends Error {}

/**
 * Robinson unification algorithm. Also prunes linked list of references
 * such that every element in this part of union points directly
 * to the same representative.
 */
function prune(t: TypeStructure): TypeStructure {
    if (t instanceof TypeVariable && t.representative !== t) {
        t.representative = prune(t.representative);
        return t.representative;
    }
    return t;
}

export function cloneType(t: TypeStructure, bound: Set<TypeVariable>): TypeStructure {
    const mappings = new Map<TypeVariable, TypeVariable>();
    function cloneRec(tp: TypeStructure): TypeStructure {
        const p = prune(tp);
        if (p instanceof TypeVariable) {
            if (isGeneric(p, bound)) {
                if (!mappings.has(p)) {
                    mappings.set(p, new TypeVariable());
                }
                return mappings.get(p)!;
            }
            // bound from outside, return original
            return p;
        }
        if (p instanceof TypeApplication) {
            return new TypeApplication(
                p.name,
                p.args.map(a => cloneRec(a))
            );
        }
        if (p instanceof TypeLiteral) {
            return new TypeLiteral(p.name, p.literal);
        }
        assertNever();
    }

    return cloneRec(t);
}

function isGeneric(t: TypeVariable, bound: Set<TypeVariable>) {
    return !occursIn(t, Array.from(bound));
}

function occursInType(v: TypeVariable, t: TypeStructure): boolean {
    // don't know if necessary
    v = prune(v) as TypeVariable;
    t = prune(t);

    if (t instanceof TypeVariable && t === v) {
        return t === v;
    }
    if (t instanceof TypeApplication) {
        return occursIn(v, t.args);
    }
    if (t instanceof TypeLiteral) {
        return false;
    }
    assertNever();
}

function occursIn(v: TypeVariable, types: TypeStructure[]): boolean {
    return types.find(t => occursInType(v, t)) != null;
}

export function unifyTypes(a: TypeStructure, b: TypeStructure) {
    a = prune(a);
    b = prune(b);
    
    if (a instanceof TypeVariable) {
        if (a != b) {
            if (occursInType(a, b)) {
                throw new InferenceException("Recursive unification.");
            }
            a.representative = b;
        }
    }
    else if (b instanceof TypeVariable) {
        unifyTypes(b, a);
    }
    
    else if (a instanceof ListType && b instanceof TupleType) {
        const listType = a.args[0];
        for (const tupleElementType of b.args) {
            unifyTypes(listType, tupleElementType);
        }
    }
    else if (b instanceof ListType && a instanceof TupleType) {
        unifyTypes(b, a);
    }

    else if (a instanceof NonEmptyRecordType && b instanceof NonEmptyRecordType) {
        // match somehow and unify
        assertNever('implement');
    }

    else if (a instanceof TypeLiteral && b instanceof TypeLiteral) {
        const areEqual = a.name === b.name && a.literal === b.literal;
        if (!areEqual) {
            throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
        }
    }
    else if (a instanceof TypeLiteral && b instanceof TypeApplication) {
        if (a.name !== b.name || b.args.length > 0) {
            throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
        }
    }
    else if (a instanceof TypeApplication && b instanceof TypeLiteral) {
        unifyTypes(b, a);
    }

    else if (a instanceof TypeApplication && b instanceof TypeApplication) {
        if (a.name !== b.name || a.args.length !== b.args.length) {
            throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
        }
        for (let i = 0; i < a.args.length; i++) {
            unifyTypes(a.args[i], b.args[i]);
        }
    }
    else {
        assertNever();
    }


    // OLD

    // a = prune(a);
    // b = prune(b);
    // if (a instanceof TypeVariable) {
    //     if (a != b) {
    //         if (occursInType(a, b)) {
    //             throw new InferenceException("Recursive unification.");
    //         }
    //         a.representative = b;
    //     }
    // }
    // else if (a instanceof TypeApplication && b instanceof TypeVariable) {
    //     unifyTypes(b, a);
    // }
    // else if (a instanceof TypeApplication && b instanceof TypeApplication) {
    //     if (a.name !== b.name || a.args.length !== b.args.length) {
    //         throw new InferenceException(`Type mismatch: ${a} != ${b}.`);
    //     }
    //     for (const [p, q] of _.zip(a.args, b.args)) {
    //         unifyTypes(p!, q!);
    //     }
    // }
    // else {
    //     assertNever();
    // }
}
