import { Obj } from "./utilTypes";

export interface ListTypeSpecifier {
    type: 'list';
    elementType: TypeSpecifier;
}
export interface ArrayTypeSpecifier {
    type: 'array';
    length: number;
    elementType: TypeSpecifier;
}
export interface MapTypeSpecifier {
    type: 'map';
    elements: Obj<TypeSpecifier>;
}

export type TypeSpecifier =
    | null
    | string
    | symbol
    | MapTypeSpecifier
    | ListTypeSpecifier
    | ArrayTypeSpecifier

export type InitializerValue =
    | null
    | number
    | boolean
    | string
    | readonly InitializerValue[]
    | { [key: string]: InitializerValue }
