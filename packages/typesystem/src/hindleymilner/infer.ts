import { Expr } from "../demolang/expr";
import { assert } from "../utils";
import { InferenceError, TArrow, Ty, TypeEnvironment, VarRefUnbound, newUnboundVar, tyToString } from "./types";

export function unify(a: Ty, b: Ty) {
    if (a === b) {
        return;
    }
    if (a.kind === 'CONST' && b.kind === 'CONST' && a.name === b.name) {
        return;
    }
    if (a.kind === 'APP' && b.kind === 'APP' && a.args.length === b.args.length) {
        unify(a.head, b.head);
        for (let i = 0; i < a.args.length; i++) {
            unify(a.args[i], b.args[i]);
        }
        return;
    }
    if (a.kind === 'ARROW' && b.kind === 'ARROW' && a.params.length === b.params.length) {
        for (let i = 0; i < a.params.length; i++) {
            unify(a.params[i], b.params[i]);
        }
        unify(a.ret, b.ret);
        return;
    }
    if (a.kind === 'VAR' && b.kind === 'VAR' && a.ref.kind === 'LINK' && b.ref.kind === 'LINK') {
        unify(a.ref.type, b.ref.type);
        return;
    }
    if (a.kind === 'VAR' && a.ref.kind === 'LINK') {
        unify(a.ref.type, b);
        return;
    }
    if (b.kind === 'VAR' && b.ref.kind === 'LINK') {
        unify(a, b.ref.type);
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
        return unify(b, a);
    }
    if (a.kind === 'RECORD' && b.kind === 'RECORD') {
        unify(a.row, b.row);
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
            throw new InferenceError(`Recursive row types.`);
        }
        unify(rest1, rest2);
        return;
    }

    throw new InferenceError(`Cannot unify ${tyToString(a)} with ${tyToString(b)}.`);
}


function rewriteRow(row2: Ty, key1: string, field1: Ty): Ty {
    if (row2.kind === 'ROWEMPTY') {
        throw new InferenceError(`Could not find row '${key1}'.`);
    }
    if (row2.kind === 'ROWEXTEND' && row2.key === key1) {
        unify(field1, row2.field);
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
        const ty2: Ty = { kind: 'ROWEXTEND', key: key1, field: field1, row: restRow2 };
        row2.ref = { kind: 'LINK', type: ty2 };
        return restRow2;
    }
    assert(false, `Row type expected.`);
}


