import { FlowSignature } from "./signatures";
import { InitializerValue } from "./typeSystem";

export type NodeValueMap<T extends InitializerValue = InitializerValue> = Record<string, T>;
export type FlowInterpretation = (nodeArgs: NodeValueMap<any>, flowArgs: NodeValueMap<any>) => NodeValueMap;

export interface SignatureDefinition {
    signature: FlowSignature;
    interpretation: FlowInterpretation
}