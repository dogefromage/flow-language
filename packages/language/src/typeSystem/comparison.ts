import { resolveTypeAlias } from "./resolution";
import { FlowEnvironment, FunctionTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, PrimitiveTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types";
import { TypeSystemException, TypeTreePath } from "./exceptionHandling";

export function isSubsetType(X: TypeSpecifier, Y: TypeSpecifier, env: FlowEnvironment) {
    try {
        assertSubsetType(X, Y, env);
    } catch (e) {
        if (e instanceof TypeSystemException) {
            return false;
        }
        throw e; // other error
    }
    return true;
}

/**
 * Throws TypeSystemException if X not subset of Y
 */
export function assertSubsetType(X: TypeSpecifier, Y: TypeSpecifier, env: FlowEnvironment) {
    return assertSubsetSwitch(new TypeTreePath(), X, Y, env);
}
function assertSubsetSwitch(path: TypeTreePath, X: TypeSpecifier, Y: TypeSpecifier, env: FlowEnvironment) {
    // base case for recursive definitions
    if (typeof X === 'string' && X === Y) {
        return;
    }
    X = resolveTypeAlias(path, X, env);
    Y = resolveTypeAlias(path, Y, env);

    const pathWithType = path.add({ key: X.type, formatting: 'type' });
    if (X.type === 'missing') {
        throw new TypeSystemException({
            type: 'required-type', 
            message: `Type is missing.`,
            path: pathWithType,
        });
    }

    if (X.type !== Y.type) {
        /**
         * implement: allow tuple to be subset of list if every element is
         */
        throw new TypeSystemException({
            type: 'incompatible-type', 
            message: `Type '${X.type}' is not compatible with expected type '${Y.type}'.`,
            path,
        });
    }
    switch (X.type) {
        case 'primitive':
            const yName =  (Y as PrimitiveTypeSpecifier).name;
            if (X.name !== yName) {
                throw new TypeSystemException({
                    type: 'incompatible-type', 
                    message: `Primitive type '${X.name}' gotten, '${yName}' expected.`,
                    path: pathWithType,
                });
            }
            return;
        case 'list':
            assertSubsetSwitch(path, X.element, (Y as ListTypeSpecifier).element, env);
            return;
        case 'tuple':
            assertSubsetTuple(pathWithType, X, Y as TupleTypeSpecifier, env);
            return;
        case 'map':
            assertSubsetMap(pathWithType, X, Y as MapTypeSpecifier, env);
            return;
        case 'function':
            assertSubsetFunction(pathWithType, X, Y as FunctionTypeSpecifier, env);
        case 'unknown':
            return;
        default:
            throw new Error(`Unknown type "${(X as any).type}"`);
    }
}

function assertSubsetTuple(path: TypeTreePath, X: TupleTypeSpecifier, Y: TupleTypeSpecifier, env: FlowEnvironment) {
    if (X.elements.length !== Y.elements.length) {
        throw new TypeSystemException({
            type: 'incompatible-type', 
            message: `A tuple with ${Y.elements.length} expected, only ${X.elements.length} were provided.`,
            path,
        });
    }
    for (let i = 0; i < X.elements.length; i++) {
        assertSubsetSwitch(path.add({ key: i.toString(), formatting: 'property' }), X.elements[i], Y.elements[i], env);
    }
}
function assertSubsetMap(path: TypeTreePath, X: MapTypeSpecifier, Y: MapTypeSpecifier, env: FlowEnvironment) {
    const gottenKeys = new Set(Object.keys(X.elements));
    for (const [key, type] of Object.entries(Y.elements)) {
        const propPath = path.add({ key, formatting: 'property' });
        const gottenType = X.elements[key];
        if (gottenType == null) {
            throw new TypeSystemException({
                type: 'incompatible-type', 
                message: `Object type is missing expected property '${key}'`,
                path: propPath,
            })
        }
        assertSubsetSwitch(propPath, gottenType, type, env);
        gottenKeys.delete(key);
    }
    // if (gottenKeys.size > 0) // allow since subset
}

function assertSubsetFunction(path: TypeTreePath, X: FunctionTypeSpecifier, Y: FunctionTypeSpecifier, env: FlowEnvironment) {
    assertSubsetMap(path.add({ key: 'parameter', formatting: 'property' }), X.parameter, Y.parameter, env);
    assertSubsetMap(path.add({ key: 'output', formatting: 'property' }), X.output, Y.output, env);
}

