import * as lang from '@fluss/language';

export type FlowsSliceState = Record<string, lang.FlowGraph>;

export const defaultDocumentConfig: lang.FlowDocumentConfig = {
    entryFlows: {}
}

export const mainSignature: lang.AnonymousFlowSignature = {
    generics: [{ id: 'T', constraint: null }],
    inputs: [],
    output: {
        id: 'value',
        label: 'Value',
        rowType: 'output-simple',
        specifier: 'T',
    },
}

export const emptyFlowSignature: lang.AnonymousFlowSignature = {
    generics: [],
    inputs: [
        {
            id: 'a',
            label: 'Some Input',
            rowType: 'input-variable',
            specifier: 'number',
            defaultValue: 0,
        },
    ],
    output: {
        id: 'value',
        label: 'Some output',
        rowType: 'output-simple',
        specifier: 'number',
    },
}

export const initialDefaultRootFlow: lang.FlowGraph = {
    id: lang.MAIN_FLOW_ID,
    name: 'Main',
    ...mainSignature,
    idCounter: 1,
    attributes: {},
    nodes: {
        a: {
            id: 'a',
            signature: lang.getInternalId('output'),
            rowStates: {},
            position: { x: 400, y: 294 }
        },
    },
};

export const defaultFlows = {
    [initialDefaultRootFlow.id]: initialDefaultRootFlow,
};