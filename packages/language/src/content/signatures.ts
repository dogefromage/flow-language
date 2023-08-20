import { upperFirst } from "lodash";
import { SignatureDefinition } from "../types/local";
import { OutputRowSignature, SimpleInputRowSignature, VariableInputRowSignature } from "../types";

function autoName(id: string) {
    return id
        .split('_')
        .map(upperFirst)
        .join(' ');
}
const variable = {
    string: (id: string, defaultValue: string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        label: autoName(id),
        specifier: 'string',
        defaultValue,
    }),
    number: (id: string, defaultValue: number): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        label: autoName(id),
        specifier: 'number',
        defaultValue,
    }),
    boolean: (id: string, defaultValue: boolean): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        label: autoName(id),
        specifier: 'boolean',
        defaultValue,
    }),
};
const simple = {
    string: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        label: autoName(id),
        specifier: 'string',
    }),
    number: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        label: autoName(id),
        specifier: 'number',
    }),
    boolean: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        label: autoName(id),
        specifier: 'boolean',
    }),
    generic: (id: string, specifier: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        label: autoName(id),
        specifier,
    }),
};
const output = {
    string: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output',
        label: autoName(id),
        specifier: 'string',
    }),
    number: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output',
        label: autoName(id),
        specifier: 'number',
    }),
    boolean: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output',
        label: autoName(id),
        specifier: 'boolean',
    }),
    generic: (id: string, specifier: string): OutputRowSignature => ({
        id,
        rowType: 'output',
        label: autoName(id),
        specifier,
    }),
};

export const localDefinitions: SignatureDefinition[] = [];
localDefinitions.push({
    signature: {
        id: 'add',
        name: 'Add',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 0), variable.number('b', 0)],
        outputs: [output.number('sum')],
    },
    interpretation: args => ({ sum: args.a + args.b }),
});

localDefinitions.push({
    signature: {
        id: 'multiply',
        name: 'Multiply',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 1), variable.number('b', 1)],
        outputs: [output.number('product')],
    },
    interpretation: args => ({ product: args.a * args.b }),
});

localDefinitions.push({
    signature: {
        id: 'sine',
        name: 'Sine',
        attributes: { category: 'Math', color: '#b32248' },
        description: null,
        generics: [],
        inputs: [variable.number('angle', 0)],
        outputs: [output.number('sine')],
    },
    interpretation: args => ({ sine: Math.sin(args.angle) }),
});

localDefinitions.push({
    signature: {
        id: 'random',
        name: 'Random [0,1)',
        attributes: { category: 'Math', color: '#b32248' },
        description: null,
        generics: [],
        inputs: [],
        outputs: [output.number('value')],
    },
    interpretation: args => ({ value: Math.random() }),
});

localDefinitions.push({
    signature: {
        id: 'choose',
        name: 'Choose',
        attributes: { category: 'Logic' },
        description: null,
        generics: ['T'],
        inputs: [
            variable.boolean('condition', true),
            simple.generic('match_true', 'T'),
            simple.generic('match_false', 'T'),
        ],
        outputs: [
            output.generic('choice', 'T'),
        ],
    },
    interpretation: args => ({ choice: args.condition ? args.match_true : args.match_false }),
});

localDefinitions.push({
    signature: {
        id: 'number',
        name: 'Number',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('number', 0)],
        outputs: [output.number('output')],
    },
    interpretation: args => ({ output: args.number }),
});
localDefinitions.push({
    signature: {
        id: 'boolean',
        name: 'Boolean',
        attributes: { category: 'Logic' },
        description: null,
        generics: [],
        inputs: [variable.boolean('boolean', false)],
        outputs: [output.boolean('output')],
    },
    interpretation: args => ({ output: args.boolean }),
});
localDefinitions.push({
    signature: {
        id: 'string',
        name: 'String',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [variable.string('string', '')],
        outputs: [output.string('output')],
    },
    interpretation: args => ({ output: args.string }),
});
localDefinitions.push({
    signature: {
        id: 'greater',
        name: 'Greater Than',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [ variable.number('a', 0), variable.number('b',0) ],
        outputs: [ output.boolean('output') ],
    },
    interpretation: args => ({ output: args.a > args.b }),
});


localDefinitions.push({
    signature: {
        id: 'concat',
        name: 'Concat Strings',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [
            variable.string('left', ''),
            variable.string('right', ''),
        ],
        outputs: [
            output.string('concatenated'),
        ],
    },
    interpretation: args => ({ concatenated: args.left + args.right }),
});



export const baseInterpretations = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.interpretation])
);

export const baseSignatures = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.signature])
);
