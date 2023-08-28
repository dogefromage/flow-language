import { FlowSignatureId, GenericTag, InputRowSignature, OutputRowSignature } from "./signatures";
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
    accessor?: string;
}
export type JointLocation = InputJointLocation | OutputJointLocation

export interface FlowConnection {
    nodeId: string;
    accessor?: string; // used for destructured outputs
}

export interface RowState {
    connections: FlowConnection[];
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
    generics: GenericTag[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
    // outputs: OutputRowSignature[];
    idCounter: number;
}

export interface FlowDocumentConfig {}

export interface FlowDocument {
    flows: Obj<FlowGraph>;
    config: FlowDocumentConfig;
}

export const MAIN_FLOW_ID = 'main';