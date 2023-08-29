import {
    createFunctionType,
    createListType,
    createMapType,
    createTupleType
} from '.';
import { isSubsetType } from '..';
import { FlowEnvironment } from '../types/context';
import {
    FunctionTypeSpecifier,
    InstantiationConstraints,
    ListTypeSpecifier,
    MapTypeSpecifier,
    TupleTypeSpecifier,
    TypeSpecifier
} from '../types/typeSystem';
import { Obj } from '../types/utilTypes';
import { zipInner } from '../utils/functional';
import { TypeTreePath } from './exceptionHandling';
import { resolveTypeAlias } from './resolution';

type GenericsMap = Obj<TypeSpecifier>;

/**
 * DFS of type tree, taking first instance of generic type which hasn't appeared yet:
 * 
 * obj {
 *  a: T[]    // <-- T inferred
 *  b: T[]    // <-- T known, ignored
 * }
 */
export const inferGenerics = (
    X: TypeSpecifier,
    G: TypeSpecifier,
    genericConstraints: GenericsMap,
    env: FlowEnvironment,
) => {
    const instantiated = inferGenericsSwitch(
        new TypeTreePath(),
        X, G, genericConstraints, env,
    );
    return combineInstantiation(
        instantiated,
        genericConstraints,
    )
}



const inferGenericsSwitch = (
    path: TypeTreePath,
    X: TypeSpecifier,
    G: TypeSpecifier,
    generics: GenericsMap,
    env: FlowEnvironment,
): InstantiationConstraints => {
    if (typeof G === 'string' && generics[G] != null) {
        const constraintType = generics[G];
        // missing is passed if no row connected. this ignores unconnected rows
        const isUseless = typeof X !== 'string' && X.type === 'missing';
        if (isUseless) {
            return {};
        }
        // if constraint is not fullfilled, return constraint such that comparison fails
        const constraintsNotFullfilled = constraintType != null && !isSubsetType(X, constraintType, env);
        if (constraintsNotFullfilled) {
            return { [G]: constraintType };
        }
        // valid inference
        return { [G]: X };
    }

    X = resolveTypeAlias(path, X, env);
    G = resolveTypeAlias(path, G, env);

    if (G.type === 'union') {
        return G.elements
            .map(Gi => inferGenericsSwitch(path, X, Gi, generics, env))
            .reduce(combineInstantiation, {});
    }

    const pathWithType = path.add({ key: X.type, formatting: 'type' });

    if (X.type === 'tuple' && G.type === 'list') {
        return inferGenericsTupleList(pathWithType, X, G, generics, env);
    }

    if (X.type !== G.type) {
        return {}; // cannot infer type if objects dont match, ignore
    }

    switch (X.type) {
        case 'list':
            return inferGenericsSwitch(path, X.element, (G as ListTypeSpecifier).element, generics, env);
        case 'tuple':
            return inferGenericsTuple(pathWithType, X, G as TupleTypeSpecifier, generics, env);
        case 'map':
            return inferGenericsMap(pathWithType, X, G as MapTypeSpecifier, generics, env);
        case 'function':
            return inferGenericsFunction(pathWithType, X, G as FunctionTypeSpecifier, generics, env);
        case 'missing':
        case 'primitive':
        case 'any':
            return {};
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}

function inferGenericsFunction(path: TypeTreePath, X: FunctionTypeSpecifier, G: FunctionTypeSpecifier, 
    generics: GenericsMap, env: FlowEnvironment): InstantiationConstraints {
    return [
        inferGenericsSwitch(path.add({ key: 'parameter', formatting: 'property' }), X.parameter, G.parameter, generics, env),
        inferGenericsSwitch(path.add({ key: 'output', formatting: 'property' }), X.output, G.output, generics, env),
    ].reduce(combineInstantiation, {});
}
function inferGenericsTuple(path: TypeTreePath, X: TupleTypeSpecifier, G: TupleTypeSpecifier, 
    generics: GenericsMap, env: FlowEnvironment): InstantiationConstraints {

    return zipInner(X.elements, G.elements)
        .map(([Xi, Gi], i) => {
            const propPath = path.add({ key: i.toString(), formatting: 'property' });
            return inferGenericsSwitch(propPath, Xi, Gi, generics, env);
        })
        .reduce(combineInstantiation, {});
}
function inferGenericsTupleList(path: TypeTreePath, X: TupleTypeSpecifier, G: ListTypeSpecifier, 
    generics: GenericsMap, env: FlowEnvironment): InstantiationConstraints {
    return X.elements.map((Xi, i) => {
            const propPath = path.add({ key: i.toString(), formatting: 'property' });
            return inferGenericsSwitch(propPath, Xi, G.element, generics, env);
        })
        .reduce(combineInstantiation, {});
}
function inferGenericsMap(path: TypeTreePath, X: MapTypeSpecifier, G: MapTypeSpecifier, 
    generics: GenericsMap, env: FlowEnvironment): InstantiationConstraints {
    const gottenKeys = new Set(Object.keys(X.elements));
    const instantiations: InstantiationConstraints[] = [];
    for (const [key, type] of Object.entries(G.elements)) {
        const propPath = path.add({ key, formatting: 'property' });
        const gottenType = X.elements[key];
        if (gottenType == null) {
            continue; // dunno
        }
        instantiations.push(inferGenericsSwitch(propPath, gottenType, type, generics, env));
        gottenKeys.delete(key);
    }
    return instantiations
        .reduce(combineInstantiation, {});
}

function combineInstantiation(older: InstantiationConstraints, newer: InstantiationConstraints) {
    return {
        ...newer,
        ...older,
    };
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
                applyInstantiationConstraints(path.add({ key: 'parameter', formatting: 'property' }), 
                    X.parameter, constraints, env),
                applyInstantiationConstraints(path.add({ key: 'output', formatting: 'property' }), 
                    X.output, constraints, env),
            );
        case 'missing':
        case 'primitive':
        case 'any':
            return X;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}