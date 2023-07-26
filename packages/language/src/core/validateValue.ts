import { primitiveTypes } from "../content/types";
import { FlowEnvironment, InitializerValue, TypeSpecifier } from "../types";
import { Obj } from "../types/utilTypes";
import { TypeTreePath, resolveReferences, FlowTypeComparisonException } from "./typeStructure";

const symbolTypes = {
    [primitiveTypes.boolean]: 'boolean',
    [primitiveTypes.string]:  'string',
    [primitiveTypes.number]:  'number',
}

export function validateValue(specifier: TypeSpecifier, value: InitializerValue, env: FlowEnvironment) {
    return _validateValue(new TypeTreePath(), specifier, value, env);
}
function _validateValue(path: TypeTreePath, specifier: TypeSpecifier, value: InitializerValue, env: FlowEnvironment) {
    specifier = resolveReferences(path, specifier, env);
    if (specifier == null) {
        return;
    }
    if (value == null) {
        throw new FlowTypeComparisonException('invalid-value', path);
    }

    if (typeof specifier === 'symbol') {
        const symbolTypeString = symbolTypes[specifier];
        if (symbolTypeString == null) {
            throw new Error(`Unknown symbol "${specifier.toString()}"`);
        }
        if (typeof value !== symbolTypeString) {
            throw new FlowTypeComparisonException('invalid-value', path.add('primitive').add(symbolTypeString));
        }
        return;
    }
    if (specifier.type === 'array') {
        const arrayPath = path.add('array');
        if (typeof value !== 'object' || !Array.isArray(value)) {
            throw new FlowTypeComparisonException('invalid-value', arrayPath);
        }
        if (value.length !== specifier.length) {
            throw new FlowTypeComparisonException('invalid-value', arrayPath.add('length'));
        }

        for (let i = 0; i < value.length; i++) {
            _validateValue(arrayPath.add(i.toString()), specifier.elementType, value[i], env);
        }
        return;
    }
    if (specifier.type === 'list') {
        const listPath = path.add('list');
        if (typeof value !== 'object' || !Array.isArray(value)) {
            throw new FlowTypeComparisonException('invalid-value', listPath);
        }
        for (let i = 0; i < value.length; i++) {
            _validateValue(listPath.add(i.toString()), specifier.elementType, value[i], env);
        }
        return;
    }
    if (specifier.type === 'map') {
        const mapPath = path.add('map');
        if (typeof value !== 'object' || Array.isArray(value)) {
            throw new FlowTypeComparisonException('invalid-value', mapPath);
        }
        for (const key of Object.keys(specifier.elements)) {
            const valueProp = (value as Obj<InitializerValue>)[key];
            _validateValue(mapPath.add(key), specifier.elements[key], valueProp, env);
        }
        return;
    }
    throw new Error(`Unhandled specifier ${(specifier as any).type}`);
}
