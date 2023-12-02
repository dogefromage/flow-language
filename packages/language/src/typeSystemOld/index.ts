import { AliasTypeSpecifier, AnyTypeSpecifier, FlowSignature, FunctionTypeSpecifier, GenericTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, PrimitiveTypeSpecifier, TemplateParameter, TemplatedTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types";
import { assertNever, assertTruthy } from "../utils";
import { ListCache } from "../utils/ListCache";
import { always } from "../utils/functional";
import { mem } from '../utils/mem';

export const createAnyType = always<AnyTypeSpecifier>({ type: 'any' })

export const createPrimitiveType =
    (name: string): PrimitiveTypeSpecifier => ({ type: 'primitive', name });

export const createListType =
    (element: TypeSpecifier): ListTypeSpecifier => ({ type: 'list', element });

export const createTupleType =
    (...elements: TypeSpecifier[]): TupleTypeSpecifier => ({ type: 'tuple', elements });

export const createMapType =
    (elements: Record<string, TypeSpecifier>): MapTypeSpecifier =>
        ({ type: 'map', elements });

export const createFunctionType =
    (parameter: TypeSpecifier, output: TypeSpecifier): FunctionTypeSpecifier =>
        ({ type: 'function', parameter, output });

export const createAliasType =
    (alias: string): AliasTypeSpecifier => ({ type: 'alias', alias });

export const createGenericType =
    (alias: string): GenericTypeSpecifier => ({ type: 'generic', alias });

export const createTemplatedType = <T extends TypeSpecifier>
    (specifier: T, ...generics: TemplateParameter[]): TemplatedTypeSpecifier<T> =>
    ({ generics, specifier });

export const createTemplateParameter =
    (id: string, constraint: TypeSpecifier | null): TemplateParameter =>
        ({ id, constraint });

const typeSystemCache = new ListCache(3037);

const createAnyTypeMemo = createAnyType; // no params
const createPrimitiveTypeMemo =     mem(createPrimitiveType,     typeSystemCache, { tag: 'createPrimitiveTypeMemo' });
const createListTypeMemo =          mem(createListType,          typeSystemCache, { tag: 'createListTypeMemo' });
const createTupleTypeMemo =         mem(createTupleType,         typeSystemCache, { tag: 'createTupleTypeMemo' });
const createFunctionTypeMemo =      mem(createFunctionType,      typeSystemCache, { tag: 'createFunctionTypeMemo' });
const createAliasTypeMemo =         mem(createAliasType,         typeSystemCache, { tag: 'createAliasTypeMemo' });
const createGenericTypeMemo =       mem(createGenericType,       typeSystemCache, { tag: 'createGenericTypeMemo' });
const createTemplatedTypeMemo =     mem(createTemplatedType,     typeSystemCache, { tag: 'createTemplatedTypeMemo' });
const createTemplateParameterMemo = mem(createTemplateParameter, typeSystemCache, { tag: 'createTemplateParameterMemo' });

const createMapFromFlatMemo = mem(
    (...flatEntries: (string | TypeSpecifier)[]): MapTypeSpecifier => {
        const map: MapTypeSpecifier = {
            type: 'map',
            elements: {},
        };
        assertTruthy(flatEntries.length % 2 == 0);
        for (let i = 0; i < flatEntries.length; i += 2) {
            const [key, value] = flatEntries.slice(i);
            assertTruthy(typeof key === 'string');
            map.elements[key as string] = value as TypeSpecifier;
        }
        return map;
    },
    typeSystemCache,
    { tag: 'createMapFromFlatMemo' },
);

/**
 * TODO 
 * write unit tests for this crap
 */
export const memoizePlainType = mem(<T extends TypeSpecifier>(X: T): T => {
    switch (X.type) {
        case 'any':
            return createAnyTypeMemo() as T;
        case 'primitive':
            return createPrimitiveTypeMemo(X.name) as T;
        case 'list':
            return createListTypeMemo(memoizePlainType(X.element)) as T;
        case 'tuple':
            return createTupleTypeMemo(...X.elements.map(Y => memoizePlainType(Y))) as T;
        case 'function':
            return createFunctionTypeMemo(
                memoizePlainType(X.parameter),
                memoizePlainType(X.output),
            ) as T;
        case 'alias':
            return createAliasTypeMemo(X.alias) as T;
        case 'generic':
            return createGenericTypeMemo(X.alias) as T;
        case 'map':
            return createMapFromFlatMemo(
                ...Object.entries(X.elements)
                    .map(([key, valueType]) => [key, memoizePlainType(valueType)] as const)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .flat()
            ) as T;
    }
    assertNever();
}, typeSystemCache, { tag: 'memoizePlainType' });

export const memoizeTemplatedType = <T extends TypeSpecifier>(X: TemplatedTypeSpecifier<T>): TemplatedTypeSpecifier<T> => {
    const memoizedGenerics = X.generics
        .map(g => createTemplateParameterMemo(
            g.id,
            g.constraint && memoizePlainType(g.constraint),
        ));
    return createTemplatedTypeMemo(
        memoizePlainType(X.specifier),
        ...memoizedGenerics,
    );
}

export function getTemplatedSignatureType(signature: FlowSignature): TemplatedTypeSpecifier<FunctionTypeSpecifier> {
    return {
        generics: signature.generics,
        specifier: getSignatureType(signature),
    };
}

function getSignatureType(signature: FlowSignature): FunctionTypeSpecifier {
    return (
        createFunctionType(
            createTupleType(
                ...signature.inputs.map(s => s.specifier)
            ),
            signature.output?.specifier || createAnyType(),
        )
    );
}

export function findAllGenericLiterals(X: TypeSpecifier, literals: Set<string>) {
    switch (X.type) {
        case 'generic':
            literals.add(X.alias);
            return;
        case 'function':
            findAllGenericLiterals(X.output, literals);
            findAllGenericLiterals(X.parameter, literals);
            return;
        case 'list':
            findAllGenericLiterals(X.element, literals);
            return;
        case 'tuple':
            for (const el of X.elements) {
                findAllGenericLiterals(el, literals);
            }
            return;
        case 'map':
            for (const el of Object.values(X.elements)) {
                findAllGenericLiterals(el, literals);
            }
            return;
        case 'any':
        case 'primitive':
        case 'alias':
            return;
    }
    assertNever();
}

export function createReducedTemplateType<T extends TypeSpecifier>(generics: TemplateParameter[], X: T) {
    const literals = new Set<string>()
    findAllGenericLiterals(X, literals);
    generics = generics.filter(X => literals.has(X.id));
    return createTemplatedType<T>(X, ...generics);
}
