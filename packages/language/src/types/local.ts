import { FlowSignature } from "./signatures";
import { InitializerValue } from "./typeSystem";

export type ValueMap<T extends InitializerValue = InitializerValue> = Record<string, T>;

export type FlowInterpretation = (nodeArgs: ValueMap, flowArgs: ValueMap) => ValueMap;

export interface SignatureDefinition {
    signature: FlowSignature;
    interpretation: FlowInterpretation
}