import { EnvContent, EnvScope, EnvScopeFrame } from "../types";
import { ListCache } from "../utils/ListCache";
import { mem } from '../utils/mem';

// use shared cache since same values appear often in different functions
const environmentCache = new ListCache(5209);

export const createEnvironment = mem(
    (namespace: EnvScopeFrame | null): EnvScope => ({ parent: null, namespace }),
    environmentCache,
    { tag: 'createEnvironment' },
);

export const pushContent = mem(
    (parent: EnvScope, namespace: EnvScopeFrame): EnvScope => 
        ({ parent, namespace }),
    environmentCache,
    { tag: 'pushContent' },
);
export const popContent = (env: EnvScope) => env.parent;

export const flattenEnvironment = mem(
    (env: EnvScope): EnvContent => {
        const currContent = env.namespace ? env.namespace.content : {};
        if (env.parent == null) {
            return currContent;
        }
        const parent = flattenEnvironment(env.parent);
        return {
            // children overwrite parents
            signatures: { ...parent.signatures, ...currContent.signatures },
            types: { ...parent.types, ...currContent.types },
        };
    },
    environmentCache,
    { tag: 'flattenEnvironment' },
);
export const getEnvironmentSignature = (env: EnvScope, name: string) => {
    const content = flattenEnvironment(env);
    return content[name];
}



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
