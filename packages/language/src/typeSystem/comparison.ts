import { FlowEnvironment, FunctionTypeSpecifier, GenericTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, PrimitiveTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types";
import { assertNever } from "../utils";
import { TypeSystemException, TypeTreePath } from "./exceptionHandling";
import { resolveTypeAlias } from "./resolution";

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
function assertSubsetSwitch(path: TypeTreePath, argX: TypeSpecifier, argY: TypeSpecifier, env: FlowEnvironment) {
    // base case for recursive definitions
    if (argX.type === 'alias' && 
        argY.type === 'alias' && 
        argX.alias === argY.alias) {
        return;
    }
    const X = resolveTypeAlias(path, argX, env);
    const Y = resolveTypeAlias(path, argY, env);

    const pathWithTypeX = path.add({ key: X.type, formatting: 'type' });

    if (X.type === 'any' || Y.type === 'any') {
        return;
    }

    // special case
    if (X.type === 'tuple' && Y.type === 'list') {
        for (let i = 0; i < X.elements.length; i++) {
            assertSubsetSwitch(path.add({ key: i.toString(), formatting: 'property' }), X.elements[i], Y.element, env);
        }
        return;
    }

    if (X.type !== Y.type) {
        throw new TypeSystemException({
            type: 'incompatible-type',
            message: `Type '${X.type}' is not compatible with expected type '${Y.type}'.`,
            path,
        });
    }
    switch (X.type) {
        case 'primitive':
            const yName = (Y as PrimitiveTypeSpecifier).name;
            if (X.name !== yName) {
                throw new TypeSystemException({
                    type: 'incompatible-type',
                    message: `Primitive type '${X.name}' gotten, '${yName}' expected.`,
                    path: pathWithTypeX,
                });
            }
            return;
        case 'generic':
            const Yg = (Y as GenericTypeSpecifier);
            if (X.alias !== Yg.alias) {
                throw new TypeSystemException({
                    type: 'incompatible-type',
                    message: `Generic type '${X.alias}' gotten, '${Yg.alias}' expected.`,
                    path: pathWithTypeX,
                });
            }
            return;
        case 'list':
            assertSubsetSwitch(path, X.element, (Y as ListTypeSpecifier).element, env);
            return;
        case 'tuple':
            assertSubsetTuple(pathWithTypeX, X, Y as TupleTypeSpecifier, env);
            return;
        case 'map':
            assertSubsetMap(pathWithTypeX, X, Y as MapTypeSpecifier, env);
            return;
        case 'function':
            assertSubsetFunction(pathWithTypeX, X, Y as FunctionTypeSpecifier, env);
            return;
    }
    assertNever();
}

function assertSubsetTuple(path: TypeTreePath, X: TupleTypeSpecifier, Y: TupleTypeSpecifier, env: FlowEnvironment) {
    if (X.elements.length !== Y.elements.length) {
        throw new TypeSystemException({
            type: 'incompatible-type',
            message: `A tuple with ${Y.elements.length} elements expected, ${X.elements.length} were provided.`,
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
    // { gottenKeys.size > 0 } is allowed
}

function assertSubsetFunction(path: TypeTreePath, X: FunctionTypeSpecifier, Y: FunctionTypeSpecifier, env: FlowEnvironment) {
    assertSubsetSwitch(path.add({ key: 'parameter', formatting: 'property' }), X.parameter, Y.parameter, env);
    assertSubsetSwitch(path.add({ key: 'output', formatting: 'property' }), X.output, Y.output, env);
}

