import { standardModule } from "../content/standardModule";
import { createEnvironment } from "../core/environment";
import { FlowDocument, FlowSignature } from "../types";
import { DocumentProblem, FlowDocumentContext, FlowEnvironmentNamespace, FlowGraphContext } from "../types/context";
import { FlowModule } from "../types/module";
import { Obj } from "../types/utilTypes";
import { ListCache } from "../utils/ListCache";
import { mem } from "../utils/functional";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";

/**
 * update with some module collection system
 * dont forget to memoize this
 */
const availableModules: FlowModule[] = [
    standardModule,
];

export const validateDocument = mem((document: FlowDocument) => {
    const { flows: rawFlowMap } = document;
    
    const flowContexts: Obj<FlowGraphContext> = {};
    const problems: DocumentProblem[] = [];
    let criticalSubProblems = 0;

    // sort s.t. memoization works
    const flowsSorted = Object.values(rawFlowMap)
        .sort((a, b) => a.id.localeCompare(b.id));
    const documentNamespace = makeDocumentNamespace(
        ...flowsSorted.map(getFlowSignature)
    );
    let baseEnvironment = createEnvironment(documentNamespace);

    for (const flow of flowsSorted) {
        const flowContext = validateFlowGraph(flow, baseEnvironment, availableModules);
        flowContexts[flow.id] = flowContext;
        criticalSubProblems += flowContext.problems.length + flowContext.criticalSubProblems;
    }

    const result: FlowDocumentContext = {
        ref: document,
        flowContexts,
        problems,
        criticalSubProblems,
        environment: baseEnvironment,
    };
    return result;
}, new ListCache(5), {
    tag: 'validateDocument',
    printGroup: true,
});

const makeDocumentNamespace = mem(
    (...signatureList: FlowSignature[]): FlowEnvironmentNamespace => ({
        name: 'document', 
        content: {
            signatures: signatureList,
            types: {},
        },
    })
);
