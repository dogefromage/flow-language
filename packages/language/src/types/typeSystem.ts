import { Obj } from "./utilTypes";

export interface UnknownTypeSpecifier {
    type: 'unknown';
}
export interface MissingTypeSpecifier {
    type: 'missing';
}
export interface PrimitiveTypeSpecifier {
    type: 'primitive';
    name: string;
}
export interface ListTypeSpecifier {
    type: 'list';
    element: TypeSpecifier;
}
export interface TupleTypeSpecifier {
    type: 'tuple';
    elements: TypeSpecifier[];
}
export interface MapTypeSpecifier {
    type: 'map';
    elements: Obj<TypeSpecifier>;
}
export interface FunctionTypeSpecifier {
    type: 'function';
    parameter: MapTypeSpecifier;
    output: MapTypeSpecifier;
}

export type InstantiationConstraints = Record<string, TypeSpecifier>;

export type TypeSpecifier =
    | string
    | UnknownTypeSpecifier
    | MissingTypeSpecifier
    | PrimitiveTypeSpecifier
    | MapTypeSpecifier
    | ListTypeSpecifier
    | TupleTypeSpecifier
    | FunctionTypeSpecifier

export type InitializerValue = any;