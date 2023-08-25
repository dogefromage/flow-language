import * as lang from "@fluss/language";

type AllRows = lang.InputRowSignature | lang.OutputRowSignature;
export type RowSignatureBlueprint = {
    specifier: lang.TypeSpecifier;
    rowType: AllRows['rowType'];
}

export interface FlowJointStyling {
    shape: 'square' | 'round';
    borderStyle: 'dashed' | 'solid';
    background: string;
    border: string;
}