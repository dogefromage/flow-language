import { assertDef } from "../utils";
import { TemplateParameter, InitializerValue, TypeSpecifier } from "./typeSystem";

interface BaseRow<R extends string> {
    id: string;
    specifier: TypeSpecifier;
    rowType: R;
}

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
    generics: TemplateParameter[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
}

export const reserverNodeIds = ['input', 'output'] as const;
export type ReservedNodeIds = (typeof reserverNodeIds)[number];

export interface FlowSignature extends AnonymousFlowSignature {
    id: string;
    attributes: Record<string, string>;
}

export interface NamespacePath {
    // should look like:
    // [document/module_name]::[slug_1]:: … ::[slug_n]::[flowId]
    path: string;
}
export const pathTail = (path: NamespacePath) =>
    assertDef(path.path.split('::').at(-1), 'Path empty');