import { InputRowSignature, NamespacePath, OutputRowSignature } from "./signatures";
import { TemplateParameter, InitializerValue } from "./typeSystem";
import { Obj, Vec2 } from "./internal";

export interface InputJointLocation {
    direction: 'input';
    nodeId: string;
    rowId: string;
    accessor: string;
}
export interface OutputJointLocation {
    direction: 'output';
    nodeId: string;
    // only output row, no rowId here
    accessor?: string;
}
export type JointLocation = InputJointLocation | OutputJointLocation

export interface FlowConnection {
    nodeId: string;
    accessor?: string; // used for destructured outputs
}

export interface RowState {
    connections: Obj<FlowConnection>;
    value: InitializerValue | null;
}

export interface FlowNode {
    id: string;
    position: Vec2;
    rowStates: Obj<RowState>;
    signature: NamespacePath;
}

export interface FlowGraph {
    id: string;
    nodes: Obj<FlowNode>;
    attributes: Record<string, string>;
    generics: TemplateParameter[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
    imports: string[];
    idCounter: number;
}

export interface FlowDocument {
    flows: Obj<FlowGraph>;
}

export const MAIN_FLOW_ID = 'main';