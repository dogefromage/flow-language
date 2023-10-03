import { ByteInstruction, CallableChunk } from "./byteCode";
import { GenericParameter, InitializerValue, TypeSpecifier } from "./typeSystem";

interface BaseRow<R extends string> {
    id: string;
    specifier: TypeSpecifier;
    rowType: R;
}

// export interface SimpleInputRowSignature extends BaseRow<'input-simple'> {};
// export interface ListInputRowSignature extends BaseRow<'input-list'> {};
// export interface TupleInputRowSignature extends BaseRow<'input-tuple'> {};
// export interface FunctionInputRowSignature extends BaseRow<'input-function'> {};
// export interface VariableInputRowSignature extends BaseRow<'input-variable'> {
//     defaultValue: InitializerValue | null;
// };

// export type SimpleOutputRowSignature = BaseRow<'output-simple'>;
// export type DestructuredOutputRowSignature = BaseRow<'output-destructured'>;

// export type InputRowSignature =
//     | SimpleInputRowSignature
//     | ListInputRowSignature
//     | TupleInputRowSignature
//     | VariableInputRowSignature
//     | FunctionInputRowSignature

// export type OutputRowSignature =
//     | SimpleOutputRowSignature
//     | DestructuredOutputRowSignature
//     | HiddenOutputRowSignature

export interface SimpleInputRowSignature extends BaseRow<'input-simple'> {};
export interface VariableInputRowSignature extends BaseRow<'input-variable'> {
    defaultValue: InitializerValue | null;
}
export type SimpleOutputRowSignature = BaseRow<'output-simple'>;
export type DestructuredOutputRowSignature = BaseRow<'output-destructured'>;
export type HiddenOutputRowSignature = BaseRow<'output-hidden'>;

export type InputRowSignature =
    | SimpleInputRowSignature
    | VariableInputRowSignature
export type OutputRowSignature =
    | SimpleOutputRowSignature
    | DestructuredOutputRowSignature
    | HiddenOutputRowSignature

export interface AnonymousFlowSignature {
    generics: GenericParameter[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
    byteCode?: 
        | { type: 'callable', chunk: CallableChunk }
        | { type: 'inline', instructions: ByteInstruction[] }
}

export const reserverNodeIds = ['input', 'output'] as const;
export type ReservedNodeIds = (typeof reserverNodeIds)[number];

export interface FlowSignature extends AnonymousFlowSignature {
    id: string;
    description: string | null;
    attributes: Record<string, string>;
}
