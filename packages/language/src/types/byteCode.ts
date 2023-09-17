
export enum ByteOperation {
    nneg, bneg,
    ncmpz, ncmpnz,
    ntrunc,
    nadd, nsub, nmul, ndiv,
    ngt, nlt, ncmp,
    band, bor,
    sconcat, ssub,
    apack, aget, aconcat, asub,
    opack, oget,
    dup, pop, swp,
    narg, barg, oarg, sarg,
    call, return, j, jc,
}

// just copy same representation and make array
export const operationNameTags = [
    'nneg', 'bneg',
    'ncmpz', 'ncmpnz',
    'ntrunc',
    'nadd', 'nsub', 'nmul', 'ndiv',
    'ngt', 'nlt', 'ncmp',
    'band', 'bor',
    'sconcat', 'ssub',
    'apack', 'aget', 'aconcat', 'asub',
    'opack', 'oget',
    'dup', 'pop', 'swp',
    'narg', 'barg', 'oarg', 'sarg',
    'call', 'return', 'j', 'jc',
];

export interface ConcreteValue {
    type: 'concrete';
    value:     object  |  object |  string  |  number  |  number   |  boolean;
    dataType: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean';
}
export interface ThunkValue {
    type: 'thunk';
    arguments: StackValue[];
    chunk: CallableChunk;
}

export type StackValue = ConcreteValue | ThunkValue;

export type ByteInstruction =
    | { type: 'operation', operation: ByteOperation }
    | { type: 'data', data: ConcreteValue }

export interface CallableChunk {
    arity: number;
    locals: number;
    instructions: ByteInstruction[];
}

export interface CallStackScope {
    ip: number;
    stackTailLength: number;
    chunk: CallableChunk;
}

export interface ByteProgram {
    chunks: Map<string, CallableChunk>;
}

export interface ByteCompilerConfig {
    skipValidation?: boolean;
}