import { findEnvironmentType } from "../core/environment";
import { AliasTypeSpecifier, FlowEnvironment, TypeSpecifier } from "../types";
import { TypeSystemException, TypeTreePath } from "./exceptionHandling";

export function tryResolveTypeAlias(X: TypeSpecifier, env: FlowEnvironment) {
    try {
        return resolveTypeAlias(new TypeTreePath(), X, env);
    } catch {}
}

export function resolveTypeAlias(
    path: TypeTreePath, X: TypeSpecifier, env: FlowEnvironment, checkedAliases = new Set<string>()
): Exclude<TypeSpecifier, AliasTypeSpecifier> {
    if (X.type !== 'alias') {
        return X;
    }
    const namedPath = path.add({ key: X.alias, formatting: 'alias' });
    
    if (checkedAliases.has(X.alias)) {
        throw new TypeSystemException({
            type: 'cyclic-definition', 
            message: 'Types are circularly defined and cannot be resolved.',
            path: namedPath,
        });
    }

    const aliasNamePath = { path: X.alias };
    const envType = findEnvironmentType(env, aliasNamePath);
    if (!envType) {
        throw new TypeSystemException({
            type: 'unknown-reference', 
            message: `Could not find any type for the alias '${X.alias}'.`,
            path: namedPath,
        });
    }

    checkedAliases.add(X.alias);
    return resolveTypeAlias(namedPath, envType, env, checkedAliases);
}
