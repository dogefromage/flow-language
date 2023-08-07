import _ from "lodash";
import { FlowEnvironment, FlowEnvironmentContent, GenericTypeInference } from "../types";
import { FlowSignature, InputRowSignature, OutputRowSignature, getInternalId } from "../types/signatures";
import { MapTypeSpecifier, TupleTypeSpecifier, TypeSpecifier } from "../types/typeSystem";
import { Obj } from "../types/utilTypes";
import { memFreeze } from "../utils/functional";

export const createEnvironment = memFreeze(
    (content: FlowEnvironmentContent): FlowEnvironment => ({ parent: null, content })
);

export const pushContent = memFreeze(
    (parent: FlowEnvironment, content: FlowEnvironmentContent): FlowEnvironment => ({ parent, content })
);
export const popContent = (env: FlowEnvironment) => env.parent;

export const pushGenericInference = memFreeze((parent: FlowEnvironment, inference: GenericTypeInference) => {
    pushContent(parent, {
        types: {
            [inference.name]: inference.resolvedSpecifier,
        }
    });
});

export const collectTotalEnvironmentContent = memFreeze((env: FlowEnvironment): FlowEnvironmentContent => {
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
});

export const findEnvironmentSignature = memFreeze(
    (env: FlowEnvironment, signatureId: string): FlowSignature | undefined => 
        collectTotalEnvironmentContent(env).signatures?.[signatureId]
);
export const findEnvironmentType = memFreeze(
    (env: FlowEnvironment, typeName: string): TypeSpecifier | undefined => 
        collectTotalEnvironmentContent(env).types?.[typeName]
);

const addAdditionalContent = memFreeze((scope: FlowEnvironmentContent): FlowEnvironmentContent => {
    return {
        types: scope.types,
        signatures: {
            ...scope.signatures,
            ...(scope.types && generateLayerTypeSignatures(scope.types)),
        }
    };
});

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

const generateTypeSyntaxSignatures = memFreeze((name: string, spec: TypeSpecifier) => {

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
});

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
