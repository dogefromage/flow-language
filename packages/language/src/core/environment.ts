import { Environment, NamespacePath, ScopeNode } from "../types";
import { instantiateType } from "../typesystem/core";
import { TExpr } from "../typesystem/typeExpr";
import { assert } from "../utils";

// // use shared cache since same values appear often in different functions
// const environmentCache = new ListCache(5209);

export const createEnvironment = (scope: ScopeNode): Environment => ({ parent: null, scope });

export const pushScope = (env: Environment, scope: ScopeNode): Environment => ({ parent: env, scope });
export const popScope = (env: Environment) => env.parent;

export const getInstantiatedEnvType = (env: Environment, level: number, path: NamespacePath) => {
    const slugs = path.split('/');
    let ty!: TExpr;
    switch (slugs.length) {
        case 1:
            ty = getLocalType(env, slugs[0]);
            break;
        case 2:
            ty = getFlowType(env, slugs[0], slugs[1]);
            break;
        case 3:
            ty = getModuleType(env, slugs[0], slugs[1], slugs[2]);
            break;
        default:
            assert(0) as never;
    }
    return instantiateType(level, ty);
}

function getLocalType(env: Environment | null, identifier: string) {
    while (env?.scope != null && env.scope.kind === 'local') {
        if (env.scope.types[identifier] != null) {
            return env.scope.types[identifier];
        }
        env = env.parent;
    }
    throw new Error(`Could not find local '${identifier}'.`);
}
function getFlowType(env: Environment | null, flowId: string, identifier: string) {
    while (env != null && env.scope.kind !== 'flow') {
        env = env.parent;
    }
    while (env != null && env.scope.kind === 'flow') {
        if (env.scope.flowId === flowId) {
            const t = env.scope.functions[identifier]?.generalizedType;
            if (t != null) {
                return t;
            } else {
                break;
            }
        }
        env = env.parent;
    }
    throw new Error(`Could not find flow '${flowId}' with type '${identifier}'.`);
}
function getModuleType(env: Environment | null, moduleName: string, flowId: string, identifier: string) {
    while (env != null && env.scope.kind !== 'module') {
        env = env.parent;
    }
    while (env != null && env.scope.kind === 'module') {
        if (env.scope.name === moduleName) {
            const t = env.scope.flows[flowId]?.functions[identifier]?.generalizedType;
            if (t != null) {
                return t;
            } else {
                break;
            }
        }
        env = env.parent;
    }
    throw new Error(`Could not find module '${moduleName}' with flow '${flowId}' with type '${identifier}'.`);
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
