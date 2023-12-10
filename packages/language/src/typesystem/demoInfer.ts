
// function matchFunctionType(paramCount: number, ty: TExpr): TArrow {
//     if (ty.kind === 'ARROW') {
//         if (ty.param.length !== paramCount) {
//             throw new InferenceError(`Expected ${ty.param.length} parameters, got ${paramCount}.`);
//         }
//         return ty;
//     }
//     if (ty.kind === 'VAR') {
//         if (ty.ref.kind === 'LINK') {
//             return matchFunctionType(paramCount, ty.ref.type);
//         }
//         if (ty.ref.kind === 'UNBOUND') {
//             let level = ty.ref.level;
//             const newParams = new Array(paramCount)
//                 .fill(0)
//                 .map(() => newUnboundVar(level));
//             const newRet = newUnboundVar(level);
//             const arrowTy: TArrow = { kind: 'ARROW', param: newParams, ret: newRet };
//             ty.ref = { kind: 'LINK', type: arrowTy };
//             return arrowTy;
//         }
//     }
//     throw new InferenceError(`Expected a function.`);
// }



// export function demoInfer(env: TypeEnvironment, level: number, expr: DemoExpr): TExpr {
//     switch (expr.kind) {
//         case 'IDENTIFIER': {
//             if (env.has(expr.value)) {
//                 return instantiateType(level, env.get(expr.value));
//             }
//             throw new InferenceError(`Unknown identifier '${expr.value}'.`);
//         }
//         case 'LITERAL': {
//             return { kind: 'CONST', name: typeof expr.value };
//         }
//         case 'FUN': {
//             const paramTypes = expr.params.map(() => newUnboundVar(level));
//             const funcEnv = expr.params.reduce(
//                 (envAcc, param, index) => envAcc.extend(param, paramTypes[index]),
//                 env
//             );
//             const returnTy = demoInfer(funcEnv, level, expr.body);
//             return { kind: 'ARROW', param: paramTypes, ret: returnTy };
//         }
//         case 'LET': {
//             const varTy = demoInfer(env, level + 1, expr.defn);
//             const generalTy = generalizeType(level, varTy);
//             const newEnv = env.extend(expr.x, generalTy);
//             return demoInfer(newEnv, level, expr.body);
//         }
//         case 'LETREC': {
//             const varTy = newUnboundVar(level);
//             const newEnv = env.extend(expr.x, varTy);
//             const defnTy = demoInfer(newEnv, level + 1, expr.defn);
//             const generalDefnTy = generalizeType(level, defnTy);
//             // if this fails try generalizing varTy instead of defnTy
//             unifyTypes(varTy, generalDefnTy);
//             return demoInfer(newEnv, level, expr.body);
//         }
//         case 'CALL': {
//             const headTy = demoInfer(env, level, expr.head);
//             const { param: params, ret } = matchFunctionType(expr.args.length, headTy);
//             for (let i = 0; i < expr.args.length; i++) {
//                 const argTy = demoInfer(env, level, expr.args[i]);
//                 unifyTypes(params[i], argTy);
//             }
//             return ret;
//         }
//         case 'RECORDEMPTY':
//             return { kind: 'RECORD', row: { kind: 'ROWEMPTY' } };
//         case 'RECORDSELECT': {
//             // (* inlined code for Call of function with type "forall[a r] {label : a | r} -> a" *)
//             const restRowTy = newUnboundVar(level);
//             const fieldTy = newUnboundVar(level);
//             const paramTy: TExpr = { kind: 'RECORD', row: { kind: 'ROWEXTEND', key: expr.key, field: fieldTy, row: restRowTy } };
//             unifyTypes(paramTy, demoInfer(env, level, expr.rec));
//             return fieldTy;
//         }
//         case 'RECORDRESTRICT':
//             // inlined code for Call of function with type "forall[a r] {label : a | r} -> {r}"
//             const restRowTy = newUnboundVar(level);
//             const fieldTy = newUnboundVar(level);
//             const paramTy: TExpr = { kind: 'RECORD', row: { kind: 'ROWEXTEND', key: expr.key, field: fieldTy, row: restRowTy } };
//             unifyTypes(paramTy, demoInfer(env, level, expr.rec));
//             return { kind: 'RECORD', row: restRowTy };
//         case 'RECORDEXTEND': {
//             // (* inlined code for Call of function with type "forall[a r] (a, {r}) -> {label : a | r}" *)
//             const fieldVar = newUnboundVar(level);
//             unifyTypes(fieldVar, demoInfer(env, level, expr.value));
//             const restRowVar = newUnboundVar(level);
//             unifyTypes({ kind: 'RECORD', row: restRowVar }, demoInfer(env, level, expr.rest));
//             return { kind: 'RECORD', row: { kind: 'ROWEXTEND', key: expr.key, field: fieldVar, row: restRowVar } };
//         }
//     }
//     assert(false);
// }
