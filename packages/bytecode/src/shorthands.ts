import { ByteOperation, OperationByteInstruction, StackValue, DataByteInstruction, ThunkValue, ByteInstruction, CallableChunk } from "./types";

const op = (operation: ByteOperation): OperationByteInstruction => ({ type: 'operation', operation });
const data = (data: string | number | boolean): DataByteInstruction => ({ type: 'data', data });
const thunk = (args: ThunkValue['args'], chunk: ThunkValue['chunk'], label: string, result: ThunkValue['result'] = null,
    ): ThunkValue => ({ args, chunk, label, result });
const chunk = (arity: number, instructions: ByteInstruction[]): CallableChunk => ({ arity, instructions });

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

export const shorthands = { op, data, thunk, chunk, evalthunks };