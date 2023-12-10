import { NamespacePath } from './env';
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


/**```
 * reference <= <nodeId> [ ?<parameter> ] [ .<accessor> ]
 * 
 * ```
 * Example:
 * Accesses destructured x value of vector obj which is parameter of distance:
 *   distance?vec.x
 */
export type ConnectionReference = string & { __connectionReference: true };

export function decodeParameterRef(ref: ConnectionReference) {
    const m = ref.match(/^(\w+)\?(\w+)(?:\.(\w+))?$/);
    return m ? { kind: 'parameter', nodeId: m[1], parameter: m[2], accessor: m[3] } as const : null;
}
export function decodeOutputRef(ref: ConnectionReference) {
    const m = ref.match(/^(\w+)(?:\.(\w+))?$/);
    return m ? { kind: 'output', nodeId: m[1], accessor: m[2] } as const : null;
}


export type InitializerValue = string | number | boolean; // must be JSON serializable

export interface ConnectionReferencePair {
    // if type specified, should try to unify with 
    // values type otherwise create problem
    valueRef?: ConnectionReference;
    typeRef?: ConnectionReference;
}

export type ArgumentExprType = 'simple' | 'initializer' | 'record';

export interface ArgumentRowState {
    id: string;
    references: Obj<ConnectionReferencePair>;
    exprType?: ArgumentExprType; // default 'record'
    value?: InitializerValue;
}
export interface OutputRowState {
    recordDestructure?: boolean;
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
    functionId: NamespacePath;
    argumentMap: Obj<ArgumentRowState>;
    output: OutputRowState;
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
// export interface MatchNode {
//     kind: 'match';
//     id: string;
//     scrutinee: ConnectionReferencePair;
//     output: ReturnOutputRowState;
//     arms: Obj<MatchArmState>;
//     position: Vec2;
//     width: number;
// }
export interface CommentNode {
    kind: 'comment';
    id: string;
    attributes: Record<string, string>;
    position: Vec2;
    size: Size2;
}

export type FlowNode = CallNode | FunctionNode | /* MatchNode | */ CommentNode;

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
