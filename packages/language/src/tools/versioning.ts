import mapValues from "lodash-es/mapValues";
import { FlowDocument, FlowGraph } from "../types";

export function updateObsoleteDocument(doc: FlowDocument): FlowDocument {
    return {
        ...doc,
        flows: mapValues(doc.flows || {}, updateObsoleteFlow) as Record<string, FlowGraph>,
    }
}

function updateObsoleteFlow(flow: FlowGraph): FlowGraph {
    
    return {
        regions: {}, // added regions (15.11.23)
        ...flow as any,
    }
}
