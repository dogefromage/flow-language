import { EnvContent } from "./context";
import { FlowDocument } from "./state";

export interface FlowModule {
    name: string;
    content: EnvContent;
    source: FlowDocument | null;
}