import { createAnyType, createFunctionType, createListType, createMapType } from "../typeSystem";
import { AnonymousFlowSignature, DestructuredOutputRowSignature, FunctionInputRowSignature, FunctionTypeSpecifier, GenericTag, ListInputRowSignature, OutputRowSignature, SimpleInputRowSignature, TypeSpecifier, VariableInputRowSignature } from "../types";
import { ByteInstruction, ByteOperation, CallableChunk, OperationByteInstruction, byteCodeConstructors } from "../types/byteCode";
import { SignatureDefinition } from "../types/local";

const variable = {
    string: (id: string, defaultValue: string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        // label: autoName(id),
        specifier: 'string',
        defaultValue,
    }),
    number: (id: string, defaultValue: number): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        // label: autoName(id),
        specifier: 'number',
        defaultValue,
    }),
    boolean: (id: string, defaultValue: boolean): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        // label: autoName(id),
        specifier: 'boolean',
        defaultValue,
    }),
};
const simple = {
    string: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        // label: autoName(id),
        specifier: 'string',
    }),
    number: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        // label: autoName(id),
        specifier: 'number',
    }),
    boolean: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        // label: autoName(id),
        specifier: 'boolean',
    }),
    generic: (id: string, specifier: TypeSpecifier): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        // label: autoName(id),
        specifier,
    }),
};
const list = {
    generic: (id: string, listSpecifier: TypeSpecifier): ListInputRowSignature => ({
        id,
        rowType: 'input-list',
        // label: autoName(id),
        specifier: listSpecifier,
    }),
}
const func = (id: string, specifier: FunctionTypeSpecifier | string): FunctionInputRowSignature => ({
    id,
    rowType: 'input-function',
    // label: autoName(id),
    specifier,
});


const output = {
    string: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: 'string',
    }),
    number: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: 'number',
    }),
    boolean: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: 'boolean',
    }),
    generic: (id: string, specifier: TypeSpecifier): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier,
    }),
    destructured: (id: string, specifier: TypeSpecifier): DestructuredOutputRowSignature => ({
        id,
        rowType: 'output-destructured',
        specifier,
    }),
};
const generic = (name: string, constraint: TypeSpecifier | null = null): GenericTag => ({ id: name, constraint });

const { op, data, chunk } = byteCodeConstructors;

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

const callable = (arity: number, instructions: ByteInstruction[]): AnonymousFlowSignature['byteCode'] =>
    ({ type: 'callable', chunk: { arity, instructions } });
const inline = (instructions: ByteInstruction[]): AnonymousFlowSignature['byteCode'] =>
    ({ type: 'inline', instructions });

