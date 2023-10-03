import { Obj } from "./utilTypes";

export interface AnyTypeSpecifier {
    type: 'any';
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
    parameter: TypeSpecifier;
    output: TypeSpecifier;
}

export type InstantiationConstraints = Record<string, TypeSpecifier>;

export type NonAliasedTypeSpecifier = 
    | AnyTypeSpecifier
    | PrimitiveTypeSpecifier
    | MapTypeSpecifier
    | ListTypeSpecifier
    | TupleTypeSpecifier
    | FunctionTypeSpecifier

export type TypeSpecifier =
    | string
    | NonAliasedTypeSpecifier

export interface GenericParameter {
    name: string;
    constraint: TypeSpecifier | null;
}

export interface GenericTypeSpecifier<T extends TypeSpecifier = TypeSpecifier> {
    generics: GenericParameter[];
    specifier: T;
}

export type InitializerValue = any;