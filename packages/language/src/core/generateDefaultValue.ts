import { primitiveTypes } from "../content/types";
import { FlowEnvironment, InitializerValue, TypeSpecifier } from "../types";
import { TypeTreePath, resolveReferences } from "./typeStructure";



export function generateDefaultValue(specifier: TypeSpecifier, env: FlowEnvironment) {
    return _generateDefaultValue(new TypeTreePath(), specifier, env);
}
function _generateDefaultValue(path: TypeTreePath, specifier: TypeSpecifier, env: FlowEnvironment): InitializerValue {
    specifier = resolveReferences(path, specifier, env);
    if (specifier == null) {
        return null;
    }
    if (typeof specifier === 'symbol') {
        if (specifier === primitiveTypes.boolean) {
            return false;
        }
        if (specifier === primitiveTypes.number) {
            return 0;
        }
        if (specifier === primitiveTypes.string) {
            return '';
        }
        throw new Error(`Unknown primitive ${specifier.toString()}`);
    }
    if (specifier.type === 'array') {
        const elementValue = _generateDefaultValue(path.add('array'), specifier.elementType, env);
        const arr = new Array(specifier.length).fill(elementValue);
        return Object.freeze(arr);
    }
    if (specifier.type === 'list') {
        return Object.freeze([]);
    }
    if (specifier.type === 'map') {
        const mapPath = path.add('map');
        const valueEntries = Object
            .entries(specifier.elements)
            .map(([key, valueType]) => {
                const propPath = mapPath.add(key);
                return [key, _generateDefaultValue(propPath, valueType, env)];
            });
        return Object.freeze(Object.fromEntries(valueEntries));
    }
    throw new Error(`Unhandled specifier ${(specifier as any).type}`);
}
