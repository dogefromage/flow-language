import { TExpr } from "../typesystem/typeExpr";

interface BaseRow<R extends string> {
    id: string;
    specifier: TExpr;
    rowType: R;
}

export type InitializerValue = string | number | boolean;

export interface SimpleInputRowSignature extends BaseRow<'input-simple'> {};
export interface VariableInputRowSignature extends BaseRow<'input-variable'> {
    defaultDestructure?: boolean;
    defaultValue?: InitializerValue;
}
export type InputRowSignature =
    | SimpleInputRowSignature
    | VariableInputRowSignature

export interface OutputRowSignature extends BaseRow<'output'> {
    defaultDestructure?: boolean;
    hidden?: boolean;
}

// export interface AnonymousFlowSignature {
//     generics: string[];
//     inputs: InputRowSignature[];
//     output: OutputRowSignature;
// }

export interface FlowSignature /* extends AnonymousFlowSignature */ {
    id: string;
    attributes: Record<string, string>;
    type: TExpr;
}