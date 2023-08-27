import { FlowSignature } from "../types/signatures";
import { FunctionTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, MissingTypeSpecifier, PrimitiveTypeSpecifier, TupleTypeSpecifier, TypeSpecifier, AnyTypeSpecifier, UnionTypeSpecifier } from "../types/typeSystem";
import { assertTruthy } from "../utils";
import { ListCache } from "../utils/ListCache";
import { always, mem } from "../utils/functional";

export const typeSystemCache = new ListCache(3037);

const createConstantType = mem(
    <T extends string>(name: T) => ({ type: name }),
    typeSystemCache,
);

export const createMissingType = always<MissingTypeSpecifier>(createConstantType('missing'));
export const createAnyType = always<AnyTypeSpecifier>(createConstantType('any'));

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
export const createUnionType = mem(
    (...elements: TypeSpecifier[]): UnionTypeSpecifier => ({ type: 'union', elements }),
    typeSystemCache,
);
export const createFunctionType = mem(
    (parameter: MapTypeSpecifier, output: MapTypeSpecifier): FunctionTypeSpecifier => ({ type: 'function', parameter, output }),
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
        case 'missing':
        case 'any':
            return createConstantType(X.type) as T;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}, typeSystemCache);

export function getSignatureFunctionType(signature: FlowSignature) {
    return memoizeTypeStructure(
        createFunctionType(
            createMapType(
                Object.fromEntries(
                    signature.inputs.map(s => [s.id, s.specifier])
                )
            ),
            createMapType(
                Object.fromEntries(
                    signature.outputs.map(s => [s.id, s.specifier])
                )
            )
        )
    );
}
