import { FlowSignature } from "../types/signatures";
import { AnyTypeSpecifier, FunctionTypeSpecifier, GenericParameter, ListTypeSpecifier, MapTypeSpecifier, PrimitiveTypeSpecifier, TemplatedTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types/typeSystem";
import { assertNever, assertTruthy } from "../utils";
import { ListCache } from "../utils/ListCache";
import { always, mem, memoList } from "../utils/functional";

export const typeSystemCache = new ListCache(3037);

const createConstantTypeSingle = <T>(name: T) => ({ type: name });
// export const createMissingType = always<MissingTypeSpecifier>(createConstantTypeSingle('missing'));
export const createAnyType = always<AnyTypeSpecifier>(createConstantTypeSingle('any'));

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
// export const createUnionType = mem(
//     (...elements: TypeSpecifier[]): UnionTypeSpecifier => ({ type: 'union', elements }),
//     typeSystemCache,
// );
export const createFunctionType = mem(
    (parameter: TypeSpecifier, output: TypeSpecifier): FunctionTypeSpecifier => ({ type: 'function', parameter, output }),
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

export const createGenericParameter = mem(
    (id: string, constraint: TypeSpecifier | null): GenericParameter => ({ id, constraint }),
    typeSystemCache,
)

export const createTemplatedType = mem(
    <T extends TypeSpecifier>(generics: GenericParameter[], specifier: T
        ): TemplatedTypeSpecifier<T> => ({ generics, specifier }),
    typeSystemCache,
)

// memoization does not guarantee uniqueness but helps if the exact same type is passed multiple times
export const memoizeTypeStructure = mem(<T extends TypeSpecifier>(X: T): T => {
    if (typeof X !== 'object' || X == null) {
        return X;
    }
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
        // case 'missing':
        case 'any':
            return createConstantTypeSingle(X.type) as T;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}, typeSystemCache);

export const memoizeTemplatedType = <T extends TypeSpecifier>(X: TemplatedTypeSpecifier<T>): TemplatedTypeSpecifier<T> => {
    const memGenerics = memoList(...X.generics
        .map(g => createGenericParameter(
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

export function findAllTypeLiterals(X: TypeSpecifier, literals: Set<string>) {
    if (typeof X === 'string') {
        literals.add(X);
        return;
    }

    switch (X.type) {
        case 'function':
            findAllTypeLiterals(X.output, literals);
            findAllTypeLiterals(X.parameter, literals);
            return;
        case 'list':
            findAllTypeLiterals(X.element, literals);
            return;
        case 'tuple':
            for (const el of X.elements) {
                findAllTypeLiterals(el, literals);
            }
            return;
        case 'map':
            for (const el of Object.values(X.elements)) {
                findAllTypeLiterals(el, literals);
            }
            return;
        case 'any':
        case 'primitive':
            return;
    }
    assertNever();
}

export function createReducedTemplateType<T extends TypeSpecifier>(generics: GenericParameter[], X: T) {
    const literals = new Set<string>()
    findAllTypeLiterals(X, literals);
    generics = generics.filter(X => literals.has(X.id));
    return createTemplatedType<T>(generics, X);
}

// export function mapTemplate<T extends TypeSpecifier>(
//     X: TemplatedTypeSpecifier<T>, 
//     op: (T: TypeSpecifier) => TypeSpecifier,
// ) {
//     return createReducedTemplateType(X.generics, op(X.specifier));
// }