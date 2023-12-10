import * as lang from "noodle-language";

// export const defaultFlowSignature: lang.AnonymousFlowSignature = {
//     generics: [],
//     inputs: [
//         {
//             id: 'x',
//             rowType: 'input-variable',
//             specifier: lang.createAliasType('number'),
//             defaultValue: 0,
//         },
//     ],
//     output: {
//         id: 'y',
//         rowType: 'output',
//         specifier: lang.createAliasType('number'),
//     },
// }

// const mainSignature: lang.AnonymousFlowSignature = {
//     generics: [],
//     inputs: [],
//     output: {
//         id: 'value',
//         rowType: 'output',
//         specifier: lang.createAnyType(),
//     },
// }

// const howToText = 
// `Welcome to your new project, here's how you can start:

// - Add node with spacebar or right-click for menu.
// - Connect joints by dragging them.
// - Box select multiple elements by draggin a square.
// - Edit various settings and attributes in inspector on the right.
// - Add new flows on the left.
// - Run program using Ctrl-Enter or the toolbar menu.
// `;

export const DEFAULT_FLOW_ID = 'new_flow';

const defaultFlow: lang.FlowGraph = {
    id: DEFAULT_FLOW_ID,
    attributes: {},
    nodes: {
        a: {
            kind: 'call',
            id: 'a',
            functionId: 'core/number/multiply' as lang.NamespacePath,
            argumentMap: {
                x: { id: 'x', references: {} },
                y: { id: 'y', references: {} },
            },
            output: {},
            position: { x: 500, y: 300 }
        },
        b: {
            kind: 'comment',
            id: 'b',
            attributes: { text: 'Test Comment!!', },
            position: { x: 0, y: 0 },
            size: { w: 700, h: 180 },
        }
    },
    imports: [ 'standard' ],
};

export const defaultFlows = {
    [defaultFlow.id]: defaultFlow,
};

export const defaultDocument: lang.FlowDocument = {
    title: 'Default Document',
    description: '',
    flows: defaultFlows
}