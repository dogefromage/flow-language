import * as lang from '@fluss/language';

export type FlowsSliceState = Record<string, lang.FlowGraph>;

export const defaultDocumentConfig: lang.FlowDocumentConfig = {
    entryFlows: {}
}

export const mainSignature: lang.AnonymousFlowSignature = {
    generics: ['T'],
    inputs: [],
    outputs: [{
        id: 'value',
        label: 'Value',
        rowType: 'output',
        specifier: 'T',
    }],
}

export const emptyFlowSignature: lang.AnonymousFlowSignature = {
    inputs: [
        {
            id: 'a',
            label: 'A',
            rowType: 'input-variable',
            specifier: 'number',
            defaultValue: 0,
        },
        {
            id: 'b',
            label: 'B',
            rowType: 'input-variable',
            specifier: 'boolean',
            defaultValue: false,
        },
        {
            id: 'c',
            label: 'c',
            rowType: 'input-variable',
            specifier: 'string',
            defaultValue: '',
        }
    ],
    outputs: [
        {
            id: 'value',
            label: 'Value',
            rowType: 'output',
            specifier: 'number',
        }
    ],
    generics: [],
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
            position: { x: 1020, y: 294 }
        },
    },
};

// const anotherFlow: lang.FlowGraph = {
//     id: 'otherGraph',
//     name: 'Other Graph',
//     nodes: {},
//     inputs: [],
//     outputs: [],
//     idCounter: 0,
// }

export const defaultFlows = {
    [initialDefaultRootFlow.id]: initialDefaultRootFlow,
    // [anotherFlow.id]: anotherFlow,
};