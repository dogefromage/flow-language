import { EnvPath, EnvSymbolRow, Environment, EnvironmentSignature, MaybeProblem } from "../types";
import { assert } from "../utils";

// // use shared cache since same values appear often in different functions
// const environmentCache = new ListCache(5209);

const emptyRow: EnvSymbolRow = { path: [], symbols: {} };
export const createEnvironment = (row: EnvSymbolRow = emptyRow): Environment => ({ parent: null, row });
export const pushEnv = (parent: Environment, row: EnvSymbolRow): Environment => ({ parent, row });
export const popEnv = (env: Environment) => env.parent;

/**
 * Expecting scopedIdentifier to look like
 *    'module/flow/identifier'
 * where the first two parts are optional.
 * Location path should contain enough information to resolve the first two parts
 * if they are missing. Will throw all kinds of errors if this is not possible.
 */
export function resolveEnvPath(scopedIdentifier: string, locationPath: string[]) {
    const searchPath = scopedIdentifier.split('/');
    assert(locationPath.length <= 2, 'invalid prefix path');
    assert(searchPath.length <= 3, 'invalid search path');
    assert((searchPath.length + locationPath.length) >= 3, 'not enough path information');
    
    const finalPath: string[] = [];
    for (let i = 0; i < 3; i++) {
        finalPath.push(
            searchPath[i - 3 + searchPath.length] || 
            locationPath[i] || 
            assert(false)!
        );
    }
    return finalPath;
}

export function getEnvironmentSignature(
    env: Environment | null, scopedIdentifier: string, locationPath: string[]): MaybeProblem<EnvironmentSignature> {
    const searchPath = resolveEnvPath(scopedIdentifier, locationPath).join('/');

    while (env != null) {
        // TODO: inefficient, optimize
        for (const [key, sig] of Object.entries(env.row.symbols)) {
            const sigPath = resolveEnvPath(key, env.row.path).join('/');
            if (searchPath === sigPath) {
                return MaybeProblem.ok(sig);
            }
        }
        env = env.parent;
    }

    return MaybeProblem.problem({ message: `Could not find symbol '${searchPath}'.` });
}

export function getEnvironmentSignatureOfKind<S extends EnvironmentSignature>
    (env: Environment | null, name: string, path: string[], kind: S['kind']): MaybeProblem<S> {
    return getEnvironmentSignature(env, name, path).flatMap(sig => {
        if (sig.kind !== kind) {
            const msg = `Expected signature of kind '${kind}' at location '${path}' but found '${sig.kind}'.`;
            return MaybeProblem.problem({ message: msg });
        }
        return MaybeProblem.ok(sig as S);
    });
}

// export const getEnvironmentSignature = (env: EnvScope, name: string) => {
//     const content = flattenEnvironment(env);
//     return content[name];
// }

// export const flattenEnvironment = mem(
//     (env: EnvScope): EnvContent => {
//         const currContent = env.namespace ? env.namespace.content : {};
//         if (env.parent == null) {
//             return currContent;
//         }
//         const parent = flattenEnvironment(env.parent);
//         return {
//             // children overwrite parents
//             signatures: { ...parent.signatures, ...currContent.signatures },
//             types: { ...parent.types, ...currContent.types },
//         };
//     },
//     environmentCache,
//     { tag: 'flattenEnvironment' },
// );



// function getNamedContent(namespace: EnvScopeFrame) {
//     const addNamespaceName = (key: string) => `${namespace.name}::${key}`;
//     const cont: FlowNamedEnvironmentContent = {
//         signatures: Object.fromEntries(
//             namespace.content.signatures.map(sig => [
//                 addNamespaceName(sig.id),
//                 sig,
//             ])
//         ),

//         // dont know how to handle types. for now just dont scope them
//         types: namespace.content.types,
//         // types: mapObjKeys(
//         //     namespace.content.types,
//         //     addNamespaceName
//         // ),
//     };
//     return cont;
// }

// export const collectTotalEnvironmentContent = mem(
//     (env: EnvScope): FlowNamedEnvironmentContent => {
//         let currContent = env.namespace ?
//             getNamedContent(env.namespace) : { signatures: {}, types: {} };
//         if (env.parent == null) {
//             return currContent;
//         }

//         const parent = collectTotalEnvironmentContent(env.parent);
//         return {
//             // children overwrite parents
//             signatures: { ...parent.signatures, ...currContent.signatures },
//             types: { ...parent.types, ...currContent.types },
//         };
//     },
//     environmentCache,
//     { tag: 'collectTotalEnvironmentContent' },
// );

// export const findEnvironmentSignature = (env: FlowEnvironment, path: NamespacePath) => {
//     const envContent = collectTotalEnvironmentContent(env);
//     return envContent.signatures[path.path]
// }
// export const findEnvironmentType = (env: FlowEnvironment, path: NamespacePath) => {
//     const envContent = collectTotalEnvironmentContent(env);
//     return envContent.types[path.path];
// }
