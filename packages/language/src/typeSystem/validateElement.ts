import { FlowEnvironment, InitializerValue, TypeSpecifier } from "../types";
import { Obj } from "../types/utilTypes";
import { TypeTreePath, TypeSystemException } from "./exceptionHandling";
import { resolveTypeAlias } from "./resolution";

export function assertElementOfType(specifier: TypeSpecifier, value: InitializerValue, env: FlowEnvironment) {
    return _assertElementOfType(new TypeTreePath(), specifier, value, env);
}
function _assertElementOfType(path: TypeTreePath, T: TypeSpecifier, element: InitializerValue, env: FlowEnvironment) {
    T = resolveTypeAlias(path, T, env);

    const typedPath = path.add({ key: T.type, formatting: 'type' });
    if (T.type === 'primitive') {
        if (typeof element === T.name) {
            return;
        }
        throw new TypeSystemException({
            type: 'invalid-value', 
            message: `Value 'typeof ${element}' is not of expected primitive '${T.name}'.`,
            path: typedPath.add({ key: T.name, formatting: 'alias' }),
        });
    }
    if (T.type === 'list') {
        if (typeof element !== 'object' || !Array.isArray(element)) {
            throw new TypeSystemException({
                type: 'invalid-value', 
                message: 'Value is not a list.',
                path: typedPath,
            });
        }
        for (let i = 0; i < element.length; i++) {
            _assertElementOfType(typedPath.add({ key: i.toString(), formatting: 'property' }), T.element, element[i], env);
        }
        return;
    }
    if (T.type === 'tuple') {
        if (typeof element !== 'object' || !Array.isArray(element)) {
            throw new TypeSystemException({
                type: 'invalid-value', 
                message: 'Value is not a list.',
                path: typedPath,
            });
        }
        if (element.length !== T.elements.length) {
            throw new TypeSystemException({
                type: 'invalid-value', 
                message: `A tuple with ${T.elements.length} elements expected, ${element.length} were provided.`,
                path: typedPath,
            });
        }
        for (let i = 0; i < element.length; i++) {
            _assertElementOfType(typedPath.add({ key: i.toString(), formatting: 'property' }), T.elements[i], element[i], env);
        }
        return;
    }
    if (T.type === 'map') {
        if (typeof element !== 'object' || Array.isArray(element)) {
            throw new TypeSystemException({
                type: 'invalid-value', 
                message: 'Value is not an object.',
                path: typedPath,
            });
        }
        for (const key of Object.keys(T.elements)) {
            const propPath = path.add({ key, formatting: 'property' });
            const valueProp = (element as Obj<InitializerValue>)[key];
            if (valueProp == null) {
                throw new TypeSystemException({
                    type: 'incompatible-type', 
                    message: `Object is missing expected property '${key}'`,
                    path: propPath,
                })
            }
            _assertElementOfType(propPath, T.elements[key], valueProp, env);
        }
        return;
    }
    if (T.type === 'any') {
        return;
    }

    throw new TypeSystemException({
        type: 'invalid-value', 
        message: `A value cannot be assigned to type '${T.type}'.`,
        path,
    });
}
