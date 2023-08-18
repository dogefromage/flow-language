import { FlowSignatureId, InputRowSignature, OutputRowSignature } from "./signatures";
import { InitializerValue } from "./typeSystem";
import { Obj, Vec2 } from "./utilTypes";

export interface InputJointLocation {
    direction: 'input';
    nodeId: string;
    rowId: string;
    jointIndex: number;
}
export interface OutputJointLocation {
    direction: 'output';
    nodeId: string;
    rowId: string;
}
export type JointLocation = InputJointLocation | OutputJointLocation

export interface OutputLocation {
    nodeId: string;
    outputId: string;
}

export interface RowState {
    connections: OutputLocation[];
    value: InitializerValue | null;
}

export interface FlowNode {
    id: string;
    label?: string;
    position: Vec2;
    rowStates: Obj<RowState>;
    signature: FlowSignatureId;
}

export interface FlowGraph {
    id: string;
    name: string;
    nodes: Obj<FlowNode>;
    attributes: Record<string, string>;
    generics: string[];
    inputs: InputRowSignature[];
    outputs: OutputRowSignature[];
    idCounter: number;
}

export interface FlowEntryPoint {
    id: string;
    entryFlowId: string;
}

export interface FlowDocumentConfig {
    // entryFlows: Record<string, FlowEntryPoint>;
}

export interface FlowDocument {
    flows: Obj<FlowGraph>;
    config: FlowDocumentConfig;
}

export const MAIN_FLOW_ID = 'main';