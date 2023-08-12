import { upperFirst } from "lodash";
import { InputRowSignature, OutputRowSignature } from "../types";
import { SignatureDefinition } from "../types/local";

export const localDefinitions: SignatureDefinition[] = [];

const varNumberRow = (tag: string, defaultValue = 0): InputRowSignature => ({
    rowType: 'input-variable',
    id: tag,
    label: upperFirst(tag),
    specifier: 'number',
    defaultValue,
});
const outNumberRow = (tag: string): OutputRowSignature => ({
    rowType: 'output',
    id: tag,
    label: upperFirst(tag),
    specifier: 'number',
});

localDefinitions.push({
    signature: {
        id: 'add',
        name: 'Add',
        attributes: { category: 'Basic' },
        description: null,
        generics: [],
        inputs: [varNumberRow('a'), varNumberRow('b')],
        outputs: [outNumberRow('sum')],
    },
    interpretation: args => ({ sum: args.a + args.b }),
});

localDefinitions.push({
    signature: {
        id: 'multiply',
        name: 'Multiply',
        attributes: { category: 'Basic' },
        description: null,
        generics: [],
        inputs: [varNumberRow('a', 1), varNumberRow('b', 1)],
        outputs: [outNumberRow('product')],
    },
    interpretation: args => ({ product: args.a * args.b }),
});

localDefinitions.push({
    signature: {
        id: 'sine',
        name: 'Sine',
        attributes: { category: 'Basic', color: '#b32248' },
        description: null,
        generics: [],
        inputs: [varNumberRow('angle', 0)],
        outputs: [outNumberRow('sine')],
    },
    interpretation: args => ({ sine: Math.sin(args.angle) }),
});

localDefinitions.push({
    signature: {
        id: 'random',
        name: 'Random [0,1)',
        attributes: { category: 'Basic', color: '#b32248' },
        description: null,
        generics: [],
        inputs: [],
        outputs: [outNumberRow('value')],
    },
    interpretation: args => ({ value: Math.random() }),
});

localDefinitions.push({
    signature: {
        id: 'generic_passthrough',
        name: 'Generic Passthrough',
        attributes: { category: 'Basic' },
        description: null,
        generics: [ 'T' ],
        inputs: [{
            id: 'input',
            label: 'Input',
            specifier: 'T',
            rowType: 'input-simple',
        }],
        outputs: [{
            id: 'output',
            label: 'Output',
            specifier: 'T',
            rowType: 'output',
        }],
    },
    interpretation: args => ({ output: args.input }),
});

localDefinitions.push({
    signature: {
        id: 'choose',
        name: 'Choose',
        attributes: { category: 'Basic' },
        description: null,
        generics: [ 'T' ],
        inputs: [{
            id: 't',
            label: 'Condition',
            specifier: 'boolean',
            rowType: 'input-variable',
            defaultValue: true,
        }, {
            id: 'x1',
            label: 'Match True',
            specifier: 'T',
            rowType: 'input-simple',
        }, {
            id: 'x2',
            label: 'Match False',
            specifier: 'T',
            rowType: 'input-simple',
        }],
        outputs: [{
            id: 'y',
            label: 'Choice',
            specifier: 'T',
            rowType: 'output',
        }],
    },
    interpretation: args => ({ y: args.t ? args.x1 : args.x2 }),
});

localDefinitions.push({
    signature: {
        id: 'number',
        name: 'Number',
        attributes: { category: 'Basic' },
        description: null,
        generics: [],
        inputs: [{
            id: 'x',
            label: 'Number',
            specifier: 'number',
            rowType: 'input-variable',
            defaultValue: 0,
        }],
        outputs: [{
            id: 'y',
            label: 'Output',
            specifier: 'number',
            rowType: 'output',
        }],
    },
    interpretation: args => ({ y: args.x }),
});
localDefinitions.push({
    signature: {
        id: 'boolean',
        name: 'Boolean',
        attributes: { category: 'Basic' },
        description: null,
        generics: [],
        inputs: [{
            id: 'x',
            label: 'Boolean',
            specifier: 'boolean',
            rowType: 'input-variable',
            defaultValue: false,
        }],
        outputs: [{
            id: 'y',
            label: 'Output',
            specifier: 'boolean',
            rowType: 'output',
        }],
    },
    interpretation: args => ({ y: args.x }),
});
localDefinitions.push({
    signature: {
        id: 'string',
        name: 'String',
        attributes: { category: 'Basic' },
        description: null,
        generics: [],
        inputs: [{
            id: 'x',
            label: 'String',
            specifier: 'string',
            rowType: 'input-variable',
            defaultValue: '',
        }],
        outputs: [{
            id: 'y',
            label: 'Output',
            specifier: 'string',
            rowType: 'output',
        }],
    },
    interpretation: args => ({ y: args.x }),
})
localDefinitions.push({
    signature: {
        id: 'greater',
        name: 'Greater Than',
        attributes: { category: 'Basic' },
        description: null,
        generics: [],
        inputs: [
            varNumberRow('a', 0),
            varNumberRow('b', 0),
        ],
        outputs: [{
            id: 'y',
            label: 'Output',
            specifier: 'boolean',
            rowType: 'output',
        }],
    },
    interpretation: args => ({ y: args.a > args.b }),
})

localDefinitions.push({
    signature: {
        id: 'log_a',
        name: 'Log A',
        attributes: { category: 'Dev', color: '#b32248' },
        description: null,
        generics: [],
        inputs: [],
        outputs: [outNumberRow('zero')],
    },
    interpretation: args => {
        console.log('A');
        return { zero: 0 };
    },
});
localDefinitions.push({
    signature: {
        id: 'log_b',
        name: 'Log B',
        attributes: { category: 'Dev', color: '#b32248' },
        description: null,
        generics: [],
        inputs: [],
        outputs: [outNumberRow('zero')],
    },
    interpretation: args => {
        console.log('B');
        return { zero: 0 };
    },
});

// const test: FlowSignature = {
//     id: 'test',
//     name: 'Test',
//     attributes: { category: 'Basic' },
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
