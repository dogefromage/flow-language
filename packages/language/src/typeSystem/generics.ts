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
    map: InstantiationConstraints,
    env: FlowEnvironment,
): InstantiationConstraints => {
    if (typeof G === 'string' && map[G] != null) {
        return combineInstantiationConstraints(map, { [G]: X });
    }

    X = resolveTypeAlias(path, X, env);
    G = resolveTypeAlias(path, G, env);

    if (X.type !== G.type) {
        return map; // cannot infer type if objects dont match, ignore
    }

    const pathWithType = path.add({ key: X.type, formatting: 'type' });
    switch (X.type) {
        case 'list':
            return inferGenerics(path, X.element, (G as ListTypeSpecifier).element, map, env);
        case 'tuple':
            return inferGenericsTuple(pathWithType, X, G as TupleTypeSpecifier, map, env);
        case 'map':
            return inferGenericsMap(pathWithType, X, G as MapTypeSpecifier, map, env);
        case 'function':
            return inferGenericsFunction(pathWithType, X, G as FunctionTypeSpecifier, map, env);
        case 'missing':
        case 'primitive':
        case 'unknown':
            return map;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}

function inferGenericsFunction(path: TypeTreePath,
    X: FunctionTypeSpecifier, G: FunctionTypeSpecifier, map: InstantiationConstraints, env: FlowEnvironment): InstantiationConstraints {

    return [
        inferGenerics(path.add({ key: 'parameter', formatting: 'property' }), X.parameter, G.parameter, map, env),
        inferGenerics(path.add({ key: 'output', formatting: 'property' }), X.output, G.output, map, env),
    ].reduce(combineInstantiationConstraints, map);
}
function inferGenericsTuple(path: TypeTreePath, X: TupleTypeSpecifier, G: TupleTypeSpecifier, map: InstantiationConstraints, env: FlowEnvironment): InstantiationConstraints {
    const sharedLength = Math.min(X.elements.length, G.elements.length);
    for (let i = 0; i < sharedLength; i++) {
        const propPath = path.add({ key: i.toString(), formatting: 'property' });
        const propInference = inferGenerics(propPath, X.elements[i], G.elements[i], map, env);
        map = combineInstantiationConstraints(map, propInference);
    }
    return map;
}
function inferGenericsMap(path: TypeTreePath, X: MapTypeSpecifier, G: MapTypeSpecifier, map: InstantiationConstraints, env: FlowEnvironment): InstantiationConstraints {
    const gottenKeys = new Set(Object.keys(X.elements));
    for (const [key, type] of Object.entries(G.elements)) {
        const propPath = path.add({ key, formatting: 'property' });
        const gottenType = X.elements[key];
        if (gottenType == null) {
            continue; // dunno
        }
        const propInference = inferGenerics(propPath, gottenType, type, map, env);
        map = combineInstantiationConstraints(map, propInference);
        gottenKeys.delete(key);
    }
    return map;
}

function combineInstantiationConstraints(older: InstantiationConstraints, newer: InstantiationConstraints) {
    const combined: InstantiationConstraints = { ...older };
    for (const key of Object.keys(newer)) {
        const prev = combined[key];
        if (prev == null || typeof prev === 'string') {
            continue;
        }
        if (prev.type === 'missing' || prev.type === 'unknown') {
            combined[key] = newer[key];
        }
    }
    return combined;
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