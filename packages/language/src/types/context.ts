import {
    FlowGraph,
    FlowNode,
    InputJointLocation,
    OutputJointLocation,
    RowState
    } from './state';
import { FlowSignature } from './signatures';
import { InitializerValue, MapTypeSpecifier, TypeSpecifier } from './typeSpecifiers';
import { Obj } from './utilTypes';


export type FlowEnvironment = {
    parent: FlowEnvironment | null;
    content: FlowEnvironmentContent;
}
export interface FlowEnvironmentContent {
    signatures: Obj<FlowSignature>;
    types: Obj<TypeSpecifier>;
}


export type EdgeColor = 'normal' | 'redundant' | 'cyclic';

export interface FlowEdge {
    id: string;
    source: OutputJointLocation;
    target: InputJointLocation;
    color: EdgeColor;
}

export interface ProjectContext {
    ref: Obj<FlowGraph>;
    problems: ProjectProblem[];
    flowContexts: Obj<FlowGraphContext>;
    topologicalFlowOrder: string[];
    entryPointDependencies: Obj<string[]>;
}

export interface FlowGraphContext {
    ref: FlowGraph;
    problems: FlowProblem[];
    nodeContexts: Obj<FlowNodeContext>;
    edges: Obj<FlowEdge>;
    flowSignature: FlowSignature;
    flowEnvironment: FlowEnvironment;
    dependencies: string[];
    sortedUsedNodes: string[];
}

export interface FlowNodeContext {
    ref: FlowNode;
    problems: NodeProblem[];
    rowContexts: Obj<RowContext>;
    templateSignature: FlowSignature | null;
    outputSpecifier: MapTypeSpecifier | null;
    isUsed: boolean;
}

export interface RowContext {
    ref?: RowState;
    displayValue?: InitializerValue;
    problems: RowProblem[];
    specifierReference?: string;
    specifierResolved: Exclude<TypeSpecifier, string>;
}


interface CyclicFlows {
    type: 'cyclic-flows';
    cycles: string[][];
}
interface MissingTopFlow {
    type: 'missing-top-flow';
    id: string;
}
export type ProjectProblem =
    | CyclicFlows
    | MissingTopFlow

interface CyclicNodes {
    type: 'cyclic-nodes';
    cycles: string[][];
}
interface MissingNode {
    type: 'missing-node';
    nodeId: string;
}
interface OutputMissing {
    type: 'output-missing';
}
export type FlowProblem =
    | CyclicNodes
    | MissingNode
    | OutputMissing

interface MissingSignature {
    type: 'missing-signature';
    signature: string;
}
export type NodeProblem =
    | MissingSignature

interface InvalidSignature {
    type: 'invalid-signature';
}
interface RequiredParameter {
    type: 'required-parameter';
}
interface IncompatibleType {
    type: 'incompatible-type';
    connectionIndex: number;
    typeProblemPath: string[];
    typeProblemMessage: string;
}
interface InvalidValue {
    type: 'invalid-value';
    typeProblemPath: string[];
    typeProblemMessage: string;
}
export type RowProblem = 
    | InvalidSignature
    | RequiredParameter
    | IncompatibleType
    | InvalidValue
