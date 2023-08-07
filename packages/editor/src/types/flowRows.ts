import * as lang from "@fluss/language";

type AllRows = lang.InputRowSignature | lang.OutputRowSignature;
export type RowBlueprint = {
    specifier: lang.TypeSpecifier;
    rowType: AllRows['rowType'];
}