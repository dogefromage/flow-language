import { FlowEnvironment, FlowEnvironmentContent, FlowEnvironmentNamespace } from "../types";
import { NamespacePath } from "../types/signatures";
import { ListCache } from "../utils/ListCache";
import { mapObjKeys, mem } from "../utils/functional";

// use shared cache since same values appear often in different functions
const environmentCache = new ListCache(5209);

export const createEnvironment = mem(
    (namespace: FlowEnvironmentNamespace): FlowEnvironment => ({ parent: null, namespace }),
    environmentCache,
);
// export const createEnvironment = mem(
//     (content: FlowEnvironmentContent /* , slug: string */): FlowEnvironment => ({ parent: null, content, /* slug */ }),
//     environmentCache,
// );

export const pushContent = mem(
    (parent: FlowEnvironment, namespace: FlowEnvironmentNamespace): FlowEnvironment => 
        ({ parent, namespace }),
    environmentCache,
);
// export const pushContent = mem(
//     (parent: FlowEnvironment, content: FlowEnvironmentContent, slug: string): FlowEnvironment => ({ parent, content, slug }),
//     environmentCache,
// );
export const popContent = (env: FlowEnvironment) => env.parent;

// export const pushGenericInference = mem(
//     (parent: FlowEnvironment, inference: GenericTypeInference, slug: string): FlowEnvironment => ({
//         parent,
//         content: {
//             types: { [inference.id]: inference.resolvedSpecifier },
//         },
//         slug,
//     }), 
//     environmentCache,
// );

function getNamedContent(namespace: FlowEnvironmentNamespace) {
    const addNamespaceName = (key: string) => `${namespace.name}::${key}`;
    const cont: FlowEnvironmentContent = {
        signatures: mapObjKeys(
            namespace.content.signatures, 
            addNamespaceName
        ),
        types: mapObjKeys(
            namespace.content.types, 
            addNamespaceName
        ),
    };
    return cont;
}

export const collectTotalEnvironmentContent = mem(
    (env: FlowEnvironment): FlowEnvironmentContent => {
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

// export const getSignature = mem(
//     (env: FlowEnvironment, path: NamespacePath) => {
//         const envContent = collectTotalEnvironmentContent(env);
//         return envContent.signatures?.[path.path];
//     },
//     environmentCache,
// );

// export const getScopePath = (env: FlowEnvironment | null) => {
//     let scopePath: string[] = [];
//     while (env != null) {
//         scopePath.unshift(env.slug);
//         env = env.parent;
//     }
//     return scopePath.join(':');
// }

export const findEnvironmentSignature = (env: FlowEnvironment, path: NamespacePath) =>
    collectTotalEnvironmentContent(env).signatures?.[path.path];

export const findEnvironmentType = (env: FlowEnvironment, path: NamespacePath) =>
    collectTotalEnvironmentContent(env).types?.[path.path];

// const addAdditionalContent = mem(
//     (scope: FlowEnvironmentContent): FlowEnvironmentContent => {
//         return {
//             types: scope.types,
//             signatures: {
//                 ...scope.signatures,
//                 ...(scope.types && generateLayerTypeSignatures(scope.types)),
//             }
//         };
//     },
//     environmentCache,
// );

// function generateLayerTypeSignatures(types: Obj<TypeSpecifier>) {
//     const signatureMap: Obj<FlowSignature> = {};
//     for (const [name, type] of Object.entries(types)) {
//         const syntaxSignatures = generateTypeSyntaxSignatures(name, type);
//         for (const s of syntaxSignatures) {
//             signatureMap[s.id] = s;
//         }
//     }
//     return signatureMap;
// }

// const generateTypeSyntaxSignatures = mem(
//     (name: string, spec: TypeSpecifier) => {

//         return [] as FlowSignature[];

//         // if (typeof spec !== 'object' ||
//         //     // combinable types:
//         //     spec.type !== 'map' &&
//         //     spec.type !== 'tuple'
//         // ) {
//         //     return [];
//         // }

//         // const category = 'Combine/Separate';

//         // // combiner
//         // const combiner: FlowSignature = {
//         //     id: getInternalId('combine', name),
//         //     name: `Combine ${name}`,
//         //     description: `Combines required data into a ${name}`,
//         //     attributes: { category },
//         //     generics: [],
//         //     inputs: getCombinerInputRows(spec),
//         //     output: {
//         //         id: 'output',
//         //         rowType: 'output-simple',
//         //         label: name,
//         //         specifier: name, // reference
//         //     },
//         // };

//         // // separator
//         // const separator: FlowSignature = {
//         //     id: getInternalId('separate', name),
//         //     name: `Separate ${name}`,
//         //     description: `Separates ${name} into its `,
//         //     attributes: { category },
//         //     generics: [],
//         //     inputs: [
//         //         {
//         //             id: 'input',
//         //             rowType: 'input-simple',
//         //             label: name,
//         //             specifier: name, // reference
//         //         }
//         //     ],
//         //     outputs: getSeparatorOutputRows(spec),
//         // };

//         // return [combiner, separator];
//     },
//     environmentCache,
// );

// function getCombinerInputRows(type: TupleTypeSpecifier | MapTypeSpecifier): InputRowSignature[] {
//     if (type.type === 'tuple') {
//         let rows: InputRowSignature[] = [];
//         for (let i = 0; i < type.elements.length; i++) {
//             rows.push({
//                 id: i.toString(),
//                 label: (i + 1).toString(),
//                 specifier: type.elements[i],
//                 rowType: 'input-variable',
//                 defaultValue: null,
//             });
//         }
//         return rows;
//     }
//     if (type.type === 'map') {
//         const rows = Object.entries(type.elements)
//             .sort((a, b) => a[0].localeCompare(b[0]))
//             .map(([key, type]) => {
//                 const row: InputRowSignature = {
//                     id: key,
//                     label: prettifyLabel(key),
//                     specifier: type,
//                     rowType: 'input-variable',
//                     defaultValue: null,
//                 };
//                 return row;
//             });
//         return rows;
//     }
//     throw new Error(`Type ${(type as any).type} is not structurable`);
// }

// function getSeparatorOutputRows(type: TupleTypeSpecifier | MapTypeSpecifier): OutputRowSignature[] {
//     if (type.type === 'tuple') {
//         let rows: OutputRowSignature[] = [];
//         for (let i = 0; i < type.elements.length; i++) {
//             rows.push({
//                 id: i.toString(),
//                 label: (i + 1).toString(),
//                 specifier: type.elements[i],
//                 rowType: 'output',
//             });
//         }
//         return rows;
//     }
//     if (type.type === 'map') {
//         const rows = Object.entries(type.elements)
//             .sort((a, b) => a[0].localeCompare(b[0]))
//             .map(([key, type]) => {
//                 const row: OutputRowSignature = {
//                     id: key,
//                     label: prettifyLabel(key),
//                     specifier: type,
//                     rowType: 'output',
//                 };
//                 return row;
//             });
//         return rows;
//     }
//     throw new Error(`Type ${(type as any).type} is not structurable`);
// }

