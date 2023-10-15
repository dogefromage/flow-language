import { FlowSignature } from "../types/signatures";
import { AliasTypeSpecifier, AnyTypeSpecifier, FunctionTypeSpecifier, GenericTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, PrimitiveTypeSpecifier, TemplateParameter, TemplatedTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types/typeSystem";
import { assertNever, assertTruthy } from "../utils";
import { ListCache } from "../utils/ListCache";
import { always, mem, memoList } from "../utils/functional";

export const typeSystemCache = new ListCache(3037);

export const createAnyType = always<AnyTypeSpecifier>({ type: 'any' })

export const createPrimitiveType = mem(
    (name: string): PrimitiveTypeSpecifier => ({ type: 'primitive', name }),
    typeSystemCache,
);
export const createListType = mem(
    (element: TypeSpecifier): ListTypeSpecifier => ({ type: 'list', element }),
    typeSystemCache,
);
export const createTupleType = mem(
    (...elements: TypeSpecifier[]): TupleTypeSpecifier => ({ type: 'tuple', elements }),
    typeSystemCache,
);
export const createFunctionType = mem(
    (parameter: TypeSpecifier, output: TypeSpecifier): FunctionTypeSpecifier => ({ type: 'function', parameter, output }),
    typeSystemCache,
);
export const createAliasType = mem(
    (alias: string): AliasTypeSpecifier => ({ type: 'alias', alias }),
    typeSystemCache,
);
export const createGenericType = mem(
    (alias: string): GenericTypeSpecifier => ({ type: 'generic', alias }),
    typeSystemCache,
);

export const createMapFromFlat = mem(
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
);
export const createMapType = (elements: Record<string, TypeSpecifier>) => {
    const flatEntries = Object.entries(elements).flat();
    return createMapFromFlat(...flatEntries);
}

export const createTemplateParameter = mem(
    (id: string, constraint: TypeSpecifier | null): TemplateParameter => ({ id, constraint }),
    typeSystemCache,
)

export const createTemplatedType = mem(
    <T extends TypeSpecifier>(generics: TemplateParameter[], specifier: T
    ): TemplatedTypeSpecifier<T> => ({ generics, specifier }),
    typeSystemCache,
)

// memoization does not guarantee uniqueness but helps if the exact same type is passed multiple times
export const memoizeTypeStructure = mem(<T extends TypeSpecifier>(X: T): T => {
    switch (X.type) {
        case 'tuple':
            return createTupleType(...X.elements.map(Y => memoizeTypeStructure(Y))) as T;
        case 'list':
            return createListType(memoizeTypeStructure(X.element)) as T;
        case 'map':
            return createMapFromFlat(
                ...Object.entries(X.elements)
                    .map(([key, valueType]) => [key, memoizeTypeStructure(valueType)] as const)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .flat()
            ) as T;
        case 'function':
            return createFunctionType(
                memoizeTypeStructure(X.parameter),
                memoizeTypeStructure(X.output),
            ) as T;
        case 'primitive':
            return createPrimitiveType(X.name) as T;
        case 'any':
            return createAnyType() as T;
        case 'alias':
            return createAliasType(X.alias) as T;
        case 'generic':
            return createGenericType(X.alias) as T;
    }
    assertNever();
}, typeSystemCache);

export const memoizeTemplatedType = <T extends TypeSpecifier>(X: TemplatedTypeSpecifier<T>): TemplatedTypeSpecifier<T> => {
    const memGenerics = memoList(...X.generics
        .map(g => createTemplateParameter(
            g.id,
            g.constraint && memoizeTypeStructure(g.constraint),
        ))
    );
    return createTemplatedType(
        memGenerics,
        memoizeTypeStructure(X.specifier),
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
    return createTemplatedType<T>(generics, X);
}
