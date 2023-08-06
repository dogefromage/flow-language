import { upperFirst } from "lodash";
import { InputRowSignature, OutputRowSignature } from "../types";
import { SignatureDefinition } from "../types/local";

export const localDefinitions: SignatureDefinition[] = [];

const varNumberRow = (tag: string, defaultValue = 0): InputRowSignature => ({
    rowType: 'input-variable',
    id: tag,
    label: upperFirst(tag),
    dataType: 'number',
    defaultValue,
});
const outNumberRow = (tag: string): OutputRowSignature => ({
    rowType: 'output',
    id: tag,
    label: upperFirst(tag),
    dataType: 'number',
});

localDefinitions.push({
    signature: {
        id: 'add',
        name: 'Add',
        attributes: {},
        description: null,
        generics: [],
        inputs: [varNumberRow('a'), varNumberRow('b')],
        outputs: [outNumberRow('sum')],
    },
    interpretation: ({ a, b }) => ({ sum: a + b }),
});

localDefinitions.push({
    signature: {
        id: 'multiply',
        name: 'Multiply',
        attributes: {},
        description: null,
        generics: [],
        inputs: [varNumberRow('a', 1), varNumberRow('b', 1)],
        outputs: [outNumberRow('product')],
    },
    interpretation: ({ a, b }) => ({ product: a * b }),
});

localDefinitions.push({
    signature: {
        id: 'sine',
        name: 'Sine',
        attributes: { color: '#b32248' },
        description: null,
        generics: [],
        inputs: [varNumberRow('angle', 0)],
        outputs: [outNumberRow('sine')],
    },
    interpretation: ({ angle }) => ({ sine: Math.sin(angle) }),
});

localDefinitions.push({
    signature: {
        id: 'generic_passthrough',
        name: 'Generic Passthrough',
        attributes: {},
        description: null,
        generics: [ 'T' ],
        inputs: [{
            id: 'input',
            label: 'Input',
            dataType: 'T',
            rowType: 'input-simple',
        }],
        outputs: [{
            id: 'output',
            label: 'Output',
            dataType: 'T',
            rowType: 'output',
        }],
    },
    interpretation: ({ input }) => ({ output: input }),
});

localDefinitions.push({
    signature: {
        id: 'choose',
        name: 'Choose',
        attributes: {},
        description: null,
        generics: [ 'T' ],
        inputs: [{
            id: 't',
            label: 'Condition',
            dataType: 'boolean',
            rowType: 'input-variable',
            defaultValue: true,
        }, {
            id: 'x1',
            label: 'Match True',
            dataType: 'T',
            rowType: 'input-simple',
        }, {
            id: 'x2',
            label: 'Match False',
            dataType: 'T',
            rowType: 'input-simple',
        }],
        outputs: [{
            id: 'y',
            label: 'Choice',
            dataType: 'T',
            rowType: 'output',
        }],
    },
    interpretation: ({ t, x1, x2 }) => ({ y: t ? x1 : x2 }),
});

localDefinitions.push({
    signature: {
        id: 'boolean',
        name: 'Boolean',
        attributes: {},
        description: null,
        generics: [],
        inputs: [{
            id: 'x',
            label: 'Boolean',
            dataType: 'boolean',
            rowType: 'input-variable',
            defaultValue: false,
        }],
        outputs: [{
            id: 'y',
            label: 'Output',
            dataType: 'boolean',
            rowType: 'output',
        }],
    },
    interpretation: ({ x }) => ({ y: x }),
});
localDefinitions.push({
    signature: {
        id: 'string',
        name: 'String',
        attributes: {},
        description: null,
        generics: [],
        inputs: [{
            id: 'x',
            label: 'String',
            dataType: 'string',
            rowType: 'input-variable',
            defaultValue: '',
        }],
        outputs: [{
            id: 'y',
            label: 'Output',
            dataType: 'string',
            rowType: 'output',
        }],
    },
    interpretation: ({ x }) => ({ y: x }),
})
localDefinitions.push({
    signature: {
        id: 'greater',
        name: 'Greater Than',
        attributes: {},
        description: null,
        generics: [],
        inputs: [
            varNumberRow('a', 0),
            varNumberRow('b', 0),
        ],
        outputs: [{
            id: 'y',
            label: 'Output',
            dataType: 'boolean',
            rowType: 'output',
        }],
    },
    interpretation: ({ a, b }) => ({ y: a > b }),
})

// const test: FlowSignature = {
//     id: 'test',
//     name: 'Test',
//     attributes: {},
//     description: null,
//     inputs: [ 
//         varNumberRow('Number'),
//         {
//             rowType: 'input-variable',
//             id: 'b',
//             label: 'Boolean',
//             dataType: 'boolean',
//             defaultValue: true,
//         },
//         {
//             rowType: 'input-variable',
//             id: 's',
//             label: 'String',
//             dataType: 'string',
//             defaultValue: 'Hello',
//         }

//     ],
//     outputs: [],
// }

export const baseInterpretations = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.interpretation])
);

export const baseSignatures = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.signature])
);
