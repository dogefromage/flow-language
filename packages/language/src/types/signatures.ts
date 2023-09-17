import { ByteInstruction, CallableChunk } from "./byteCode";
import { InitializerValue, TypeSpecifier } from "./typeSystem";

/**
 * Rows are either inputs or outputs of node.
 * The signature defines the shape or display 
 * of a row but not its state or connections.
 */
interface BaseRow<R extends string> {
    id: string;
    // label: string;
    specifier: TypeSpecifier;
    rowType: R;
}

export interface SimpleInputRowSignature extends BaseRow<'input-simple'> {};
export interface ListInputRowSignature extends BaseRow<'input-list'> {};
export interface TupleInputRowSignature extends BaseRow<'input-tuple'> {};
export interface FunctionInputRowSignature extends BaseRow<'input-function'> {};
export interface VariableInputRowSignature extends BaseRow<'input-variable'> {
    defaultValue: InitializerValue | null;
};

export type SimpleOutputRowSignature = BaseRow<'output-simple'>;
export type DestructuredOutputRowSignature = BaseRow<'output-destructured'>;
export type HiddenOutputRowSignature = BaseRow<'output-hidden'>;

export type InputRowSignature =
    | SimpleInputRowSignature
    | ListInputRowSignature
    | TupleInputRowSignature
    | VariableInputRowSignature
    | FunctionInputRowSignature

export type OutputRowSignature =
    | SimpleOutputRowSignature
    | DestructuredOutputRowSignature
    | HiddenOutputRowSignature

export interface GenericTag {
    id: string;
    constraint: TypeSpecifier | null;
}

export interface AnonymousFlowSignature {
    generics: GenericTag[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
    byteCode?: 
        | { type: 'callable', chunk: CallableChunk }
        | { type: 'inline', instructions: ByteInstruction[] }
}

// export function getInternalId(name: 'input' | 'output' | 'combine' | 'separate', ...rest: string[]) {
//     return '@@' + [name, ...rest].join('_');
// }

export const reserverNodeIds = ['input', 'output'] as const;
export type ReservedNodeIds = (typeof reserverNodeIds)[number];

export interface FlowSignature extends AnonymousFlowSignature {
    id: string;
    // name: string;
    description: string | null;
    attributes: Record<string, string>;
}
