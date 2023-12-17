import { assert } from "../utils";
import { UnificationError, TExpr, VarRefUnbound, newUnboundVar, tyToString } from "./typeExpr";

export function unifyTypes(a: TExpr, b: TExpr) {
    if (a === b) {
        return;
    }
    if (a.kind === 'CONST' && b.kind === 'CONST' && a.name === b.name) {
        return;
    }
    if (a.kind === 'APP' && b.kind === 'APP') {
        unifyTypes(a.head, b.head);
        unifyTypes(a.arg, b.arg);
        return;
    }
    if (a.kind === 'ARROW' && b.kind === 'ARROW') {
        unifyTypes(a.param, b.param);
        unifyTypes(a.ret, b.ret);
        return;
    }
    if (a.kind === 'VAR' && b.kind === 'VAR' && a.ref.kind === 'LINK' && b.ref.kind === 'LINK') {
        unifyTypes(a.ref.type, b.ref.type);
        return;
    }
    if (a.kind === 'VAR' && a.ref.kind === 'LINK') {
        unifyTypes(a.ref.type, b);
        return;
    }
    if (b.kind === 'VAR' && b.ref.kind === 'LINK') {
        unifyTypes(a, b.ref.type);
        return;
    }
    if (a.kind === 'VAR' && b.kind === 'VAR' && a.ref.kind === 'UNBOUND' && b.ref.kind === 'UNBOUND' && a.ref.id === b.ref.id) {
        assert(false, 'Two different types cannot share id.');
    }
    if (a.kind === 'VAR' && a.ref.kind === 'UNBOUND') {
        occursCheckAdjustLevels(a.ref, b);
        a.ref = { kind: 'LINK', type: b };
        return;
    }
    if (b.kind === 'VAR' && b.ref.kind === 'UNBOUND') {
        // mirror
        return unifyTypes(b, a);
    }
    if (a.kind === 'RECORD' && b.kind === 'RECORD') {
        unifyTypes(a.row, b.row);
        return;
    }
    if (a.kind === 'ROWEMPTY' && b.kind === 'ROWEMPTY') {
        return;
    }
    if (a.kind === 'ROWEXTEND' && b.kind === 'ROWEXTEND') {
        const { key: key1, field: field1, row: rest1 } = a;
        let restRow1TVarUnboundRef = rest1.kind === 'VAR' && rest1.ref.kind === 'UNBOUND' ? rest1 : null;
        const rest2 = rewriteRow(b, key1, field1);
        if (restRow1TVarUnboundRef?.ref.kind === 'LINK') {
            throw new UnificationError(`Recursive row types.`);
        }
        unifyTypes(rest1, rest2);
        return;
    }

    throw new UnificationError(`Cannot unify ${tyToString(a)} with ${tyToString(b)}.`);
}


function rewriteRow(row2: TExpr, key1: string, field1: TExpr): TExpr {
    if (row2.kind === 'ROWEMPTY') {
        throw new UnificationError(`Could not find row '${key1}'.`);
    }
    if (row2.kind === 'ROWEXTEND' && row2.key === key1) {
        unifyTypes(field1, row2.field);
        return row2.row;
    }
    if (row2.kind === 'ROWEXTEND') {
        // swap rows and recurse
        return {
            kind: 'ROWEXTEND',
            key: row2.key,
            field: row2.field,
            row: rewriteRow(row2.row, key1, field1)
        };
    }
    if (row2.kind === 'VAR' && row2.ref.kind === 'LINK') {
        return rewriteRow(row2.ref.type, key1, field1);
    }
    if (row2.kind === 'VAR' && row2.ref.kind === 'UNBOUND') {
        const restRow2 = newUnboundVar(row2.ref.level);
        const ty2: TExpr = { kind: 'ROWEXTEND', key: key1, field: field1, row: restRow2 };
        row2.ref = { kind: 'LINK', type: ty2 };
        return restRow2;
    }
    assert(false, `Row type expected.`);
}


