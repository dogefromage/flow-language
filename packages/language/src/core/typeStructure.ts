import { ArrayTypeSpecifier, FlowEnvironment, ListTypeSpecifier, MapTypeSpecifier, TypeSpecifier } from "../types";
import { assertTruthy } from "../utils";
import { freezeResult, memoizeMulti } from "../utils/functional";
import { findEnvironmentType } from "./environment";

const createList = memoizeMulti(freezeResult(
    (elementType: TypeSpecifier): ListTypeSpecifier =>
        ({ type: 'list', elementType })
));

const createArray = memoizeMulti(freezeResult(
    (elementType: TypeSpecifier, length: number): ArrayTypeSpecifier =>
        ({ type: 'array', elementType, length })
));


const _createMap = memoizeMulti(freezeResult(
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
));
const createMap = (elements: Record<string, TypeSpecifier>) => {
    const flatEntries = Object.entries(elements).flat();
    return _createMap(flatEntries);
}

export const types = {
    createList,
    createArray,
    createMap,
};

// memoization does not guarantee uniqueness but helps if the exact same type is passed multiple times
export const memoizeTypeStructure = memoizeMulti((equivalentType: TypeSpecifier): TypeSpecifier => {
    if (typeof equivalentType !== 'object' || 
        equivalentType == null
    ) {
        return equivalentType;
    }

    switch (equivalentType.type) {
        case 'array':
            return createArray(
                memoizeTypeStructure(equivalentType.elementType),
                equivalentType.length,
            );
        case 'list':
            return createList(
                memoizeTypeStructure(equivalentType.elementType),
            );
        case 'map':
            const uniqueEntries = Object.entries(equivalentType.elements)
                .map(([key, valueType]) => {
                    return [key, memoizeTypeStructure(valueType)];
                })
            return _createMap(uniqueEntries.flat());
        default:
            throw new Error(`Unknown type "${(equivalentType as any).type}"`);
    }
});

export function resolveReferences(path: TypeTreePath, typeSpecifier: TypeSpecifier, env: FlowEnvironment): Exclude<TypeSpecifier, string> {
    if (typeof typeSpecifier !== 'string') {
        return typeSpecifier;
    }

    const envType = findEnvironmentType(env, typeSpecifier);
    const namedTypePath = path.add(typeSpecifier);
    if (!envType) {
        throw new FlowTypeComparisonException('unknown-reference', namedTypePath);
    }
    // TODO add recursion base case
    return resolveReferences(namedTypePath, envType, env);
}


export class TypeTreePath {
    constructor(
        private path: string[] = []
    ) {}

    public add(element: string) {
        return new TypeTreePath([...this.path, element]);
    }

    public toArray() {
        return this.path.slice();
    }
}

export class FlowTypeComparisonException extends Error {
    constructor(
        public type: 'type-mismatch' | 'missing-element' | 'unknown-reference' | 'invalid-value',
        public path: TypeTreePath,
    ) {
        super(type);
    }

    toString() {
        return [
            `Type validation exception: ${this.type} @`,
            this.path.toString(),
        ].join('\n');
    }
}
