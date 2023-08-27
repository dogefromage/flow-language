import _ from "lodash";
import { FlowEnvironment, FlowEnvironmentContent, GenericTypeInference } from "../types";
import { FlowSignature, InputRowSignature, OutputRowSignature, getInternalId } from "../types/signatures";
import { MapTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types/typeSystem";
import { Obj } from "../types/utilTypes";
import { ListCache } from "../utils/ListCache";
import { mem } from "../utils/functional";
import { getSignatureFunctionType, memoizeTypeStructure } from "../typeSystem";
import { tryResolveTypeAlias } from "../typeSystem/resolution";

const environmentCache = new ListCache(5209);

export const createEnvironment = mem(
    (content: FlowEnvironmentContent): FlowEnvironment => ({ parent: null, content }),
    environmentCache,
);

export const pushContent = mem(
    (parent: FlowEnvironment, content: FlowEnvironmentContent): FlowEnvironment => ({ parent, content }),
    environmentCache,
);
export const popContent = (env: FlowEnvironment) => env.parent;

export const pushGenericInference = mem(
    (parent: FlowEnvironment, inference: GenericTypeInference): FlowEnvironment => ({
        parent, 
        content: {
            types: { [inference.name]: inference.resolvedSpecifier },
        }
    }), environmentCache,
);

export const getAllReferencedSpecifiers = mem(
    (env: FlowEnvironment): TypeSpecifier[] => {
        const content = collectTotalEnvironmentContent(env);

        // const visited = new Set<TypeSpecifier>();
        const specs: TypeSpecifier[] = [];

        // collect all types
        for (const typeName of Object.keys(content.types || {})) {
            // if (visited.has(typeName)) {
            //     continue;
            // }
            specs.push(typeName);
            // // add all mentions to visited
            // visited.add(typeName);
            // const deAliased = tryResolveTypeAlias(content.types![typeName], env);
            // if (deAliased != null) {
            //     const memoized = memoizeTypeStructure(deAliased); 
            //     visited.add(memoized);
            // }
        }
        
        // collect signature types 
        for (const signature of Object.values(content.signatures || {})) {
            const functionSpec = getSignatureFunctionType(signature);
            const functionSpecs = [
                ...Object.values(functionSpec.parameter.elements),
                ...Object.values(functionSpec.output.elements),
            ];
            specs.push(...functionSpecs);
        }
        return specs;
    },
    environmentCache,
)

export const collectTotalEnvironmentContent = mem(
    (env: FlowEnvironment): FlowEnvironmentContent => {
        const totalCurr = addAdditionalContent(env.content);
        if (!env.parent) {
            return totalCurr;
        }
        const parent = collectTotalEnvironmentContent(env.parent);
        return {
            // children overwrite parents
            signatures: { ...parent.signatures, ...totalCurr.signatures },
            types: { ...parent.types, ...totalCurr.types },
        };
    },
    environmentCache,
);

export const findEnvironmentSignature = (env: FlowEnvironment, signatureId: string) =>
    collectTotalEnvironmentContent(env).signatures?.[signatureId];

export const findEnvironmentType = (env: FlowEnvironment, typeName: string) =>
    collectTotalEnvironmentContent(env).types?.[typeName];

const addAdditionalContent = mem(
    (scope: FlowEnvironmentContent): FlowEnvironmentContent => {
        return {
            types: scope.types,
            signatures: {
                ...scope.signatures,
                ...(scope.types && generateLayerTypeSignatures(scope.types)),
            }
        };
    },
    environmentCache,
);

function generateLayerTypeSignatures(types: Obj<TypeSpecifier>) {
    const signatureMap: Obj<FlowSignature> = {};
    for (const [name, type] of Object.entries(types)) {
        const syntaxSignatures = generateTypeSyntaxSignatures(name, type);
        for (const s of syntaxSignatures) {
            signatureMap[s.id] = s;
        }
    }
    return signatureMap;
}

const generateTypeSyntaxSignatures = mem(
    (name: string, spec: TypeSpecifier) => {
        if (typeof spec !== 'object' ||
            // combinable types:
            spec.type !== 'map' &&
            spec.type !== 'tuple'
        ) {
            return [];
        }

        const category = 'Combine/Separate';

        // combiner
        const combiner: FlowSignature = {
            id: getInternalId('combine', name),
            name: `Combine ${name}`,
            description: `Combines required data into a ${name}`,
            attributes: { category },
            generics: [],
            inputs: getCombinerInputRows(spec),
            outputs: [
                {
                    id: 'output',
                    rowType: 'output',
                    label: name,
                    specifier: name, // reference
                }
            ],
        };

        // separator
        const separator: FlowSignature = {
            id: getInternalId('separate', name),
            name: `Separate ${name}`,
            description: `Separates ${name} into its `,
            attributes: { category },
            generics: [],
            inputs: [
                {
                    id: 'input',
                    rowType: 'input-simple',
                    label: name,
                    specifier: name, // reference
                }
            ],
            outputs: getSeparatorOutputRows(spec),
        };

        return [combiner, separator];
    },
    environmentCache,
);

function getCombinerInputRows(type: TupleTypeSpecifier | MapTypeSpecifier): InputRowSignature[] {
    if (type.type === 'tuple') {
        let rows: InputRowSignature[] = [];
        for (let i = 0; i < type.elements.length; i++) {
            rows.push({
                id: i.toString(),
                label: (i + 1).toString(),
                specifier: type.elements[i],
                rowType: 'input-variable',
                defaultValue: null,
            });
        }
        return rows;
    }
    if (type.type === 'map') {
        const rows = Object.entries(type.elements)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, type]) => {
                const row: InputRowSignature = {
                    id: key,
                    label: prettifyLabel(key),
                    specifier: type,
                    rowType: 'input-variable',
                    defaultValue: null,
                };
                return row;
            });
        return rows;
    }
    throw new Error(`Type ${(type as any).type} is not structurable`);
}

function getSeparatorOutputRows(type: TupleTypeSpecifier | MapTypeSpecifier): OutputRowSignature[] {
    if (type.type === 'tuple') {
        let rows: OutputRowSignature[] = [];
        for (let i = 0; i < type.elements.length; i++) {
            rows.push({
                id: i.toString(),
                label: (i + 1).toString(),
                specifier: type.elements[i],
                rowType: 'output',
            });
        }
        return rows;
    }
    if (type.type === 'map') {
        const rows = Object.entries(type.elements)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, type]) => {
                const row: OutputRowSignature = {
                    id: key,
                    label: prettifyLabel(key),
                    specifier: type,
                    rowType: 'output',
                };
                return row;
            });
        return rows;
    }
    throw new Error(`Type ${(type as any).type} is not structurable`);
}

function prettifyLabel(propertyName: string) {
    return _.startCase(propertyName.replaceAll('_', ' ').trim());
}
