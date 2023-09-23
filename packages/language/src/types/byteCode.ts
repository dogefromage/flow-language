
export enum ByteOperation {
    // Unary ops
    nneg, bneg,
    ncmpz, /* ncmpnz, */
    ntrunc,
    // Binary ops
    nadd, nsub, nmul, ndiv,
    ngt, nlt, ncmp,
    band, bor,
    // Strings
    sconcat, ssub,
    // Arrays
    apack, aget, aconcat, asub,
    // Objects
    opack, oget,
    // Stack ops
    dup, pop, swp,
    moveaside, moveback,
    // Call frame ops
    getlocal, setlocal,
    getarg,
    call, return, j, jc,
    evaluate, thunk,
}

// just copy same representation and make array
export const operationNameTags = [
    // Unary ops
    'nneg', 'bneg',
    'ncmpz', /* 'ncmpnz', */
    'ntrunc',
    // Binary ops
    'nadd', 'nsub', 'nmul', 'ndiv',
    'ngt', 'nlt', 'ncmp',
    'band', 'bor',
    // Strings
    'sconcat', 'ssub',
    // Arrays
    'apack', 'aget', 'aconcat', 'asub',
    // Objects
    'opack', 'oget',
    // Stack ops
    'dup', 'pop', 'swp',
    'moveaside', 'moveback',
    // Call frame ops
    'getlocal', 'setlocal',
    'getarg',
    'call', 'return', 'j', 'jc',
    'evaluate', 'thunk',
];

export interface ThunkValue {
    label: string;
    args: StackValue[];
    chunk: CallableChunk;
    result: StackValue | null;
}

export type StackValue = object |  string  |  number  |  boolean | ThunkValue;

export type OperationByteInstruction = { type: 'operation', operation: ByteOperation };
export type DataByteInstruction = { type: 'data', data: StackValue };
export type ByteInstruction =
    | OperationByteInstruction
    | DataByteInstruction

export interface CallableChunk {
    arity: number;
    instructions: ByteInstruction[];
}

export interface CallFrame {
    label: string;
    chunk: CallableChunk;
    thunk?: ThunkValue;
    ip: number;
    baseIndex: number;
    locals: StackValue[];
    args: StackValue[];
}

export interface ByteProgram {
    entryChunk: string;
    chunks: Map<string, CallableChunk>;
}

export interface ByteCompilerConfig {
    skipValidation?: boolean;
}

export const byteCodeConstructors = {
    op: (operation: ByteOperation): OperationByteInstruction => ({ type: 'operation', operation }),
    data: (data: StackValue): DataByteInstruction => ({ type: 'data', data }),
    thunk: (args: ThunkValue['args'], chunk: ThunkValue['chunk'], label: string,
        ): ThunkValue => ({ args, chunk, label }),
};