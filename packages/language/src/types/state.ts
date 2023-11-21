import { InitializerValue, TemplateParameter } from './typeSystem';
import { InputRowSignature, NamespacePath, OutputRowSignature } from './signatures';
import { Obj, Size2, Vec2 } from './internal';

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

export interface FlowInputArgument {
    typeRef?: FlowConnection;
    valueRef?: FlowConnection;
}

export interface InputRowState {
    rowArguments: Obj<FlowInputArgument>;
    value: InitializerValue | null;
    destructure?: boolean;
}

export interface OutputRowState {
    destructure?: boolean;
}

export interface FlowNode {
    id: string;
    position: Vec2;
    protoPath: NamespacePath;
    inputs: Obj<InputRowState>;
    output: OutputRowState;
}
export interface FlowRegion {
    id: string;
    position: Vec2;
    size: Size2;
    attributes: Record<string, string>;
}

export interface FlowGraph {
    id: string;
    nodes: Obj<FlowNode>;
    regions: Obj<FlowRegion>;
    attributes: Record<string, string>;
    generics: TemplateParameter[];
    inputs: InputRowSignature[];
    output: OutputRowSignature;
    imports: string[];
}

export interface FlowDocument {
    title: string;
    description: string;
    flows: Obj<FlowGraph>;
}

export const MAIN_FLOW_ID = 'main';