function occursCheckAdjustLevels(ref: VarRefUnbound, ty: Ty) {
    function f(ty: Ty) {
        if (ty.kind === 'VAR' && ty.ref.kind === 'LINK') {
            return f(ty.ref.type);
        }
        if (ty.kind === 'VAR' && ty.ref.kind === 'GENERIC') {
            assert(false);
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
            for (const arg of ty.args) {
                f(arg);
            }
            return;
        }
        if (ty.kind === 'ARROW') {
            for (const param of ty.params) {
                f(param);
            }
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

function instantiate(level: number, ty: Ty): Ty {
    const idVarMap = new Map<number, Ty>();
    const f = (ty: Ty): Ty => {
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
                return { kind: 'APP', head: f(ty.head), args: ty.args.map(f) };
            case 'ARROW':
                return { kind: 'ARROW', params: ty.params.map(f), ret: f(ty.ret) };
            case 'RECORD':
                return { kind: 'RECORD', row: f(ty.row) };
            case 'ROWEXTEND':
                return { kind: 'ROWEXTEND', key: ty.key, field: f(ty.field), row: f(ty.row) };
        }
        assert(false);
    }
    return f(ty);
}

function generalize(level: number, ty: Ty): Ty {
    switch (ty.kind) {
        case 'APP':
            return { kind: 'APP', head: generalize(level, ty.head), args: ty.args.map(t => generalize(level, t)) };
        case 'ARROW':
            return { kind: 'ARROW', params: ty.params.map(t => generalize(level, t)), ret: generalize(level, ty.ret) };
        case 'RECORD':
            return { kind: 'RECORD', row: generalize(level, ty.row) };
        case 'ROWEXTEND':
            return { kind: 'ROWEXTEND', key: ty.key, field: generalize(level, ty.field), row: generalize(level, ty.row) };
        case 'VAR':
            if (ty.ref.kind === 'LINK') {
                return generalize(level, ty.ref.type);
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

function matchFunctionType(paramCount: number, ty: Ty): TArrow {
    if (ty.kind === 'ARROW') {
        if (ty.params.length !== paramCount) {
            throw new InferenceError(`Expected ${ty.params.length} parameters, got ${paramCount}.`);
        }
        return ty;
    }
    if (ty.kind === 'VAR') {
        if (ty.ref.kind === 'LINK') {
            return matchFunctionType(paramCount, ty.ref.type);
        }
        if (ty.ref.kind === 'UNBOUND') {
            let level = ty.ref.level;
            const newParams = new Array(paramCount)
                .fill(0)
                .map(() => newUnboundVar(level));
            const newRet = newUnboundVar(level);
            const arrowTy: TArrow = { kind: 'ARROW', params: newParams, ret: newRet };
            ty.ref = { kind: 'LINK', type: arrowTy };
            return arrowTy;
        }
    }
    throw new InferenceError(`Expected a function.`);
}

export function infer(env: TypeEnvironment, level: number, expr: Expr): Ty {
    switch (expr.kind) {
        case 'IDENTIFIER': {
            if (env.has(expr.value)) {
                return instantiate(level, env.get(expr.value));
            }
            throw new InferenceError(`Unknown identifier '${expr.value}'.`);
        }
        case 'LITERAL': {
            return { kind: 'CONST', name: typeof expr.value };
        }
        case 'FUN': {
            const paramTypes = expr.params.map(() => newUnboundVar(level));
            const funcEnv = expr.params.reduce(
                (envAcc, param, index) => envAcc.extend(param, paramTypes[index]),
                env
            );
            const returnTy = infer(funcEnv, level, expr.body);
            return { kind: 'ARROW', params: paramTypes, ret: returnTy };
        }
        case 'LET': {
            const varTy = infer(env, level + 1, expr.defn);
            const generalTy = generalize(level, varTy);
            const newEnv = env.extend(expr.x, generalTy);
            return infer(newEnv, level, expr.body);
        }
        case 'LETREC': {
            const varTy = newUnboundVar(level);
            const newEnv = env.extend(expr.x, varTy);
            const defnTy = infer(newEnv, level + 1, expr.defn);
            const generalDefnTy = generalize(level, defnTy);
            unify(varTy, generalDefnTy);
            return infer(newEnv, level, expr.body);
        }
        case 'CALL': {
            const headTy = infer(env, level, expr.head);
            const { params, ret } = matchFunctionType(expr.args.length, headTy);
            for (let i = 0; i < expr.args.length; i++) {
                const argTy = infer(env, level, expr.args[i]);
                unify(params[i], argTy);
            }
            return ret;
        }
        case 'RECORDEMPTY':
            return { kind: 'RECORD', row: { kind: 'ROWEMPTY' } };
        case 'RECORDSELECT': {
			// (* inlined code for Call of function with type "forall[a r] {label : a | r} -> a" *)
            const restRowTy = newUnboundVar(level);
            const fieldTy = newUnboundVar(level);
            const paramTy: Ty = { kind: 'RECORD', row: { kind: 'ROWEXTEND', key: expr.key, field: fieldTy, row: restRowTy } };
            unify(paramTy, infer(env, level, expr.rec));
            return fieldTy;
        }
        case 'RECORDRESTRICT':
			// inlined code for Call of function with type "forall[a r] {label : a | r} -> {r}"
            const restRowTy = newUnboundVar(level);
            const fieldTy = newUnboundVar(level);
            const paramTy: Ty = { kind: 'RECORD', row: { kind: 'ROWEXTEND', key: expr.key, field: fieldTy, row: restRowTy } };
            unify(paramTy, infer(env, level, expr.rec));
            return { kind: 'RECORD', row: restRowTy };
        case 'RECORDEXTEND': {
			// (* inlined code for Call of function with type "forall[a r] (a, {r}) -> {label : a | r}" *)
            const fieldVar = newUnboundVar(level);
            unify(fieldVar, infer(env, level, expr.value));
            const restRowVar = newUnboundVar(level);
            unify({ kind: 'RECORD', row: restRowVar }, infer(env, level, expr.rest));
            return { kind: 'RECORD', row: { kind: 'ROWEXTEND', key: expr.key, field: fieldVar, row: restRowVar } };
        }
    }
    assert(false);
}