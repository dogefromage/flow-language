import { createFunctionType, createListType, createMapType, createTupleType } from ".";
import { FlowEnvironment } from "../types/context";
import { FunctionTypeSpecifier, InstantiationConstraints, ListTypeSpecifier, MapTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types/typeSystem";
import { TypeTreePath } from "./exceptionHandling";
import { resolveTypeAlias } from "./resolution";

/**
 * DFS of type tree, taking first instance of generic type which hasn't appeared yet:
 * 
 * obj {
 *  a: T[]    // <-- T inferred
 *  b: T[]    // <-- T known, ignored
 * }
 */
export const inferGenerics = (
    path: TypeTreePath,
    X: TypeSpecifier,
    G: TypeSpecifier,
    free: Set<string>,
    env: FlowEnvironment,
): InstantiationConstraints => {
    if (typeof G === 'string' && free.has(G)) {
        return { [G]: X };
    }

    X = resolveTypeAlias(path, X, env);
    G = resolveTypeAlias(path, G, env);

    if (X.type !== G.type) {
        return {}; // cannot infer type if objects dont match, ignore
    }

    const pathWithType = path.add({ key: X.type, formatting: 'type' });
    switch (X.type) {
        case 'list':
            return inferGenerics(path, X.element, (G as ListTypeSpecifier).element, free, env);
        case 'tuple':
            return inferGenericsTuple(pathWithType, X, G as TupleTypeSpecifier, free, env);
        case 'map':
            return inferGenericsMap(pathWithType, X, G as MapTypeSpecifier, free, env);
        case 'function':
            return inferGenericsFunction(pathWithType, X, G as FunctionTypeSpecifier, free, env);
        case 'missing':
        case 'primitive':
        case 'unknown':
            return {};
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}

function inferGenericsFunction(path: TypeTreePath,
    X: FunctionTypeSpecifier, G: FunctionTypeSpecifier, free: Set<string>, env: FlowEnvironment): InstantiationConstraints {
    return {
        ...inferGenerics(path.add({ key: 'output', formatting: 'property' }), X.output, G.output, free, env),
        ...inferGenerics(path.add({ key: 'parameter', formatting: 'property' }), X.parameter, G.parameter, free, env),
    };
}
function inferGenericsTuple(path: TypeTreePath, X: TupleTypeSpecifier, G: TupleTypeSpecifier, free: Set<string>, env: FlowEnvironment): InstantiationConstraints {
    let accumulator: InstantiationConstraints = {};
    const sharedLength = Math.min(X.elements.length, G.elements.length);
    for (let i = 0; i < sharedLength; i++) {
        const propPath = path.add({ key: i.toString(), formatting: 'property' });
        const propInference = inferGenerics(propPath, X.elements[i], G.elements[i], free, env);
        accumulator = { ...propInference, ...accumulator };
    }
    return accumulator;
}
function inferGenericsMap(path: TypeTreePath, X: MapTypeSpecifier, G: MapTypeSpecifier, free: Set<string>, env: FlowEnvironment): InstantiationConstraints {
    const gottenKeys = new Set(Object.keys(X.elements));
    let accumulator: InstantiationConstraints = {};
    for (const [key, type] of Object.entries(G.elements)) {
        const propPath = path.add({ key, formatting: 'property' });
        const gottenType = X.elements[key];
        if (gottenType == null) {
            continue; // dunno
        }
        const propInference = inferGenerics(propPath, gottenType, type, free, env);
        accumulator = { ...propInference, ...accumulator };
        gottenKeys.delete(key);
    }
    return accumulator;
}



export function applyInstantiationConstraints(
    path: TypeTreePath, X: TypeSpecifier, constraints: InstantiationConstraints, env: FlowEnvironment
): TypeSpecifier {
    if (typeof X === 'string' && constraints[X] != null) {
        return constraints[X];
    }

    X = resolveTypeAlias(path, X, env);

    const typePath = path.add({ key: X.type, formatting: 'type' });
    switch (X.type) {
        case 'list':
            return createListType(
                applyInstantiationConstraints(typePath, X.element, constraints, env)
            );
        case 'tuple':
            return createTupleType(
                ...X.elements.map((el, i) =>
                    applyInstantiationConstraints(typePath.add({ key: i.toString(), formatting: 'property' }), el, constraints, env)
                )
            );
        case 'map':
            return createMapType(
                Object.fromEntries(
                    Object.entries(X.elements).map(([key, prop]) => [
                        key,
                        applyInstantiationConstraints(typePath.add({ key, formatting: 'property' }), prop, constraints, env)
                    ])
                )
            );
        case 'function':
            return createFunctionType(
                applyInstantiationConstraints(path.add({ key: 'parameter', formatting: 'property' }), X.parameter, constraints, env) as MapTypeSpecifier,
                applyInstantiationConstraints(path.add({ key: 'output', formatting: 'property' }), X.output, constraints, env) as MapTypeSpecifier,
            );
        case 'missing':
        case 'primitive':
        case 'unknown':
            return X;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}