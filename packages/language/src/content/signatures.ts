import { createFunctionType, createListType } from "../typeSystem";
import { FunctionInputRowSignature, FunctionTypeSpecifier, GenericTag, ListInputRowSignature, OutputRowSignature, SimpleInputRowSignature, TypeSpecifier, VariableInputRowSignature } from "../types";
import { ByteInstruction, ByteOperation, ConcreteValue } from "../types/byteCode";
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
const func = (id: string, specifier: FunctionTypeSpecifier): FunctionInputRowSignature => ({
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
};
const generic = (name: string, constraint: TypeSpecifier | null = null): GenericTag => ({ id: name, constraint });

const op = (o: ByteOperation): ByteInstruction => ({ type: 'operation', operation: o });
const data = (d: ConcreteValue): ByteInstruction => ({ type: 'data', data: d });

export const localDefinitions: SignatureDefinition[] = [];
localDefinitions.push({
    signature: {
        id: 'add',
        // name: 'Add',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 0), variable.number('b', 0)],
        output: output.number('sum'),
        byteCode: {
            type: 'inline',
            instructions: [op(ByteOperation.nadd)],
        }
    },
    interpretation: ([a, b]) => a + b,
});
localDefinitions.push({
    signature: {
        id: 'truncate',
        // name: 'Truncate',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 0)],
        output: output.number('a_truncated'),
        byteCode: {
            type: 'inline',
            instructions: [ op(ByteOperation.ntrunc) ],
        }
    },
    interpretation: ([a]) => Math.floor(a),
});
localDefinitions.push({
    signature: {
        id: 'multiply',
        // name: 'Multiply',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 1), variable.number('b', 1)],
        output: output.number('product'),
        byteCode: {
            type: 'inline',
            instructions: [op(ByteOperation.nmul)],
        }
    },
    interpretation: ([a, b]) => a * b,
});
localDefinitions.push({
    signature: {
        id: 'divide',
        // name: 'Divide',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 1), variable.number('b', 1)],
        output: output.number('quotient'),
        byteCode: {
            type: 'inline',
            instructions: [op(ByteOperation.ndiv)],
        }
    },
    interpretation: ([a, b]) => a / b,
});

// localDefinitions.push({
//     signature: {
//         id: 'sine',
//         // name: 'Sine',
//         attributes: { category: 'Math', color: '#b32248' },
//         description: null,
//         generics: [],
//         inputs: [variable.number('angle', 0)],
//         output: output.number('sine'),
//     },
//     interpretation: ([angle]) => Math.sin(angle),
// });

// localDefinitions.push({
//     signature: {
//         id: 'random',
//         // name: 'Random [0,1)',
//         attributes: { category: 'Math', color: '#b32248' },
//         description: null,
//         generics: [],
//         inputs: [],
//         output: output.number('value'),
//     },
//     interpretation: () => Math.random(),
// });

localDefinitions.push({
    signature: {
        id: 'choose',
        // name: 'Choose',
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
        byteCode: {
            type: 'inline',
            instructions: [
                op(ByteOperation.bneg),
                data(1), op(ByteOperation.jc),
                op(ByteOperation.swp),
                op(ByteOperation.pop),
            ],
        }
    },
    interpretation: args => args[0] ? args[1] : args[2],
});

localDefinitions.push({
    signature: {
        id: 'number',
        // name: 'Number',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('number', 0)],
        output: output.number('output'),
        byteCode: {
            type: 'inline',
            instructions: [],
        }
    },
    interpretation: ([number]) => number,
});
localDefinitions.push({
    signature: {
        id: 'boolean',
        // name: 'Boolean',
        attributes: { category: 'Logic' },
        description: null,
        generics: [],
        inputs: [variable.boolean('boolean', false)],
        output: output.boolean('output'),
        byteCode: {
            type: 'inline',
            instructions: [],
        }
    },
    interpretation: ([boolean]) => boolean,
});
localDefinitions.push({
    signature: {
        id: 'string',
        // name: 'String',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [variable.string('string', '')],
        output: output.string('output'),
        byteCode: {
            type: 'inline',
            instructions: [],
        }
    },
    interpretation: ([string]) => string,
});
localDefinitions.push({
    signature: {
        id: 'greater',
        // name: 'Greater Than',
        attributes: { category: 'Numbers' },
        description: null,
        generics: [],
        inputs: [variable.number('a', 0), variable.number('b', 0)],
        output: output.boolean('output'),
        byteCode: {
            type: 'inline',
            instructions: [op(ByteOperation.ngt)],
        }
    },
    interpretation: ([a, b]) => a > b,
});

localDefinitions.push({
    signature: {
        id: 'concat_strings',
        // name: 'Concat Strings',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [
            variable.string('left', ''),
            variable.string('right', ''),
        ],
        output: output.string('concatenated'),
        byteCode: {
            type: 'inline',
            instructions: [ op(ByteOperation.sconcat) ],
        },
    },
    interpretation: ([left, right]) => left + right,
});
localDefinitions.push({
    signature: {
        id: 'substring',
        // name: 'Substring',
        attributes: { category: 'Strings' },
        description: null,
        generics: [],
        inputs: [
            variable.string('string', ''),
            variable.number('start', 0),
            variable.number('length', 1),
        ],
        output: output.string('substring'),
        byteCode: {
            type: 'inline',
            instructions: [ op(ByteOperation.ssub) ],
        },
    },
    interpretation: ([string, start, length]) => string.slice(start, Math.max(0, start + length)),
});


