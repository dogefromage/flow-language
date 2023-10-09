import { createAnyType, createFunctionType, createListType, createMapType } from "../typeSystem";
import { ByteOperation, CallableChunk, OperationByteInstruction, byteCodeShorthands } from "../types/byteCode";
import { SignatureDefinition } from "../types/local";
import shorthands from "./shorthands";

const { varRow, simpleRow, outputRow, genParam, callableCode, inlineCode } = shorthands;
const { op, data, chunk } = byteCodeShorthands;

const evalthunks = (...evaluateArgs: boolean[]) => {
    // assume order doesn't matter
    const instructions: OperationByteInstruction[] = [];

    for (let i = 0; i < evaluateArgs.length; i++) {
        instructions.push(op(ByteOperation.moveaside));
    }
    for (let i = evaluateArgs.length - 1; i >= 0; i--) {
        instructions.push(op(ByteOperation.moveback));
        if (evaluateArgs[i]) {
            instructions.push(op(ByteOperation.evaluate));
        }
    }

    // optimize
    for (let i = 0; i < instructions.length - 1; i++) {
        if (instructions[i + 0].operation === ByteOperation.moveaside &&
            instructions[i + 1].operation === ByteOperation.moveback) {
            instructions.splice(i, 2);
            i--;
        }
    }

    return instructions;
}

export const localDefinitions: SignatureDefinition[] = [];
localDefinitions.push({
    signature: {
        id: 'add',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('a', 0), varRow.number('b', 0)],
        output: outputRow.number('sum'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.nadd),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'subtract',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('a', 0), varRow.number('b', 0)],
        output: outputRow.number('difference'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.nsub),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'logical_and',
        attributes: { category: 'Logic' },
        description: null,
        generics: [],
        inputs: [varRow.boolean('a', false), varRow.boolean('b', false)],
        output: outputRow.boolean('a_and_b'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.band),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'logical_or',
        attributes: { category: 'Logic' },
        description: null,
        generics: [],
        inputs: [varRow.boolean('a', false), varRow.boolean('b', false)],
        output: outputRow.boolean('a_or_b'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.bor),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'truncate',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('a', 0)],
        output: outputRow.number('a_truncated'),
        byteCode: callableCode(1, [
            op(ByteOperation.evaluate),
            op(ByteOperation.ntrunc),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'multiply',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('a', 1), varRow.number('b', 1)],
        output: outputRow.number('product'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.nmul),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'divide',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('a', 1), varRow.number('b', 1)],
        output: outputRow.number('quotient'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.ndiv),
            op(ByteOperation.return),
        ]),
    },
});

localDefinitions.push({
    signature: {
        id: 'choose',
        attributes: { category: 'Logic' },
        description: null,
        generics: [
            genParam('T'),
        ],
        inputs: [
            varRow.boolean('condition', true),
            simpleRow.generic('match_true', 'T'),
            simpleRow.generic('match_false', 'T'),
        ],
        output: outputRow.generic('choice', 'T'),
        byteCode: callableCode(3, [
            op(ByteOperation.evaluate),
            op(ByteOperation.bneg),
            data(1), op(ByteOperation.jc),
            op(ByteOperation.swp),
            op(ByteOperation.pop),
            op(ByteOperation.evaluate),
            op(ByteOperation.return),
        ]),
    },
});

localDefinitions.push({
    signature: {
        id: 'number',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('number', 0)],
        output: outputRow.number('output'),
        byteCode: inlineCode([]),
    },
});
localDefinitions.push({
    signature: {
        id: 'boolean',
        attributes: { category: 'Logic' },
        description: null,
        generics: [],
        inputs: [varRow.boolean('boolean', false)],
        output: outputRow.boolean('output'),
        byteCode: inlineCode([]),
    },
});
localDefinitions.push({
    signature: {
        id: 'string',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [varRow.string('string', '')],
        output: outputRow.string('output'),
        byteCode: inlineCode([]),
    },
});

localDefinitions.push({
    signature: {
        id: 'function',
        attributes: { category: 'Functions' },
        description: null,
        generics: [genParam('F', createFunctionType(createAnyType(), createAnyType()))],
        inputs: [varRow.func('_function', 'F')],
        output: outputRow.generic('output', 'F'),
        byteCode: inlineCode([]),
    },
});

