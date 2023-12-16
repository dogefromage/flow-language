import { TExpr } from "../typesystem/typeExpr";
import { ArgumentExprType, InitializerValue } from "./grammar";

export interface ParameterSignature {
    id: string;
    defaultValue?: InitializerValue;
    defaultExprType?: ArgumentExprType;
}
export interface OutputSignature {
    defaultDestructure?: boolean;
}

export interface FunctionSignature {
    kind: 'function';
    attributes: Record<string, string>;
    type: TExpr;
    parameters: Record<string, ParameterSignature>;
    output: OutputSignature;
}

// /**
//  * It is assumed that scopes are ordered
//  *   ModuleScope... FlowScope... LocalScope...
//  */
// export interface ModuleScope {
//     kind: 'module';
//     name: string;
//     flows: Record<string, FlowScope>;
// }
// export interface FlowScope {
//     kind: 'flow';
//     flowId: string;
//     functions: Record<string, FunctionSignature>;
// }
// export interface LocalScope {
//     kind: 'local';
//     types: Record<string, TExpr>;
// }
// export type ScopeNode = ModuleScope | FlowScope | LocalScope;

export interface TypeSignature {
    kind: 'type';
    type: TExpr;
}

export type EnvironmentSignature = FunctionSignature | TypeSignature;

export type EnvPath = string[];

export interface EnvSymbolRow {
    path: EnvPath;
    symbols: Record<string, EnvironmentSignature>;
}

export interface Environment {
    parent: Environment | null;
    row: EnvSymbolRow;
}


export interface FlowModule {
    row: EnvSymbolRow;
}