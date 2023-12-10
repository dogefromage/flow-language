import { TExpr } from "../typesystem/typeExpr";
import { ArgumentExprType, InitializerValue } from "./state";

export interface ParameterSignature {
    id: string;
    defaultValue?: InitializerValue;
    defaultExprType?: ArgumentExprType;
}
export interface OutputSignature {
    defaultDestructure?: boolean;
}

export interface FunctionSignature {
    id: string;
    kind: 'function';
    attributes: Record<string, string>;
    generalizedType: TExpr;
    parameters: Record<string, ParameterSignature>;
    output: OutputSignature;
}

export interface ModuleScope {
    kind: 'module';
    name: string;
    flows: Record<string, FlowScope>;
}
export interface FlowScope {
    kind: 'flow';
    flowId: string;
    functions: Record<string, FunctionSignature>;
}
export interface LocalScope {
    kind: 'local';
    types: Record<string, TExpr>;
}
export type ScopeNode = ModuleScope | FlowScope | LocalScope;

export type NamespacePath = string & { __namespacePath: never };

/**
 * It is assumed that scopes are ordered
 *   ModuleScope... FlowScope... LocalScope...
 */
export interface Environment {
    parent: Environment | null;
    scope: ScopeNode;
}