localDefinitions.push({
    signature: {
        id: 'greater',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [varRow.number('a', 0), varRow.number('b', 0)],
        output: outputRow.boolean('output'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.ngt),
            op(ByteOperation.return),
        ]),
    },
});

localDefinitions.push({
    signature: {
        id: 'concat_strings',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [
            varRow.string('left', ''),
            varRow.string('right', ''),
        ],
        output: outputRow.string('concatenated'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.sconcat),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
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
        byteCode: callableCode(3, [
            ...evalthunks(true, true, true),
            op(ByteOperation.ssub),
            op(ByteOperation.return),
        ]),
    },
});


localDefinitions.push({
    signature: {
        id: 'pack',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            varRow.list('elements', createListType('T'))
        ],
        output: outputRow.generic('list', createListType('T')),
        byteCode: inlineCode([]),
    },
});
localDefinitions.push({
    signature: {
        id: 'concat_lists',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            simpleRow.generic('left', createListType('T')),
            simpleRow.generic('right', createListType('T')),
        ],
        output: outputRow.generic('concatenated', createListType('T')),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.aconcat),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'sublist',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            simpleRow.generic('list', createListType('T')),
            varRow.number('start', 0),
            varRow.number('length', 1),
        ],
        output: outputRow.generic('sublist', createListType('T')),
        byteCode: callableCode(3, [
            ...evalthunks(true, true, true),
            op(ByteOperation.asub),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'access_list',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            simpleRow.generic('list', createListType('T')),
            varRow.number('index', 0),
        ],
        output: outputRow.generic('element', 'T'),
        byteCode: callableCode(2, [
            ...evalthunks(true, true),
            op(ByteOperation.swp),
            op(ByteOperation.aget),
            op(ByteOperation.evaluate),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'pop',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            simpleRow.generic('list', createListType('T')),
        ],
        output: outputRow.destructured('popped',
            createMapType({ head: 'T', tail: createListType('T') })),
        byteCode: callableCode(1, [
            op(ByteOperation.evaluate),
            op(ByteOperation.apop),
            op(ByteOperation.moveaside),
            op(ByteOperation.thunk_id),
            data('tail'),
            op(ByteOperation.moveback),
            data('head'),
            data(2),
            op(ByteOperation.opack),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'push',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            simpleRow.generic('head', 'T'),
            simpleRow.generic('tail', createListType('T')),
        ],
        output: outputRow.generic('combined', createListType('T')),
        byteCode: callableCode(1, [
            ...evalthunks(false, true),
            op(ByteOperation.apush),
            op(ByteOperation.return),
        ]),
    },
});
localDefinitions.push({
    signature: {
        id: 'length',
        attributes: { category: 'Lists' },
        description: null,
        generics: [genParam('T')],
        inputs: [
            simpleRow.generic('list', createListType('T')),
        ],
        output: outputRow.number('length'),
        byteCode: callableCode(1, [
            op(ByteOperation.evaluate),
            data('length'),
            op(ByteOperation.oget),
            op(ByteOperation.return),
        ]),
    },
});

localDefinitions.push({
    signature: {
        id: 'evaluate',
        attributes: { category: 'Functions' },
        description: null,
        generics: [genParam('P'), genParam('R')],
        inputs: [
            varRow.func('_function', createFunctionType('P', 'R')),
            varRow.tuple('_arguments', 'P'),
        ],
        output: outputRow.generic('return_value', 'R'),
        byteCode: callableCode(2, [
            // spread arg tuple onto stack
            op(ByteOperation.moveaside),
            op(ByteOperation.evaluate),
            op(ByteOperation.aspread),
            op(ByteOperation.moveback),
            // call by thunked name
            op(ByteOperation.evaluate),
            op(ByteOperation.call),
            op(ByteOperation.return),
        ])
    },
});

export const baseSignatures = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.signature])
);


export const helperChunks: Record<string, CallableChunk> = {
    obj_get: {
        arity: 2,
        instructions: [
            // object get but thunked.
            // expects: ( k, () -> { k: () -> v } )
            // returns: v
            ...evalthunks(false, true), // eval objects thunk
            op(ByteOperation.oget),
            op(ByteOperation.evaluate), // eval members thunk
            op(ByteOperation.return),
        ]
    },
    wrap_value: {
        arity: 1,
        instructions: [
            // simply returns an UNTHUNKED object such that we can
            // thunk a plain object using this helper 
            op(ByteOperation.return),
        ]
    },
}