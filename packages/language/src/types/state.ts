import { Obj, Size2, Vec2 } from './internal';

export interface OutputReference {
    kind: 'output';
    nodeId: string;
    accessor?: string;
}
export interface ParameterRerefence {
    kind: 'parameter';
    nodeId: string;
    parameter: string;
    accessor?: string;
}

export type ConnectionReference = OutputReference | ParameterRerefence;

export type InitializerValue = string | number | boolean; // must be JSON serializable

export interface ConnectionReferencePair {
    // if type specified, should try to unify with 
    // values type otherwise create problem
    valueRef?: ConnectionReference;
    typeRef?: ConnectionReference;
}

export interface ArgumentRowState {
    id: string;
    references: Obj<ConnectionReferencePair>;
    destructure?: boolean;
    value?: InitializerValue;
}
export interface ReturnOutputRowState {
    destructure?: boolean;
}
export interface ParameterRowState {
    id: string;
    constraint: ConnectionReferencePair;
    // destructure?: boolean; TODO
}
export interface MatchArmState {
    id: string;
    height: number;
    result: ConnectionReferencePair;
}

export interface CallNode {
    kind: 'call';
    id: string;
    functionId: string;
    argumentMap: Obj<ArgumentRowState>;
    output: ReturnOutputRowState;
    position: Vec2;
}
export interface FunctionNode {
    kind: 'function';
    id: string;
    parameters: Obj<ParameterRowState>;
    result: ConnectionReferencePair;
    position: Vec2;
    width: number;
}
export interface MatchNode {
    kind: 'match';
    id: string;
    scrutinee: ConnectionReferencePair;
    output: ReturnOutputRowState;
    arms: Obj<MatchArmState>;
    position: Vec2;
    width: number;
}
export interface CommentNode {
    kind: 'comment';
    id: string;
    attributes: Record<string, string>;
    position: Vec2;
    size: Size2;
}

export type FlowNode = CallNode | FunctionNode | MatchNode | CommentNode;

export interface FlowGraph {
    id: string;
    attributes: Record<string, string>;
    imports: string[];
    nodes: Obj<FlowNode>;
}

export interface FlowDocument {
    title: string;
    description: string;
    flows: Obj<FlowGraph>;
}

export const MAIN_FLOW_ID = 'main';