localDefinitions.push({
    signature: {
        id: 'pack',
        // name: 'Pack List',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            list.generic('elements', createListType('T'))
        ],
        output: output.generic('list', createListType('T')),
        byteCode: {
            type: 'inline',
            instructions: [],
        }
    },
    interpretation: ([elements]) => elements,
});
localDefinitions.push({
    signature: {
        id: 'concat_lists',
        // name: 'Concat Lists',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('left', createListType('T')),
            simple.generic('right', createListType('T')),
        ],
        output: output.generic('concatenated', createListType('T')),
        byteCode: {
            type: 'inline',
            instructions: [ op(ByteOperation.aconcat) ],
        }
    },
    interpretation: ([left, right]) => left.concat(right),
});
localDefinitions.push({
    signature: {
        id: 'sublist',
        // name: 'Sublist',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
            variable.number('start', 0),
            variable.number('length', 1),
        ],
        output: output.generic('sublist', createListType('T')),
        byteCode: {
            type: 'inline',
            instructions: [ op(ByteOperation.asub) ],
        },
    },
    interpretation: ([list, start, length]) => list.slice(start, Math.max(0, start + length)),
});
localDefinitions.push({
    signature: {
        id: 'access_list',
        // name: 'Access List',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
            variable.number('index', 0),
        ],
        output: output.generic('element', 'T'),
        byteCode: {
            type: 'inline',
            instructions: [
                op(ByteOperation.swp),
                op(ByteOperation.aget),
            ],
        }
    },
    interpretation: ([list, index]) => list.at(index),
});
localDefinitions.push({
    signature: {
        id: 'length',
        // name: 'Access List',
        attributes: { category: 'Lists' },
        description: null,
        generics: [generic('T')],
        inputs: [
            simple.generic('list', createListType('T')),
        ],
        output: output.number('length'),
        byteCode: {
            type: 'inline',
            instructions: [ 
                // get length attribute from array obj
                data('length'),
                op(ByteOperation.oget),
            ],
        },
    },
    interpretation: ([list]) => list.length,
});

localDefinitions.push({
    signature: {
        id: 'evaluate',
        // name: 'Evaluate',
        attributes: { category: 'Functions' },
        description: null,
        generics: [generic('P'), generic('R')],
        inputs: [
            func('_function', createFunctionType('P', 'R')),
            { id: 'argument', rowType: 'input-tuple', specifier: 'P' },
        ],
        output: output.generic('return_value', 'R'),
    },
    interpretation: ([_function, argument]) => _function(argument),
});


export const baseInterpretations = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.interpretation])
);

export const baseSignatures = Object.fromEntries(
    localDefinitions.map(def => [def.signature.id, def.signature])
);
