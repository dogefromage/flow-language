import { ByteInstruction } from "./byteCode";
import { FlowSignature } from "./signatures";

export type InterpreterValue = any;

export type FlowInterpretation = (nodeArgs: InterpreterValue[], flowArgs: InterpreterValue[]) => any;

export interface SignatureDefinition {
    signature: FlowSignature;
    interpretation?: FlowInterpretation;
}