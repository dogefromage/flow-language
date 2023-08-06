import { FunctionTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, MissingTypeSpecifier, PrimitiveTypeSpecifier, TupleTypeSpecifier, TypeSpecifier, UnknownTypeSpecifier } from "../types/typeSystem";
import { assertTruthy } from "../utils";
import { always, memFreeze } from "../utils/functional";

const createConstantType = memFreeze(<T extends string>(name: T) => ({ type: name }));

export const createMissingType = always<MissingTypeSpecifier>(createConstantType('missing'));
export const createUnknownType = always<UnknownTypeSpecifier>(createConstantType('unknown'));

export const createPrimitiveType = memFreeze(
    (name: string): PrimitiveTypeSpecifier => ({ type: 'primitive', name })
);
export const createListType = memFreeze(
    (element: TypeSpecifier): ListTypeSpecifier => ({ type: 'list', element })
);
export const createTupleType = memFreeze(
    (...elements: TypeSpecifier[]): TupleTypeSpecifier => ({ type: 'tuple', elements })
);
export const createFunctionType = memFreeze(
    (parameter: MapTypeSpecifier, output: MapTypeSpecifier): FunctionTypeSpecifier => ({ type: 'function', parameter, output })
);

export const createMapFromFlat = memFreeze(
    (flatEntries: (string | TypeSpecifier)[]): MapTypeSpecifier => {
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
    }
);
export const createMapType = (elements: Record<string, TypeSpecifier>) => {
    const flatEntries = Object.entries(elements).flat();
    return createMapFromFlat(flatEntries);
}

// memoization does not guarantee uniqueness but helps if the exact same type is passed multiple times
export const memoizeTypeStructure = memFreeze(<T extends TypeSpecifier>(X: T): T => {
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
                Object.entries(X.elements)
                    .map(([key, valueType]) => [key, memoizeTypeStructure(valueType)])
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
        case 'unknown':
            return createConstantType(X.type) as T;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
});