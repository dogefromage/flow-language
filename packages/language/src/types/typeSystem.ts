import { Obj } from "./utilTypes";

export interface AnyTypeSpecifier {
    type: 'any';
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
    parameter: TypeSpecifier;
    output: TypeSpecifier;
}
// export interface UnionTypeSpecifier {
//     type: 'union';
//     elements: TypeSpecifier[];
// }

export type InstantiationConstraints = Record<string, TypeSpecifier>;

export type TypeSpecifier =
    | string
    | AnyTypeSpecifier
    | MissingTypeSpecifier
    | PrimitiveTypeSpecifier
    | MapTypeSpecifier
    | ListTypeSpecifier
    | TupleTypeSpecifier
    | FunctionTypeSpecifier
    // | UnionTypeSpecifier

export type InitializerValue = any;