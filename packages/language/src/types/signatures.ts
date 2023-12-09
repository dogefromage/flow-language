import { TExpr } from "../typesystem/typeExpr";
import { InitializerValue } from "./state";

// interface BaseRow<R extends string> {
//     id: string;
//     specifier: TExpr;
//     rowType: R;
// }

// export interface SimpleInputRowSignature extends BaseRow<'input-simple'> {};
// export interface VariableInputRowSignature extends BaseRow<'input-variable'> {
//     defaultDestructure?: boolean;
//     defaultValue?: InitializerValue;
// }
// export type InputRowSignature =
//     | SimpleInputRowSignature
//     | VariableInputRowSignature

// export interface OutputRowSignature extends BaseRow<'output'> {
//     defaultDestructure?: boolean;
//     hidden?: boolean;
// }

// export interface AnonymousFlowSignature {
//     generics: string[];
//     inputs: InputRowSignature[];
//     output: OutputRowSignature;
// }

// export interface FlowSignature /* extends AnonymousFlowSignature */ {
//     id: string;
//     attributes: Record<string, string>;
//     type: TExpr;
// }

export interface ArgumentSignature {
    id: string;
    destructure?: boolean;
    value?: InitializerValue;
}
export interface OutputSignature {
    destructure?: boolean;
    hidden?: boolean;
}

export interface BasicSignature {
    kind: 'basic';
    type: TExpr;
}

export interface FunctionSignature {
    kind: 'function';
    attributes: Record<string, string>;
    generalizedType: TExpr;
    arguments: Record<string, ArgumentSignature>;
    output: OutputSignature;
}

export type TypeSignature = FunctionSignature | BasicSignature;