export const localDefinitions: SignatureDefinition[] = [];
localDefinitions.push({
    signature: {
        id: 'add',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 0), variable.number('b', 0)],
        output: output.number('sum'),
        byteCode: callable(2, [
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
        inputs: [variable.number('a', 0), variable.number('b', 0)],
        output: output.number('difference'),
        byteCode: callable(2, [
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
        inputs: [variable.boolean('a', false), variable.boolean('b', false)],
        output: output.boolean('a_and_b'),
        byteCode: callable(2, [
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
        inputs: [variable.boolean('a', false), variable.boolean('b', false)],
        output: output.boolean('a_or_b'),
        byteCode: callable(2, [
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
        inputs: [variable.number('a', 0)],
        output: output.number('a_truncated'),
        byteCode: callable(1, [
            op(ByteOperation.evaluate),
            op(ByteOperation.ntrunc),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([a]) => Math.floor(a),
});
localDefinitions.push({
    signature: {
        id: 'multiply',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 1), variable.number('b', 1)],
        output: output.number('product'),
        byteCode: callable(2, [
            ...evalthunks(true, true),
            op(ByteOperation.nmul),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([a, b]) => a * b,
});
localDefinitions.push({
    signature: {
        id: 'divide',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 1), variable.number('b', 1)],
        output: output.number('quotient'),
        byteCode: callable(2, [
            ...evalthunks(true, true),
            op(ByteOperation.ndiv),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([a, b]) => a / b,
});

localDefinitions.push({
    signature: {
        id: 'choose',
        attributes: { category: 'Logic' },
        description: null,
        generics: [
            generic('T'),
        ],
        inputs: [
            variable.boolean('condition', true),
            simple.generic('match_true', 'T'),
            simple.generic('match_false', 'T'),
        ],
        output: output.generic('choice', 'T'),
        byteCode: callable(3, [
            op(ByteOperation.evaluate),
            op(ByteOperation.bneg),
            data(1), op(ByteOperation.jc),
            op(ByteOperation.swp),
            op(ByteOperation.pop),
            op(ByteOperation.evaluate),
            op(ByteOperation.return),
        ]),
    },
    interpretation: args => args[0] ? args[1] : args[2],
});

localDefinitions.push({
    signature: {
        id: 'number',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('number', 0)],
        output: output.number('output'),
        byteCode: inline([]),
    },
    interpretation: ([number]) => number,
});
localDefinitions.push({
    signature: {
        id: 'boolean',
        attributes: { category: 'Logic' },
        description: null,
        generics: [],
        inputs: [variable.boolean('boolean', false)],
        output: output.boolean('output'),
        byteCode: inline([]),
    },
    interpretation: ([boolean]) => boolean,
});
localDefinitions.push({
    signature: {
        id: 'string',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [variable.string('string', '')],
        output: output.string('output'),
        byteCode: inline([]),
    },
    interpretation: ([string]) => string,
});

localDefinitions.push({
    signature: {
        id: 'function',
        attributes: { category: 'Functions' },
        description: null,
        generics: [ generic('T', createFunctionType(createAnyType(), createAnyType())) ],
        inputs: [func('_function', 'T')],
        output: output.generic('output', 'T'),
        byteCode: inline([]),
    },
    interpretation: ([string]) => string,
});

localDefinitions.push({
    signature: {
        id: 'greater',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 0), variable.number('b', 0)],
        output: output.boolean('output'),
        byteCode: callable(2, [
            ...evalthunks(true, true),
            op(ByteOperation.ngt),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([a, b]) => a > b,
});

localDefinitions.push({
    signature: {
        id: 'concat_strings',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [
            variable.string('left', ''),
            variable.string('right', ''),
        ],
        output: output.string('concatenated'),
        byteCode: callable(2, [
            ...evalthunks(true, true),
            op(ByteOperation.sconcat),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([left, right]) => left + right,
});
localDefinitions.push({
    signature: {
        id: 'substring',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [
            variable.string('string', ''),
            variable.number('start', 0),
            variable.number('length', 1),
        ],
        output: output.string('substring'),
        byteCode: callable(3, [
            ...evalthunks(true, true, true),
            op(ByteOperation.ssub),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([string, start, length]) => string.slice(start, Math.max(0, start + length)),
});


localDefinitions.push({
    signature: {
        id: 'pack',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            list.generic('elements', createListType('T'))
        ],
        output: output.generic('list', createListType('T')),
        byteCode: inline([]),
    },
    interpretation: ([elements]) => elements,
});
localDefinitions.push({
    signature: {
        id: 'concat_lists',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('left', createListType('T')),
            simple.generic('right', createListType('T')),
        ],
        output: output.generic('concatenated', createListType('T')),
        byteCode: callable(2, [
            ...evalthunks(true, true),
            op(ByteOperation.aconcat),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([left, right]) => left.concat(right),
});
localDefinitions.push({
    signature: {
        id: 'sublist',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
            variable.number('start', 0),
            variable.number('length', 1),
        ],
        output: output.generic('sublist', createListType('T')),
        byteCode: callable(3, [
            ...evalthunks(true, true, true),
            op(ByteOperation.asub),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([list, start, length]) => list.slice(start, Math.max(0, start + length)),
});
localDefinitions.push({
    signature: {
        id: 'access_list',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
            variable.number('index', 0),
        ],
        output: output.generic('element', 'T'),
        byteCode: callable(2, [
            ...evalthunks(true, true),
            op(ByteOperation.swp),
            op(ByteOperation.aget),
            op(ByteOperation.evaluate),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([list, index]) => list.at(index),
});
localDefinitions.push({
    signature: {
        id: 'pop',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
        ],
        output: output.destructured('popped',
            createMapType({ head: 'T', tail: createListType('T') })),
        byteCode: callable(1, [
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
        generics: [generic('T')],
        inputs: [
            simple.generic('head', 'T'),
            simple.generic('tail', createListType('T')),
        ],
        output: output.generic('combined', createListType('T')),
        byteCode: callable(1, [
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
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
        ],
        output: output.number('length'),
        byteCode: callable(1, [
            op(ByteOperation.evaluate),
            data('length'),
            op(ByteOperation.oget),
            op(ByteOperation.return),
        ]),
    },
    interpretation: ([list]) => list.length,
});

localDefinitions.push({
    signature: {
        id: 'evaluate',
        attributes: { category: 'Functions' },
        description: null,
        generics: [generic('P'), generic('R')],
        inputs: [
            func('_function', createFunctionType('P', 'R')),
            { id: 'argument', rowType: 'input-tuple', specifier: 'P' },
        ],
        output: output.generic('return_value', 'R'),
        byteCode: callable(2, [
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
    interpretation: ([_function, argument]) => _function(argument),
});


export const baseInterpretations = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.interpretation])
);

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