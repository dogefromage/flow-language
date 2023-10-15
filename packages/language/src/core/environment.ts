import { FlowEnvironment, FlowEnvironmentContent, FlowEnvironmentNamespace, FlowNamedEnvironmentContent } from "../types";
import { FlowSignature, NamespacePath } from "../types/signatures";
import { ListCache } from "../utils/ListCache";
import { mapObjKeys, mem } from "../utils/functional";

// use shared cache since same values appear often in different functions
const environmentCache = new ListCache(5209);

export const createEnvironment = mem(
    (namespace: FlowEnvironmentNamespace): FlowEnvironment => ({ parent: null, namespace }),
    environmentCache,
);

export const pushContent = mem(
    (parent: FlowEnvironment, namespace: FlowEnvironmentNamespace): FlowEnvironment => 
        ({ parent, namespace }),
    environmentCache,
);
export const popContent = (env: FlowEnvironment) => env.parent;

function getNamedContent(namespace: FlowEnvironmentNamespace) {
    const addNamespaceName = (key: string) => `${namespace.name}::${key}`;
    const cont: FlowNamedEnvironmentContent = {
        signatures: Object.fromEntries(
            namespace.content.signatures.map(sig => [
                addNamespaceName(sig.id),
                sig,
            ])
        ),

        // dont know how to handle types. for now just dont scope them
        types: namespace.content.types,
        // types: mapObjKeys(
        //     namespace.content.types, 
        //     addNamespaceName
        // ),
    };
    return cont;
}

export const collectTotalEnvironmentContent = mem(
    (env: FlowEnvironment): FlowNamedEnvironmentContent => {
        let currContent = env.namespace ? 
            getNamedContent(env.namespace) : { signatures: {}, types: {} };
        if (env.parent == null) {
            return currContent;
        }

        const parent = collectTotalEnvironmentContent(env.parent);
        return {
            // children overwrite parents
            signatures: { ...parent.signatures, ...currContent.signatures },
            types: { ...parent.types, ...currContent.types },
        };
    },
    environmentCache,
);

export const findEnvironmentSignature = (env: FlowEnvironment, path: NamespacePath) => {
    const envContent = collectTotalEnvironmentContent(env);
    return envContent.signatures[path.path]
}
export const findEnvironmentType = (env: FlowEnvironment, path: NamespacePath) => {
    const envContent = collectTotalEnvironmentContent(env);
    return envContent.types[path.path];
}
