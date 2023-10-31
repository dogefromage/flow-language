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
export interface AliasTypeSpecifier {
    type: 'alias';
    alias: string;
}
export interface GenericTypeSpecifier {
    type: 'generic';
    alias: string;
}

export type InstantiationConstraints = Record<string, TypeSpecifier>;

export type TypeSpecifier = 
    | AnyTypeSpecifier
    | PrimitiveTypeSpecifier
    | MapTypeSpecifier
    | ListTypeSpecifier
    | TupleTypeSpecifier
    | FunctionTypeSpecifier
    | AliasTypeSpecifier
    | GenericTypeSpecifier

export interface TemplateParameter {
    id: string;
    constraint: TypeSpecifier | null;
}
export interface TemplatedTypeSpecifier<T extends TypeSpecifier = TypeSpecifier> {
    generics: TemplateParameter[];
    specifier: T;
}

export type InitializerValue = any;

// export interface TypeNode {
//     name: string;
//     arguments: TypeNode[];
// }