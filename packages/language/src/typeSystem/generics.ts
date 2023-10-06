import { createAnyType, createFunctionType, createListType, createMapType, createReducedTemplateType, createTemplatedType, createTupleType } from ".";
import { FlowEnvironment } from "../types/context";
import { FunctionTypeSpecifier, GenericParameter, InstantiationConstraints, ListTypeSpecifier, MapTypeSpecifier, TemplatedTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types/typeSystem";
import { Obj } from "../types/utilTypes";
import { assertNever } from "../utils";
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
    restrictingGenerics: Set<string>,
    env: FlowEnvironment
): InstantiationMap {
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

    if (typeof restrictingType === 'string' && restrictingGenerics.has(restrictingType)) {
        // we cannot see further here
        return {};
    }

    initialType = resolveTypeAlias(path, initialType, env);
    restrictingType = resolveTypeAlias(path, restrictingType, env);

    const pathWithType = path.add({ key: initialType.type, formatting: 'type' });

    if (initialType.type === 'list' && restrictingType.type === 'tuple') {
        return mapTypeInferenceListTuple(pathWithType,
            initialType, restrictingType, freeGenerics, restrictingGenerics, env);
    }

    if (initialType.type !== restrictingType.type) {
        return {}; // cannot infer type if objects dont match, ignore
    }

    switch (initialType.type) {
        case 'list':
            return mapTypeInference(pathWithType,
                initialType.element, (restrictingType as ListTypeSpecifier).element, freeGenerics, restrictingGenerics, env);
        case 'tuple':
            return mapTypeInferenceTuple(pathWithType,
                initialType, restrictingType as TupleTypeSpecifier, freeGenerics, restrictingGenerics, env);
        case 'map':
            return mapTypeInferenceMap(pathWithType,
                initialType, restrictingType as MapTypeSpecifier, freeGenerics, restrictingGenerics, env);
        case 'function':
            return mapTypeInferenceFunction(pathWithType,
                initialType, restrictingType as FunctionTypeSpecifier, freeGenerics, restrictingGenerics, env);
        case 'primitive':
        case 'any':
            return {};
        default:
            throw new Error(`Unknown type "${(initialType as any).type}"`);
    }
}

function mapTypeInferenceListTuple(
    path: TypeTreePath, initialType: ListTypeSpecifier, restrictingType: TupleTypeSpecifier,
    freeGenerics: FreeGenericsMap, restrictingGenerics: Set<string>, env: FlowEnvironment
): InstantiationConstraints {
    return restrictingType.elements.map((Ri, i) => {
        const propPath = path.add({ key: i.toString(), formatting: 'property' });
        return mapTypeInference(propPath, initialType.element, Ri, freeGenerics, restrictingGenerics, env);
    }).reduce(combineInstantiation, {});
}
function mapTypeInferenceTuple(
    path: TypeTreePath, initialType: TupleTypeSpecifier, restrictingType: TupleTypeSpecifier,
    freeGenerics: FreeGenericsMap, restrictingGenerics: Set<string>, env: FlowEnvironment
): InstantiationConstraints {
    return zipInner(initialType.elements, restrictingType.elements)
        .map(([initI, restrI], i) => {
            const propPath = path.add({ key: i.toString(), formatting: 'property' });
            return mapTypeInference(propPath, initI, restrI, freeGenerics, restrictingGenerics, env);
        })
        .reduce(combineInstantiation, {});
}
function mapTypeInferenceMap(
    path: TypeTreePath, initialType: MapTypeSpecifier, restrictingType: MapTypeSpecifier,
    freeGenerics: FreeGenericsMap, restrictingGenerics: Set<string>, env: FlowEnvironment
): InstantiationConstraints {
    const gottenKeys = new Set(Object.keys(restrictingType.elements));
    const instantiations: InstantiationConstraints[] = [];
    for (const [key, initProp] of Object.entries(initialType.elements)) {
        const propPath = path.add({ key, formatting: 'property' });
        const restProp = restrictingType.elements[key];
        if (restProp == null) {
            continue; // dunno
        }
        instantiations.push(mapTypeInference(propPath, initProp, restProp, freeGenerics, restrictingGenerics, env));
        gottenKeys.delete(key);
    }
    return instantiations
        .reduce(combineInstantiation, {});
}
function mapTypeInferenceFunction(
    path: TypeTreePath, initialType: FunctionTypeSpecifier, restrictingType: FunctionTypeSpecifier,
    freeGenerics: FreeGenericsMap, restrictingGenerics: Set<string>, env: FlowEnvironment
): InstantiationConstraints {
    return [
        mapTypeInference(path.add({ key: 'parameter', formatting: 'property' }),
            initialType.parameter, restrictingType.parameter, freeGenerics, restrictingGenerics, env),
        mapTypeInference(path.add({ key: 'output', formatting: 'property' }),
            initialType.output, restrictingType.output, freeGenerics, restrictingGenerics, env),
    ].reduce(combineInstantiation, {});
}

