import { createListType, createTupleType, createMapType, createFunctionType, createAnyType, createTemplatedType } from ".";
import { FlowEnvironment } from "../types/context";
import { TypeSpecifier, InstantiationConstraints, ListTypeSpecifier, TupleTypeSpecifier, MapTypeSpecifier, FunctionTypeSpecifier, TemplatedTypeSpecifier, GenericParameter } from "../types/typeSystem";
import { Obj } from "../types/utilTypes";
import { mapObj, zipInner } from "../utils/functional";
import { isSubsetType } from "./comparison";
import { TypeSystemException, TypeTreePath } from "./exceptionHandling";
import { resolveTypeAlias } from "./resolution";

type FreeGenericsMap = Obj<TypeSpecifier | null>;
type InstantiationMap = Obj<TypeSpecifier>;

export function mapTypeInference(
    path: TypeTreePath,
    initialType: TypeSpecifier,
    restrictingType: TypeSpecifier,
    freeGenerics: FreeGenericsMap,
    env: FlowEnvironment
): InstantiationMap {
    // debugger

    if (typeof initialType === 'string' && typeof freeGenerics[initialType] !== 'undefined') {
        const constrainingType = freeGenerics[initialType];
        // if constraint is not fullfilled, return constraint such that comparison fails
        const constraintsNotFullfilled = constrainingType != null && !isSubsetType(restrictingType, constrainingType, env);
        if (constraintsNotFullfilled) {
            return { [initialType]: constrainingType };
        }
        // possible mapping
        return { [initialType]: restrictingType };
    }

    initialType = resolveTypeAlias(path, initialType, env);
    restrictingType = resolveTypeAlias(path, restrictingType, env);

    const pathWithType = path.add({ key: initialType.type, formatting: 'type' });

    if (initialType.type === 'list' && restrictingType.type === 'tuple') {
        return mapTypeInferenceListTuple(pathWithType,
            initialType, restrictingType, freeGenerics, env);
    }

    if (initialType.type !== restrictingType.type) {
        return {}; // cannot infer type if objects dont match, ignore
    }

    switch (initialType.type) {
        case 'list':
            return mapTypeInference(pathWithType,
                initialType.element, (restrictingType as ListTypeSpecifier).element, freeGenerics, env);
        case 'tuple':
            return mapTypeInferenceTuple(pathWithType,
                initialType, restrictingType as TupleTypeSpecifier, freeGenerics, env);
        case 'map':
            return mapTypeInferenceMap(pathWithType,
                initialType, restrictingType as MapTypeSpecifier, freeGenerics, env);
        case 'function':
            return mapTypeInferenceFunction(pathWithType,
                initialType, restrictingType as FunctionTypeSpecifier, freeGenerics, env);
        case 'primitive':
        case 'any':
            return {};
        default:
            throw new Error(`Unknown type "${(initialType as any).type}"`);
    }
}

function mapTypeInferenceListTuple(
    path: TypeTreePath, initialType: ListTypeSpecifier, restrictingType: TupleTypeSpecifier,
    freeGenerics: FreeGenericsMap, env: FlowEnvironment
): InstantiationConstraints {
    return restrictingType.elements.map((Ri, i) => {
        const propPath = path.add({ key: i.toString(), formatting: 'property' });
        return mapTypeInference(propPath, initialType.element, Ri, freeGenerics, env);
    }).reduce(combineInstantiation, {});
}
function mapTypeInferenceTuple(
    path: TypeTreePath, initialType: TupleTypeSpecifier, restrictingType: TupleTypeSpecifier,
    freeGenerics: FreeGenericsMap, env: FlowEnvironment
): InstantiationConstraints {
    return zipInner(initialType.elements, restrictingType.elements)
        .map(([initI, restrI], i) => {
            const propPath = path.add({ key: i.toString(), formatting: 'property' });
            return mapTypeInference(propPath, initI, restrI, freeGenerics, env);
        })
        .reduce(combineInstantiation, {});
}
function mapTypeInferenceMap(
    path: TypeTreePath, initialType: MapTypeSpecifier, restrictingType: MapTypeSpecifier,
    freeGenerics: FreeGenericsMap, env: FlowEnvironment
): InstantiationConstraints {
    const gottenKeys = new Set(Object.keys(restrictingType.elements));
    const instantiations: InstantiationConstraints[] = [];
    for (const [key, initProp] of Object.entries(initialType.elements)) {
        const propPath = path.add({ key, formatting: 'property' });
        const restProp = restrictingType.elements[key];
        if (restProp == null) {
            continue; // dunno
        }
        instantiations.push(mapTypeInference(propPath, initProp, restProp, freeGenerics, env));
        gottenKeys.delete(key);
    }
    return instantiations
        .reduce(combineInstantiation, {});
}
function mapTypeInferenceFunction(
    path: TypeTreePath, initialType: FunctionTypeSpecifier, restrictingType: FunctionTypeSpecifier,
    freeGenerics: FreeGenericsMap, env: FlowEnvironment
): InstantiationConstraints {
    return [
        mapTypeInference(path.add({ key: 'parameter', formatting: 'property' }),
            initialType.parameter, restrictingType.parameter, freeGenerics, env),
        mapTypeInference(path.add({ key: 'output', formatting: 'property' }),
            initialType.output, restrictingType.output, freeGenerics, env),
    ].reduce(combineInstantiation, {});
}

