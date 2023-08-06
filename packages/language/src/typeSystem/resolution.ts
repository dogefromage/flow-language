import { findEnvironmentType } from "../core/environment";
import { FlowEnvironment } from "../types/context";
import { TypeSpecifier } from "../types/typeSystem";
import { TypeSystemException, TypeTreePath } from "./exceptionHandling";


export function tryResolveTypeAlias(X: TypeSpecifier, env: FlowEnvironment) {
    try {
        return resolveTypeAlias(new TypeTreePath(), X, env);
    } catch {}
}

export function resolveTypeAlias(
    path: TypeTreePath, X: TypeSpecifier, env: FlowEnvironment, checkedAliases = new Set<string>()
): Exclude<TypeSpecifier, string> {
    if (typeof X !== 'string') {
        return X;
    }
    const namedPath = path.add({ key: X, formatting: 'alias' });
    
    if (checkedAliases.has(X)) {
        throw new TypeSystemException({
            type: 'cyclic-definition', 
            message: 'Types are circularly defined and cannot be resolved.',
            path: namedPath,
        });
    }

    const envType = findEnvironmentType(env, X);
    if (!envType) {
        throw new TypeSystemException({
            type: 'unknown-reference', 
            message: `Could not find any type for the alias '${X}'`,
            path: namedPath,
        });
    }

    checkedAliases.add(X);
    return resolveTypeAlias(namedPath, envType, env, checkedAliases);
}
