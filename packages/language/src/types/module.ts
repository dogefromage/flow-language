import { FlowSignature } from "./signatures";
import { FlowDocument } from "./state";
import { TypeSpecifier } from "./typeSystem";

export interface FlowModule {
    name: string;
    source?: FlowDocument;
    types: Record<string, TypeSpecifier>;
    signatures: Record<string, FlowSignature>;
}