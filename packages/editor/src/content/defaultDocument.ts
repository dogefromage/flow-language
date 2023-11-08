import * as lang from "@noodles/language";

export const defaultFlowSignature: lang.AnonymousFlowSignature = {
    generics: [],
    inputs: [
        {
            id: 'x',
            rowType: 'input-variable',
            specifier: lang.createAliasType('number'),
            defaultValue: 0,
        },
    ],
    output: {
        id: 'y',
        rowType: 'output-simple',
        specifier: lang.createAliasType('number'),
    },
}

const mainSignature: lang.AnonymousFlowSignature = {
    generics: [{ id: 'T', constraint: null }],
    inputs: [],
    output: {
        id: 'value',
        rowType: 'output-simple',
        specifier: lang.createGenericType('T'),
    },
}

const defaultRootFlow: lang.FlowGraph = {
    id: lang.MAIN_FLOW_ID,
    ...mainSignature,
    attributes: {},
    nodes: {
        a: {
            id: 'a',
            signature: { path: `document::${lang.MAIN_FLOW_ID}::output` },
            rowStates: {},
            position: { x: 400, y: 294 }
        },
    },
    imports: [ 'standard' ],
};

export const defaultFlows = {
    [defaultRootFlow.id]: defaultRootFlow,
};

export const defaultDocument: lang.FlowDocument = {
    title: 'New Document',
    description: '',
    flows: defaultFlows
}