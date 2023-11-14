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
    regions: {
        a: {
            id: 'a',
            attributes: {
                text: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
                color: '#00bdc7',
            },
            position: { x: 200, y: 100 },
            size: { w: 200, h: 150 },
        }
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