function combineInstantiation(older: InstantiationConstraints, newer: InstantiationConstraints) {
    return { ...newer, ...older };
}

// export function findUsedGenerics(X: TypeSpecifier, possible: Set<string>, found: Set<string>) {
//     if (typeof X === 'string') {
//         if (possible.has(X)) {
//             found.add(X);
//         }
//         return;
//     }
//     switch (X.type) {
//         case 'function':
//             findUsedGenerics(X.parameter, possible, found);
//             findUsedGenerics(X.output, possible, found);
//             return;
//         case 'list':
//             findUsedGenerics(X.element, possible, found);
//             return;
//         case 'map':
//             for (const el of Object.values(X.elements)) {
//                 findUsedGenerics(el, possible, found);
//             }
//             return;
//         case 'tuple':
//             for (const el of X.elements) {
//                 findUsedGenerics(el, possible, found);
//             }
//             return;
//         case 'any':
//         case 'primitive':
//             return;
//     }
//     assertNever();
// }

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
        case 'any':
        case 'primitive':
            return X;
    }
    assertNever();
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
    instantiationMap: InstantiationMap, instantiationGenerics: GenericParameter[], 
    env: FlowEnvironment
): TemplatedTypeSpecifier<T> {
    // create map type for ease of use
    instantiationGenerics = instantiationGenerics.slice();
    let instantiation = createMapType(instantiationMap);
    // make generics of instantiation independent of templates generics
    const templateGenericNames = new Set(templatedType.generics.map(g => g.id));
    for (let i = 0; i < instantiationGenerics.length; i++) {
        const oldName = instantiationGenerics[i].id;
        if (templateGenericNames.has(oldName)) {
            // must be renamed
            const otherNames = new Set(instantiationGenerics.map(g => g.id));
            const allNames = new Set([...templateGenericNames, ...otherNames]);
            const newName = getNextTemplateLiteral(allNames);
            instantiation = substituteGeneric(instantiation, oldName, newName) as MapTypeSpecifier;
            instantiationGenerics[i] = { id: newName, constraint: instantiationGenerics[i].constraint };
        }
    }

    // from here on all generics are pairwise different

    const newGenerics = [ ...templatedType.generics, ...instantiationGenerics ];
    let finalSpecifier: TypeSpecifier = templatedType.specifier;

    // we dont need to remove unused generics here
    for (const [name, replacer] of Object.entries(instantiationMap)) {
        const generic = newGenerics.find(g => g.id === name);
        if (generic == null) {
            throw new TypeSystemException({ message: `Templated type does not contain generic named '${name}'.`, path });
        }
        finalSpecifier = substituteGeneric(finalSpecifier, name, replacer);
    }

    // for (const [name, replacer] of Object.entries(instantiationMap)) {
    //     const pos = newGenerics.findIndex(g => g.id === name);
    //     if (pos < 0) {
    //         throw new TypeSystemException({ message: `Templated type does not contain generic named '${name}'.`, path });
    //     }
    //     const generic = newGenerics[pos];
    //     newGenerics.splice(pos, 1);
    //     if (generic.constraint && !isSubsetType(replacer, generic.constraint, env)) {
    //         // TODO: if this will be shown to user often, catch path from isSubsetType error and pass on
    //         throw new TypeSystemException({ message: `Cannot instantiate generic '${name}'. Constraint not fulfilled.`, path });
    //     }
    //     finalSpecifier = substituteGeneric(finalSpecifier, name, replacer);
    // }
    
    // filter away unused generics using reduced constructor
    return createReducedTemplateType(
        newGenerics,
        finalSpecifier as T,
    );
}

function getNextTemplateLiteral(used: Set<string>) {
    for (let i = 0; i < 26; i++) {
        const lit = String.fromCharCode(65 + i);
        if (!used.has(lit)) {
            return lit;
        }
    }
    assertNever('now this is awkward');
}

export function disjoinTemplateLiterals(templates: TemplatedTypeSpecifier[]) {
    templates = templates.slice();
    const usedLiterals = new Set<string>();

    for (let i = 0; i < templates.length; i++) {
        let { specifier, generics } = templates[i];
        generics = generics.slice();
        for (let j = 0; j < generics.length; j++) {
            if (usedLiterals.has(generics[j].id)) {
                const newLiteral = getNextTemplateLiteral(usedLiterals);
                specifier = substituteGeneric(specifier, generics[j].id, newLiteral);
                generics[j] = { id: newLiteral, constraint: generics[j].constraint };
            }
            usedLiterals.add(generics[j].id);
        }
        templates[i] = createTemplatedType(generics, specifier);
    }
    return templates;
}