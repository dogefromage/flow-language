import * as lang from "noodle-language";

import demoDocString from './demoDocString.json?raw';

export const defaultDocument: lang.FlowDocument = JSON.parse(demoDocString);

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

// const mainSignature: lang.AnonymousFlowSignature = {
//     generics: [{ id: 'T', constraint: null }],
//     inputs: [],
//     output: {
//         id: 'value',
//         rowType: 'output-simple',
//         specifier: lang.createGenericType('T'),
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

// const defaultRootFlow: lang.FlowGraph = {
//     id: lang.MAIN_FLOW_ID,
//     ...mainSignature,
//     attributes: {},
//     nodes: {
//         a: {
//             id: 'a',
//             signature: { path: `document::${lang.MAIN_FLOW_ID}::output` },
//             rowStates: {},
//             position: { x: 500, y: 300 }
//         },
//     },
//     regions: {
//         a: {
//             id: 'a',
//             attributes: { text: howToText, },
//             position: { x: 0, y: 0 },
//             size: { w: 700, h: 180 },
//         }
//     },
//     imports: [ 'standard' ],
// };

// export const defaultFlows = {
//     [defaultRootFlow.id]: defaultRootFlow,
// };



// export const defaultDocument: lang.FlowDocument = {
//     title: 'New Document',
//     description: '',
//     flows: defaultFlows
// }
