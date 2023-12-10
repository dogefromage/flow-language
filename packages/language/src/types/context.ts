import { TExpr } from '../typesystem/typeExpr';
import { Environment, FlowScope, FunctionSignature, LocalScope } from './env';
import { Obj } from './internal';
import { FlowDocument } from './state';

// export type EnvScope = {
//     parent: EnvScope | null;
//     namespace: EnvScopeFrame | null;
// }
// export interface EnvScopeFrame {
//     content: EnvContent;
// }
// export type EnvContent = Record<string, TypeSignature>;

export type ReferenceStatus = 'normal' | 'redundant' | 'cyclic' | 'illegal';
export type ReferenceSyntacticType = 'value-and-type' | 'type-only';

// export interface EdgeContext {
//     id: string;
//     source: string;
//     target: string;
//     status: EdgeStatus;
//     syntacticType: EdgeSyntacticType;
// }

export interface DocumentContext {
    problems: DocumentProblem[];
    flowContexts: Obj<FlowGraphContext>;
}

export interface FlowGraphContext {
    problems: FlowGraphProblem[];
    nodes: Obj<NodeContext>;
    env: Environment;
}

export type NodeContext = CallNodeContext | FunctionNodeContext;

export interface CallNodeContext {
    kind: 'call';
    problems: NodeProblem[];
    // inputRows: Obj<ArgumentRowContext>;
    // outputRow: ArgumentRowContext;
    functionSignature: FunctionSignature | null;
    type: TExpr | null;
    isUsed: boolean;
}
export interface FunctionNodeContext {
    kind: 'function';
    problems: NodeProblem[];
}

export type RowDisplay = 'hidden' | 'simple' | 'initializer' | 'destructured';

// export interface ArgumentRowContext {
//     display: RowDisplay;
//     value?: InitializerValue;
//     problems: RowProblem[];
// }

interface PlaceholderProblem {
    message: string;
}
export type DocumentProblem =
    PlaceholderProblem

interface CyclicNodes {
    type: 'cyclic-nodes';
    message: string;
    cycle: string[];
}
interface MissingNode {
    type: 'missing-node';
    message: string;
    nodeId: string;
}
interface OutputMissing {
    type: 'output-missing';
    message: string;
}
export type FlowGraphProblem =
    | CyclicNodes
    | MissingNode
    | OutputMissing

interface MissingSignature {
    type: 'missing-signature';
    message: string;
    signature: string;
}
export type NodeProblem =
    | MissingSignature

interface InvalidSpecifier {
    type: 'invalid-specifier';
    message: string;
}
interface RequiredParameter {
    type: 'required-parameter';
    message: string;
}
interface IncompatibleArgumentType {
    type: 'incompatible-argument-type';
    message: string;
    connectionIndex: number;
    // typeProblem: TypeSystemExceptionData;
}
interface InvalidValue {
    type: 'invalid-value';
    message: string;
    // typeProblem?: TypeSystemExceptionData;
}
interface InvalidConnection {
    type: 'invalid-connection';
    message: string;
}
export type RowProblem =
    | InvalidSpecifier
    | RequiredParameter
    | IncompatibleArgumentType
    | InvalidValue
    | InvalidConnection


export type LanguageValidator = (document: FlowDocument) => DocumentContext;