function combineInstantiation(older: InstantiationConstraints, newer: InstantiationConstraints) {
    return { ...newer, ...older };
}

export function findUsedGenerics(X: TypeSpecifier, possible: Set<string>, found: Set<string>) {
    if (typeof X === 'string') {
        if (possible.has(X)) {
            found.add(X);
        }
        return;
    }
    switch (X.type) {
        case 'function':
            findUsedGenerics(X.parameter, possible, found);
            findUsedGenerics(X.output, possible, found);
            return;
        case 'list':
            findUsedGenerics(X.element, possible, found);
            return;
        case 'map':
            for (const el of Object.values(X.elements)) {
                findUsedGenerics(el, possible, found);
            }
            return;
        case 'tuple':
            for (const el of X.elements) {
                findUsedGenerics(el, possible, found);
            }
            return;
    }
}

export function substituteGeneric(X: TypeSpecifier, oldName: string, newType: TypeSpecifier): TypeSpecifier {
    if (typeof X === 'string') {
        return X === oldName ? newType : X;
    }
    switch (X.type) {
        case 'function':
            return createFunctionType(
                substituteGeneric(X.parameter, oldName, newType),
                substituteGeneric(X.output, oldName, newType),
            );
        case 'list':
            return createListType(
                substituteGeneric(X.element, oldName, newType),
            );
        case 'map':
            return createMapType(
                mapObj(X.elements, T => substituteGeneric(T, oldName, newType)),
            );
        case 'tuple':
            return createTupleType(
                ...X.elements.map(T => substituteGeneric(T, oldName, newType)),
            );
    }
    return X;
}

export function closeTemplatedSpecifier<X extends TypeSpecifier>(T: TemplatedTypeSpecifier<X>) {
    let spec: TypeSpecifier = T.specifier;
    for (const generic of T.generics) {
        spec = substituteGeneric(spec, generic.id, generic.constraint || createAnyType());
    }
    return spec as X;
}

export function instantiateTemplatedType<T extends TypeSpecifier>(
    path: TypeTreePath, templatedType: TemplatedTypeSpecifier<T>,
    constraintMap: InstantiationMap, env: FlowEnvironment
) {
    let generics = templatedType.generics.slice();
    let finalSpecifier: TypeSpecifier = templatedType.specifier;

    for (const [name, replacer] of Object.entries(constraintMap)) {
        const pos = generics.findIndex(g => g.id === name);
        if (pos < 0) {
            throw new TypeSystemException({ message: `Templated type does not contain generic named '${name}'.`, path });
        }
        const generic = generics[pos];
        generics.splice(pos, 1);

        if (generic.constraint && !isSubsetType(replacer, generic.constraint, env)) {
            // TODO: if this will be shown to user often, catch path from isSubsetType error and pass on
            throw new TypeSystemException({ message: `Cannot instantiate generic '${name}'. Constraint not fulfilled.`, path });
        }

        finalSpecifier = substituteGeneric(finalSpecifier, name, replacer);
    }
    return createTemplatedType(
        generics,
        finalSpecifier as T,
    );
}






// export function applyInstantiationConstraints(
//     path: TypeTreePath, X: TypeSpecifier, constraints: InstantiationConstraints, env: FlowEnvironment
// ): TypeSpecifier {
//     if (typeof X === 'string' && constraints[X] != null) {
//         return constraints[X];
//     }

//     X = resolveTypeAlias(path, X, env);

//     const typePath = path.add({ key: X.type, formatting: 'type' });
//     switch (X.type) {
//         case 'list':
//             return createListType(
//                 applyInstantiationConstraints(typePath, X.element, constraints, env)
//             );
//         case 'tuple':
//             return createTupleType(
//                 ...X.elements.map((el, i) =>
//                     applyInstantiationConstraints(typePath.add({ key: i.toString(), formatting: 'property' }), el, constraints, env)
//                 )
//             );
//         case 'map':
//             return createMapType(
//                 Object.fromEntries(
//                     Object.entries(X.elements).map(([key, prop]) => [
//                         key,
//                         applyInstantiationConstraints(typePath.add({ key, formatting: 'property' }), prop, constraints, env)
//                     ])
//                 )
//             );
//         case 'function':
//             return createFunctionType(
//                 applyInstantiationConstraints(path.add({ key: 'parameter', formatting: 'property' }),
//                     X.parameter, constraints, env),
//                 applyInstantiationConstraints(path.add({ key: 'output', formatting: 'property' }),
//                     X.output, constraints, env),
//             );
//         // case 'missing':
//         case 'primitive':
//         case 'any':
//             return X;
//         default:
//             throw new Error(`Unknown type "${(X as any).type}"`);
//     }
// }