import { typeSystemCache } from ".";
import { primitiveTypes } from "../content/standardModule";
import { FlowEnvironment, InitializerValue, TypeSpecifier } from "../types";
import { mem } from "../utils/functional";
import { TypeTreePath } from "./exceptionHandling";
import { resolveTypeAlias } from "./resolution";

export function generateDefaultValue(specifier: TypeSpecifier, env: FlowEnvironment) {
    return _generateDefaultValue(new TypeTreePath(), specifier, env);
}
const _generateDefaultValue = mem((
    path: TypeTreePath, X: TypeSpecifier, env: FlowEnvironment,
): InitializerValue => {
    X = resolveTypeAlias(path, X, env);

    const typedPath = path.add({ key: X.type, formatting: 'type' });
    
    if (X.type === 'primitive') {
        if (X.name === primitiveTypes.boolean.name) {
            return false;
        }
        if (X.name === primitiveTypes.number.name) {
            return 0;
        }
        if (X.name === primitiveTypes.string.name) {
            return '';
        }
        throw new Error(`Unknown primitive ${X.name}`);
    }
    throw new Error(`Cannot generate default value for  '${(X as any).type}'`);
}, typeSystemCache);