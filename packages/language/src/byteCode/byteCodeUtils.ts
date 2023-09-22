import { ByteProgram, operationNameTags, ByteInstruction, StackValue } from "../types";
import { assertDef, assertNever } from "../utils";

export function byteProgramToString(program: ByteProgram) {
    const lines: string[] = [];
    for (const [label, chunk] of program.chunks) {
        lines.push(`.${label}`);
        for (let i = 0; i < chunk.instructions.length; i++) {
            const instrLine = instructionToString(chunk.instructions[i]);
            lines.push(`${i.toString().padStart(6)} ${instrLine}`);
        }
        lines.push('\n');
    }
    return lines.join('\n');
}

export function instructionToString(instr: ByteInstruction) {
    switch (instr.type) {
        case 'data':
            return dataToString(instr.data);
        case 'operation':
            return assertDef(operationNameTags[instr.operation]);
    }
}

export function dataToString(data: StackValue) {
    switch (typeof data) {
        case 'object':
            return Array.isArray(data) ? 
                '[...]' : '{...}';
        case 'string':
            return `"${data}"`;
        case 'boolean':
        case 'number':
            return data.toString();
    }
    assertNever();
}