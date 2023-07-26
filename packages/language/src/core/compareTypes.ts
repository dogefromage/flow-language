import { ArrayTypeSpecifier, FlowEnvironment, ListTypeSpecifier, MapTypeSpecifier, TypeSpecifier } from "../types";
import { FlowTypeComparisonException, TypeTreePath, resolveReferences } from "./typeStructure";

export function areTypesCompatible(S: TypeSpecifier, T: TypeSpecifier, env: FlowEnvironment) {
    try {
        compareTypes(S, T, env);
    } catch (e) {
        if (e instanceof FlowTypeComparisonException) {
            return false;
        }
        throw e; // other error
    }
    return true;
}

export function compareTypes(gotten: TypeSpecifier, expected: TypeSpecifier, env: FlowEnvironment) {
    compareSwitch(new TypeTreePath(), gotten, expected, env);
}
function compareSwitch(path: TypeTreePath, gotten: TypeSpecifier, expected: TypeSpecifier, env: FlowEnvironment) {
    // both same reference
    if (typeof gotten === 'string' &&
        typeof expected === 'string' &&
        gotten === expected) {
        return;
    }
    gotten = resolveReferences(path, gotten, env);
    expected = resolveReferences(path, expected, env);

    if (typeof gotten !== typeof expected) {
        throw new FlowTypeComparisonException('type-mismatch', new TypeTreePath());
    }
    if (typeof gotten === 'symbol' || typeof expected === 'symbol') {
        comparePrimitive(path, gotten as symbol, expected as symbol, env);
        return;
    }

    if (gotten == null || expected == null) {
        return null;
    }
 
    if (gotten.type !== expected.type) {
        throw new FlowTypeComparisonException('type-mismatch', new TypeTreePath());
    }
    const pathWithType = path.add(gotten.type);
    switch (gotten.type) {
        case 'list':
            compareList(pathWithType, gotten, expected as ListTypeSpecifier, env);
            break;
        case 'array':
            compareArray(pathWithType, gotten, expected as ArrayTypeSpecifier, env);
            break;
        case 'map':
            compareMap(pathWithType, gotten, expected as MapTypeSpecifier, env);
            break;
        default:
            throw new Error(`Unknown type "${(gotten as any).type}"`);
    }
}
function comparePrimitive(path: TypeTreePath, gotten: symbol, expected: symbol, env: FlowEnvironment) {
    if (gotten !== expected) {
        throw new FlowTypeComparisonException('type-mismatch', path.add('primitive'));
    }
}
function compareList(path: TypeTreePath, gotten: ListTypeSpecifier, expected: ListTypeSpecifier, env: FlowEnvironment) {
    compareSwitch(path.add('elementType'), gotten.elementType, expected.elementType, env);
}
function compareArray(path: TypeTreePath, gotten: ArrayTypeSpecifier, expected: ArrayTypeSpecifier, env: FlowEnvironment) {
    if (gotten.length !== expected.length) {
        throw new FlowTypeComparisonException('type-mismatch', path.add('length'));
    }
    compareSwitch(path.add('elementType'), gotten.elementType, expected.elementType, env);
}
function compareMap(basePath: TypeTreePath, gotten: MapTypeSpecifier, expected: MapTypeSpecifier, env: FlowEnvironment) {
    const elementsPath = basePath.add('elements');
    const gottenKeys = new Set(Object.keys(gotten.elements));
    for (const [expectedKey, expectedType] of Object.entries(expected)) {
        const expectedElementPath = elementsPath.add(expectedKey);
        const gottenType = gotten.elements[expectedKey];
        if (gottenType == null) {
            throw new FlowTypeComparisonException('missing-element', expectedElementPath);
        }
        compareSwitch(expectedElementPath, gottenType, expectedType, env);
        gottenKeys.delete(expectedKey);
    }
    if (gottenKeys.size > 0) {
        // wanted behaviour?
    }
}
