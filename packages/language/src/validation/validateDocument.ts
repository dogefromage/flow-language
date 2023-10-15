import { standardModule } from "../content/standardModule";
import { createEnvironment } from "../core/environment";
import { FlowDocument, FlowSignature } from "../types";
import { DocumentProblem, FlowDocumentContext, FlowEnvironmentNamespace, FlowGraphContext } from "../types/context";
import { FlowModule } from "../types/module";
import { Obj } from "../types/utilTypes";
import { mem } from "../utils/functional";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";

/**
 * update with some module collection system
 */
const availableModules: FlowModule[] = [
    standardModule,
];

export const validateDocument = mem((document: FlowDocument) => {
    const { flows: rawFlowMap } = document;

    const flowContexts: Obj<FlowGraphContext> = {};
    const problems: DocumentProblem[] = [];
    let criticalSubProblems = 0;

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
