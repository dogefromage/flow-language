import { createAnyType, createFunctionType, createGenericType, createListType, createMapType, createPrimitiveType } from "../typeSystem";
import { FlowSignature } from "../types";
import { FlowModule } from "../types/module";
import shorthands from "./shorthands";

const { varRow, simpleRow, outputRow, genParam } = shorthands;

const signatures: FlowSignature[] = [];

signatures.push({
    id: 'add',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 0), varRow.number('b', 0)],
    output: outputRow.number('sum'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.nadd),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'subtract',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 0), varRow.number('b', 0)],
    output: outputRow.number('difference'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.nsub),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'logical_and',
    attributes: { category: 'Logic' },
    description: null,
    generics: [],
    inputs: [varRow.boolean('a', false), varRow.boolean('b', false)],
    output: outputRow.boolean('a_and_b'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.band),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'logical_or',
    attributes: { category: 'Logic' },
    description: null,
    generics: [],
    inputs: [varRow.boolean('a', false), varRow.boolean('b', false)],
    output: outputRow.boolean('a_or_b'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.bor),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'truncate',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 0)],
    output: outputRow.number('a_truncated'),
    // byteCode: callableCode(1, [
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.ntrunc),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'multiply',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 1), varRow.number('b', 1)],
    output: outputRow.number('product'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.nmul),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'divide',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 1), varRow.number('b', 1)],
    output: outputRow.number('quotient'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.ndiv),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'choose',
    attributes: { category: 'Logic' },
    description: null,
    generics: [
        genParam('T'),
    ],
    inputs: [
        varRow.boolean('condition', true),
        simpleRow.generic('match_true', createGenericType('T')),
        simpleRow.generic('match_false', createGenericType('T')),
    ],
    output: outputRow.generic('choice', createGenericType('T')),
    // byteCode: callableCode(3, [
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.bneg),
    //     data(1), op(ByteOperation.jc),
    //     op(ByteOperation.swp),
    //     op(ByteOperation.pop),
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'number',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('n', 0)],
    output: outputRow.number('output'),
    // byteCode: inlineCode([]),

});
signatures.push({
    id: 'boolean',
    attributes: { category: 'Logic' },
    description: null,
    generics: [],
    inputs: [varRow.boolean('b', false)],
    output: outputRow.boolean('output'),
    // byteCode: inlineCode([]),

});
signatures.push({
    id: 'string',
    attributes: { category: 'Strings' },
    description: null,
    generics: [],
    inputs: [varRow.string('s', '')],
    output: outputRow.string('output'),
    // byteCode: inlineCode([]),

});
signatures.push({
    id: 'function',
    attributes: { category: 'Functions' },
    description: null,
    generics: [genParam('F', createFunctionType(createAnyType(), createAnyType()))],
    inputs: [varRow.func('_function', createGenericType('F'))],
    output: outputRow.generic('output', createGenericType('F')),
    // byteCode: inlineCode([]),
});
signatures.push({
    id: 'greater',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 0), varRow.number('b', 0)],
    output: outputRow.boolean('output'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.ngt),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'concat_strings',
    attributes: { category: 'Strings' },
    description: null,
    generics: [],
    inputs: [
        varRow.string('left', ''),
        varRow.string('right', ''),
    ],
    output: outputRow.string('concatenated'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.sconcat),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'substring',
    attributes: { category: 'Strings' },
    description: null,
    generics: [],
    inputs: [
        varRow.string('string', ''),
        varRow.number('start', 0),
        varRow.number('length', 1),
    ],
    output: outputRow.string('substring'),
    // byteCode: callableCode(3, [
    //     ...evalthunks(true, true, true),
    //     op(ByteOperation.ssub),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'pack',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        varRow.list('elements', createListType(createGenericType('T')))
    ],
    output: outputRow.generic('list', createListType(createGenericType('T'))),
    // byteCode: inlineCode([]),
});
signatures.push({
    id: 'concat_lists',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('left', createListType(createGenericType('T'))),
        simpleRow.generic('right', createListType(createGenericType('T'))),
    ],
    output: outputRow.generic('concatenated', createListType(createGenericType('T'))),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.aconcat),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'sublist',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
        varRow.number('start', 0),
        varRow.number('length', 1),
    ],
    output: outputRow.generic('sublist', createListType(createGenericType('T'))),
    // byteCode: callableCode(3, [
    //     ...evalthunks(true, true, true),
    //     op(ByteOperation.asub),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'access_list',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
        varRow.number('index', 0),
    ],
    output: outputRow.generic('element', createGenericType('T')),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.swp),
    //     op(ByteOperation.aget),
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'pop',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
    ],
    output: outputRow.destructured('popped',
        createMapType({ head: createGenericType('T'), tail: createListType(createGenericType('T')) })),
    // byteCode: callableCode(1, [
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.apop),
    //     op(ByteOperation.moveaside),
    //     op(ByteOperation.thunk_id),
    //     data('tail'),
    //     op(ByteOperation.moveback),
    //     data('head'),
    //     data(2),
    //     op(ByteOperation.opack),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'push',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('head', createGenericType('T')),
        simpleRow.generic('tail', createListType(createGenericType('T'))),
    ],
    output: outputRow.generic('combined', createListType(createGenericType('T'))),
    // byteCode: callableCode(1, [
    //     ...evalthunks(false, true),
    //     op(ByteOperation.apush),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'length',
    attributes: { category: 'Lists' },
    description: null,
    generics: [genParam('T')],
    inputs: [
        simpleRow.generic('list', createListType(createGenericType('T'))),
    ],
    output: outputRow.number('length'),
    // byteCode: callableCode(1, [
    //     op(ByteOperation.evaluate),
    //     data('length'),
    //     op(ByteOperation.oget),
    //     op(ByteOperation.return),
    // ]),
});
signatures.push({
    id: 'evaluate',
    attributes: { category: 'Functions' },
    description: null,
    generics: [genParam('P'), genParam('R')],
    inputs: [
        varRow.func('_function', createFunctionType(createGenericType('P'), createGenericType('R'))),
        varRow.tuple('_arguments', createGenericType('P')),
    ],
    output: outputRow.generic('return_value', createGenericType('R')),
    // byteCode: callableCode(2, [
    //     // spread arg tuple onto stack
    //     op(ByteOperation.moveaside),
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.aspread),
    //     op(ByteOperation.moveback),
    //     // call by thunked name
    //     op(ByteOperation.evaluate),
    //     op(ByteOperation.call),
    //     op(ByteOperation.return),
    // ]),
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