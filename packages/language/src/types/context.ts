import { TypeSystemExceptionData } from '../typeSystem/exceptionHandling';
import { FlowSignature } from './signatures';
import {
    FlowDocument,
    FlowGraph,
    FlowNode,
    InputJointLocation,
    OutputJointLocation,
    RowState
} from './state';
import { FunctionTypeSpecifier, InitializerValue, TypeSpecifier } from './typeSystem';
import { Obj } from './utilTypes';

export type FlowEnvironment = {
    parent: FlowEnvironment | null;
    content: FlowEnvironmentContent;
}
export interface FlowEnvironmentContent {
    signatures?: Obj<FlowSignature>;
    types?: Obj<TypeSpecifier>;
}

export type EdgeColor = 'normal' | 'redundant' | 'cyclic';

export interface FlowEdge {
    id: string;
    source: OutputJointLocation;
    target: InputJointLocation;
    color: EdgeColor;
}

export interface DocumentContext {
    ref: FlowDocument;
    problems: DocumentProblem[];
    criticalSubProblems: number;
    flowContexts: Obj<FlowGraphContext>;
    // topologicalFlowOrder: string[];
    // entryPointDependencies: Obj<string[]>;
    environment: FlowEnvironment;
}

export interface FlowGraphContext {
    ref: FlowGraph;
    problems: FlowProblem[];
    criticalSubProblems: number;
    nodeContexts: Obj<FlowNodeContext>;
    edges: Obj<FlowEdge>;
    flowSignature: FlowSignature;
    flowEnvironment: FlowEnvironment;
    sortedUsedNodes: string[];
    // dependencies: string[];
}

export interface FlowNodeContext {
    ref: FlowNode;
    problems: NodeProblem[];
    criticalSubProblems: number;
    rowContexts: Obj<RowContext>;
    templateSignature: FlowSignature | null;
    specifier: FunctionTypeSpecifier | null;
    isUsed: boolean;
}

export interface GenericTypeInference {
    name: string;
    resolvedSpecifier: TypeSpecifier;
}

export interface RowContext {
    ref?: RowState;
    displayValue?: InitializerValue;
    problems: RowProblem[];
}


// interface CyclicFlows {
//     type: 'cyclic-flows';
//     cycles: string[][];
// }
// interface MissingTopFlow {
//     type: 'missing-top-flow';
//     id: string;
// }

export type DocumentProblem =
    never
    // | CyclicFlows
    // | MissingTopFlow

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
interface IncompatibleArgumentType {
    type: 'incompatible-argument-type';
    connectionIndex: number;
    typeProblem: TypeSystemExceptionData;
}
// interface InvalidRowType {
//     type: 'invalid-row-type';
//     typeProblem: TypeSystemExceptionData;
// }
interface InvalidValue {
    type: 'invalid-value';
    typeProblem: TypeSystemExceptionData;
}
export type RowProblem = 
    | InvalidSignature
    | RequiredParameter
    | IncompatibleArgumentType
    | InvalidValue
