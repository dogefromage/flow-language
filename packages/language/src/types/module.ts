import { FlowEnvironmentContent } from "./context";
import { FlowDocument } from "./state";

export interface FlowModule {
    name: string;
    declarations: FlowEnvironmentContent;
    source?: FlowDocument;
}