function occursCheckAdjustLevels(ref: VarRefUnbound, ty: TExpr) {
    function f(ty: TExpr) {
        if (ty.kind === 'VAR' && ty.ref.kind === 'LINK') {
            return f(ty.ref.type);
        }
        if (ty.kind === 'VAR' && ty.ref.kind === 'GENERIC') {
            // generic must be instantiated when taken from env
            assert(false, 'uninstantiated generic');
        }
        if (ty.kind === 'VAR' && ty.ref.kind === 'UNBOUND') {
            assert(ty.ref.id !== ref.id, 'Recursive types.');
            if (ty.ref.level > ref.level) {
                ty.ref.level = ref.level;
            }
            return;
        }
        if (ty.kind === 'APP') {
            f(ty.head);
            f(ty.arg);
            // for (const arg of ty.arg) {
            //     f(arg);
            // }
            return;
        }
        if (ty.kind === 'ARROW') {
            f(ty.param);
            // for (const param of ty.param) {
            //     f(param);
            // }
            f(ty.ret);
            return;
        }
        if (ty.kind === 'RECORD') {
            f(ty.row);
            return;
        }
        if (ty.kind === 'ROWEXTEND') {
            f(ty.field);
            f(ty.row);
            return;
        }
        if (ty.kind === 'CONST' || ty.kind === 'ROWEMPTY') {
            return;
        }
        assert(false);
    }
    f(ty);
}

/**
 * Creates a copy of the given type where:
 * - all generic variables are replaced with fresh unbound variables of provided level.
 * - all links are resolved.
 */
export function instantiateType(level: number, ty: TExpr): TExpr {
    const idVarMap = new Map<number, TExpr>();
    const f = (ty: TExpr): TExpr => {
        switch (ty.kind) {
            case 'CONST':
            case 'ROWEMPTY':
                return ty;
            case 'VAR':
                if (ty.ref.kind === 'LINK') {
                    return f(ty.ref.type);
                }
                if (ty.ref.kind === 'GENERIC') {
                    const id = ty.ref.id;
                    if (idVarMap.has(id)) {
                        return idVarMap.get(id)!;
                    }
                    const newTy = newUnboundVar(level);
                    idVarMap.set(id, newTy);
                    return newTy;
                }
                return ty; // unbound
            case 'APP':
                return { kind: 'APP', head: f(ty.head), arg: f(ty.arg) };
            case 'ARROW':
                return { kind: 'ARROW', param: f(ty.param), ret: f(ty.ret) };
            case 'RECORD':
                return { kind: 'RECORD', row: f(ty.row) };
            case 'ROWEXTEND':
                return { kind: 'ROWEXTEND', key: ty.key, field: f(ty.field), row: f(ty.row) };
        }
        assert(false);
    }
    return f(ty);
}

/**
 * Returns a generalized type by replacing unbound variables above and excluding the given level with generic variables.
 */
export function generalizeType(level: number, ty: TExpr): TExpr {
    switch (ty.kind) {
        case 'APP':
            return { kind: 'APP', head: generalizeType(level, ty.head), arg: generalizeType(level, ty.arg) };
        case 'ARROW':
            return { kind: 'ARROW', param: generalizeType(level, ty.param), ret: generalizeType(level, ty.ret) };
        case 'RECORD':
            return { kind: 'RECORD', row: generalizeType(level, ty.row) };
        case 'ROWEXTEND':
            return { kind: 'ROWEXTEND', key: ty.key, field: generalizeType(level, ty.field), row: generalizeType(level, ty.row) };
        case 'VAR':
            if (ty.ref.kind === 'LINK') {
                return generalizeType(level, ty.ref.type);
            }
            if (ty.ref.kind === 'UNBOUND' && ty.ref.level > level) {
                return { kind: 'VAR', ref: { kind: 'GENERIC', id: ty.ref.id } };
            }
            return ty;
        case 'CONST':
        case 'ROWEMPTY':
            return ty;
    }
    assert(false);
}
/**
 * Returns a generalized type by replacing unbound variables above and excluding the given level with generic variables.
 */
export function generalizeInPlace(level: number, ty: TExpr): void {
    switch (ty.kind) {
        case 'APP':
            generalizeInPlace(level, ty.head);
            generalizeInPlace(level, ty.arg);
            return;
        case 'ARROW':
            generalizeInPlace(level, ty.param);
            generalizeInPlace(level, ty.ret);
            return;
        case 'RECORD':
            generalizeInPlace(level, ty.row);
            return;
        case 'ROWEXTEND':
            generalizeInPlace(level, ty.field);
            generalizeInPlace(level, ty.row);
            return;
        case 'VAR':
            if (ty.ref.kind === 'LINK') {
                generalizeInPlace(level, ty.ref.type);
            }
            else if (ty.ref.kind === 'UNBOUND' && ty.ref.level > level) {
                ty.ref = { kind: 'GENERIC', id: ty.ref.id };
            }
            return;
        case 'CONST':
        case 'ROWEMPTY':
            return;
    }
    assert(false);
}
