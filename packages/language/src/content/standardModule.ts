import { createAnyType, createFunctionType, createGenericType, createListType, createMapType, createPrimitiveType } from "../typeSystem";
import { FlowSignature } from "../types";
import { FlowModule } from "../types/module";
import shorthands from "./shorthands";

const { varRow, simpleRow, outputRow, genParam } = shorthands;

const signatures: FlowSignature[] = [];

signatures.push({
    id: 'add',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns their sum.'
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 }), varRow.number('b', { defaultValue: 0 })],
    output: outputRow.alias('sum', 'number'),
});
signatures.push({
    id: 'subtract',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns their difference.'
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 }), varRow.number('b', { defaultValue: 0 })],
    output: outputRow.alias('difference', 'number'),
});
signatures.push({
    id: 'logical_and',
    attributes: {
        category: 'Logic',
        description: 'Takes two boolean values and returns true if both values are true, otherwise, it returns false.'
    },
    generics: [],
    inputs: [varRow.boolean('a', { defaultValue: false }), varRow.boolean('b', { defaultValue: false })],
    output: outputRow.alias('a_and_b', 'boolean'),
});
signatures.push({
    id: 'logical_or',
    attributes: {
        category: 'Logic',
        description: 'Takes two boolean values and returns true if at least one of the values is true, otherwise, it returns false.'
    },
    generics: [],
    inputs: [varRow.boolean('a', { defaultValue: false }), varRow.boolean('b', { defaultValue: false })],
    output: outputRow.alias('a_or_b', 'boolean'),
});
signatures.push({
    id: 'truncate',
    attributes: {
        category: 'Numbers',
        description: 'Takes a number and removes the decimal portion, returning the integer part.'
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 })],
    output: outputRow.alias('a_truncated', 'number'),
});
signatures.push({
    id: 'multiply',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns their product.'
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 1 }), varRow.number('b', { defaultValue: 1 })],
    output: outputRow.alias('product', 'number'),
});
signatures.push({
    id: 'divide',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns their quotient.'
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 1 }), varRow.number('b', { defaultValue: 1 })],
    output: outputRow.alias('quotient', 'number'),
});
signatures.push({
    id: 'choose',
    attributes: {
        category: 'Logic',
        description: 'Takes a condition and two values. If the condition is true, it returns the first value; otherwise, it returns the second value. Only the condition and chosen value will get evaluated.'
    },
    generics: [
        genParam('T'),
    ],
    inputs: [
        varRow.boolean('condition', { defaultValue: false }),
        simpleRow.generic('match_true', createGenericType('T')),
        simpleRow.generic('match_false', createGenericType('T')),
    ],
    output: outputRow.custom('choice', createGenericType('T')),
});
signatures.push({
    id: 'number',
    attributes: {
        category: 'Numbers',
        description: 'An input field for a number.'
    },
    generics: [],
    inputs: [varRow.number('n', { defaultValue: 0 })],
    output: outputRow.alias('output', 'number'),

});
signatures.push({
    id: 'boolean',
    attributes: {
        category: 'Logic',
        description: 'An input field for a boolean. A booleans value is either true or false.',
    },
    generics: [],
    inputs: [varRow.boolean('b', { defaultValue: false })],
    output: outputRow.alias('output', 'boolean'),

});
signatures.push({
    id: 'string',
    attributes: {
        category: 'Strings',
        description: 'An input field for a string. A string is any sequence of characters.'
    },
    generics: [],
    inputs: [varRow.string('s', { defaultValue: '' })],
    output: outputRow.alias('output', 'string'),

});
signatures.push({
    id: 'function',
    attributes: {
        category: 'Functions',
        description: 'An input field for a function reference. The function must be available in the current scope.',
    },
    generics: [genParam('F', createFunctionType(createAnyType(), createAnyType()))],
    inputs: [varRow.func('_function', createGenericType('F'))],
    output: outputRow.custom('output', createGenericType('F')),
});
signatures.push({
    id: 'greater',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns true if the first value is greater than the second, otherwise, it returns false.',
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 }), varRow.number('b', { defaultValue: 0 })],
    output: outputRow.alias('output', 'boolean'),
});
signatures.push({
    id: 'greater_equal',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns true if the first value is greater than or equal to the second, otherwise, it returns false.',
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 }), varRow.number('b', { defaultValue: 0 })],
    output: outputRow.alias('output', 'boolean'),
});
signatures.push({
    id: 'less',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns true if the first value is less than the second, otherwise, it returns false.',
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 }), varRow.number('b', { defaultValue: 0 })],
    output: outputRow.alias('output', 'boolean'),
});
signatures.push({
    id: 'less_equal',
    attributes: {
        category: 'Numbers',
        description: 'Takes two numbers and returns true if the first value is less than or equal to the second, otherwise, it returns false.',
    },
    generics: [],
    inputs: [varRow.number('a', { defaultValue: 0 }), varRow.number('b', { defaultValue: 0 })],
    output: outputRow.alias('output', 'boolean'),
});
signatures.push({
    id: 'concat_strings',
    attributes: {
        category: 'Strings',
        description: 'Combines two strings into a single one, by concatenating them together.',
    },
    generics: [],
    inputs: [
        varRow.string('left', { defaultValue: '' }),
        varRow.string('right', { defaultValue: '' }),
    ],
    output: outputRow.alias('concatenated', 'string'),
});
signatures.push({
    id: 'substring',
    attributes: {
        category: 'Strings',
        description: 'Takes a string and extracts a portion of it based on specified start index and length.',
    },
    generics: [],
    inputs: [
        varRow.string('string', { defaultValue: '' }),
        varRow.number('start', { defaultValue: 0 }),
        varRow.number('length', { defaultValue: 1 }),
    ],
    output: outputRow.alias('substring', 'string'),
});
signatures.push({
    id: 'list',
    attributes: {
        category: 'Lists',
        description: 'Constructs multiple elements into a list in the given order.',
    },
    generics: [genParam('T')],
    inputs: [
        varRow.list('elements', createListType(createGenericType('T')), { defaultDestructure: true }),
    ],
    output: outputRow.custom('list', createListType(createGenericType('T'))),
});
signatures.push({
    id: 'concat_lists',
    attributes: {
        category: 'Lists',
        description: 'Combines two lists into a single one, by concatenating them together.',
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('left', createListType(createGenericType('T'))),
        simpleRow.generic('right', createListType(createGenericType('T'))),
    ],
    output: outputRow.custom('concatenated', createListType(createGenericType('T'))),
});
signatures.push({
    id: 'sublist',
    attributes: {
        category: 'Lists',
        description: 'Takes a list and extracts a portion of it based on specified start index and length.',
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
        varRow.number('start', { defaultValue: 0 }),
        varRow.number('length', { defaultValue: 1 }),
    ],
    output: outputRow.custom('sublist', createListType(createGenericType('T'))),
});
signatures.push({
    id: 'access_list',
    attributes: {
        category: 'Lists',
        description: 'Retrieves the value at a specified index in a list.',
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
        varRow.number('index', { defaultValue: 0 }),
    ],
    output: outputRow.custom('element', createGenericType('T')),
});
signatures.push({
    id: 'pop',
    attributes: {
        category: 'Lists',
        description: 'Takes a list and returns its head and the remaining list seperate. Throws a runtime error if the list is empty.',
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
    ],
    output: outputRow.custom('popped',
        createMapType({ head: createGenericType('T'), tail: createListType(createGenericType('T')) }),
        { defaultDestructure: true },
    ),
});
signatures.push({
    id: 'push',
    attributes: {
        category: 'Lists',
        description: 'Adds an element to the start of a list, returning a new one.',
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('head', createGenericType('T')),
        simpleRow.generic('tail', createListType(createGenericType('T'))),
    ],
    output: outputRow.custom('combined', createListType(createGenericType('T'))),
});
signatures.push({
    id: 'length',
    attributes: {
        category: 'Lists',
        description: 'Returns the number of elements in a list.'
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
    ],
    output: outputRow.alias('length', 'number'),
});
signatures.push({
    id: 'evaluate',
    attributes: {
        category: 'Functions',
        description: 'Evaluates a given function using the specified arguments and returns its result.',
    },
    generics: [genParam('P'), genParam('R')],
    inputs: [
        varRow.func('_function', createFunctionType(createGenericType('P'), createGenericType('R'))),
        varRow.tuple('_arguments', createGenericType('P')),
    ],
    output: outputRow.custom('return_value', createGenericType('R')),
});
signatures.push({
    id: 'destructure',
    attributes: {
        category: 'Data',
        description: 'Destructures tuple or object type into separate rows.',
    },
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('structure', createGenericType('T')),
    ],
    output: outputRow.custom('destructured', createGenericType('T'), { defaultDestructure: true }),
});
signatures.push({
    id: 'dictionary',
    attributes: {
        category: 'Dictionaries',
        description: 'Constructs a dictionary containing pairs of keys and values.',
    },
    generics: [{ id: 'M', constraint: createMapType({}) }],
    inputs: [
        varRow.map('elements', createGenericType('M'), { defaultDestructure: true }),
    ],
    output: outputRow.custom('dictionary', createGenericType('M')),
});



export const primitiveTypes = {
    number: createPrimitiveType('number'),
    string: createPrimitiveType('string'),
    boolean: createPrimitiveType('boolean'),
}

export const standardModule: FlowModule = {
    name: 'standard',
    declarations: {
        signatures,
        types: primitiveTypes,
    },
    source: null,
};