import { NamespacePath } from "@noodles/language";

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
    apack, aget, aconcat, asub, aspread, apop, apush,
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
    thunk_id,
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
    'apack', 'aget', 'aconcat', 'asub', 'aspread', 'apophelp', 'apush',
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
    'thunk_identity',
];

export const MACHINE_ENTRY_LABEL = 'start';

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
    chunks: Map<string, CallableChunk>;
}

export interface ByteCompilerConfig {
    skipValidation?: boolean;
}

export class ByteInstructionStream {
    private instructions: ByteInstruction[] = [];
    
    public push(...instr: ByteInstruction[]) {
        this.instructions.push(...instr);
    }

    public exportInline(): ByteInstruction[] {
        const instr = this.instructions;
        this.instructions = [];
        return instr;
    }

    public exportChunk(arity: number): CallableChunk {
        const chunk: CallableChunk = {
            arity,
            instructions: this.instructions,
        };
        this.instructions = [];
        return chunk;
    }
}

export abstract class ByteSource {
    public abstract get chunks(): Record<string, CallableChunk>;
    public abstract useRoutine(bs: ByteInstructionStream, path: NamespacePath): boolean
}



