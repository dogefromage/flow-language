import { Obj, Size2, Vec2 } from './internal';
import { InitializerValue } from './signatures';

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

export interface FlowConnectionJoint {
    typeOnly?: boolean;
    typeRef?: FlowConnection;
    valueRef?: FlowConnection;
}


export interface InputRowState {
    destructure?: boolean;
    value?: InitializerValue;
    connections: Obj<FlowConnectionJoint>;
}

export interface OutputRowState {
    destructure?: boolean;
}

export interface ApplicationFlowElement {
    kind: 'application';
    id: string;
    position: Vec2;
    funName: string;
    inputs: Obj<InputRowState>;
    output: OutputRowState;
}
export interface FunctionFlowElement {
    kind: 'function';
    id: string;
    position: Vec2;
    size: Size2;
    parameters: Obj<FlowConnectionJoint>;
    children: string[];
}
export interface RegionFlowElement {
    kind: 'region';
    id: string;
    position: Vec2;
    size: Size2;
    attributes: Record<string, string>;
}

export type FlowElement = ApplicationFlowElement | FunctionFlowElement | RegionFlowElement;

export interface FlowGraph {
    id: string;
    elements: Obj<FlowElement>;
    attributes: Record<string, string>;
    imports: string[];
    // generics: TemplateParameter[];
    // inputs: InputRowSignature[];
    // output: OutputRowSignature;
}

export interface FlowDocument {
    title: string;
    description: string;
    flows: Obj<FlowGraph>;
}

export const MAIN_FLOW_ID = 'main';