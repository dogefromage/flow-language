import _ from "lodash";
import { FlowDocument, FlowGraph } from "../types";

export function updateObsoleteDocument(doc: FlowDocument): FlowDocument {
    return {
        ...doc,
        flows: _.mapValues(doc.flows || {}, updateObsoleteFlow) as Record<string, FlowGraph>,
    }
}

function updateObsoleteFlow(flow: FlowGraph): FlowGraph {
    
    return {
        regions: {}, // added regions (15.11.23)
        ...flow as any,
    }
}
