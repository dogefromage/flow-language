import * as lang from '@fluss/language';

export const flowsIdRegex = /^[A-Za-z_][A-Za-z_0-9]*$/;
export const listItemRegex = /^[A-Za-z_][A-Za-z_0-9]*$/;

export type FlowsSliceState = Record<string, lang.FlowGraph>;

export const defaultDocumentConfig: lang.FlowDocumentConfig = {
    entryFlows: {},
}

export const mainSignature: lang.AnonymousFlowSignature = {
    generics: [{ id: 'T', constraint: null }],
    inputs: [],
    output: {
        id: 'value',
        rowType: 'output-simple',
        specifier: 'T',
    },
}

export const emptyFlowSignature: lang.AnonymousFlowSignature = {
    generics: [],
    inputs: [
        {
            id: 'x',
            rowType: 'input-variable',
            specifier: 'number',
            defaultValue: 0,
        },
    ],
    output: {
        id: 'y',
        rowType: 'output-simple',
        specifier: 'number',
    },
}

export const initialDefaultRootFlow: lang.FlowGraph = {
    id: lang.MAIN_FLOW_ID,
    ...mainSignature,
    idCounter: 1,
    attributes: {},
    nodes: {
        a: {
            id: 'a',
            signature: 'output',
            rowStates: {},
            position: { x: 400, y: 294 }
        },
    },
};

export const defaultFlows = {
    [initialDefaultRootFlow.id]: initialDefaultRootFlow,
};