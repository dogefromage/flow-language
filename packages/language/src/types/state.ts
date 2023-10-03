import { GenericTag, InputRowSignature, OutputRowSignature } from "./signatures";
import { InitializerValue } from "./typeSystem";
import { Obj, Vec2 } from "./utilTypes";

export type RowInitializerType = 'list-like' | 'map-like' | 'function' | 'first';

export interface InputJointLocation {
    direction: 'input';
    nodeId: string;
    rowId: string;
    accessor: string;
    initializer?: RowInitializerType;
}
export interface OutputJointLocation {
    direction: 'output';
    nodeId: string;
    // only one row here
    accessor?: string;
}
export type JointLocation = InputJointLocation | OutputJointLocation

export interface FlowConnection {
    nodeId: string;
    accessor?: string; // used for destructured outputs
}

export interface RowState {
    initializer: RowInitializerType;
    connections: Obj<FlowConnection>;
    value: InitializerValue | null;
}

export interface FlowNode {
    id: string;
    position: Vec2;
    rowStates: Obj<RowState>;
    signature: string;
}

export interface FlowGraph {
    id: string;
    nodes: Obj<FlowNode>;
    attributes: Record<string, string>;
    generics: GenericTag[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
    idCounter: number;
}

export interface FlowDocumentConfig {}

export interface FlowDocument {
    flows: Obj<FlowGraph>;
    config: FlowDocumentConfig;
}

export const MAIN_FLOW_ID = 'main';