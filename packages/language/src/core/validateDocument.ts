import { DocumentProblem, FlowDocument, FlowDocumentContext, FlowEnvironmentNamespace, FlowGraphContext, FlowSignature, LanguageConfiguration } from "../types";
import { ListCache } from "../utils/ListCache";
import { mem } from '../utils/mem';
import { createEnvironment } from "./environment";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";

export const validateDocument = mem((document: FlowDocument, configuration: LanguageConfiguration) => {
    const { flows: rawFlowMap } = document;

    const flowContexts: Record<string, FlowGraphContext> = {};
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
        const flowContext = validateFlowGraph(flow, baseEnvironment, configuration.modules);
        flowContexts[flow.id] = flowContext;
        criticalSubProblems += flowContext.problems.length + flowContext.criticalSubProblems;
    }

    const result: FlowDocumentContext = {
        flowContexts,
        problems,
        criticalSubProblems,
        environment: baseEnvironment,
    };
    return result;
}, new ListCache(1), {
    tag: 'validateDocument',
});

const makeDocumentNamespace = mem((
    ...signatureList: FlowSignature[]
): FlowEnvironmentNamespace => {
    // const outputConstructorTypes: Record<string, TExpr> = {};
    // for (const signature of signatureList) {

    //     if (signature.generics.length > 0) {
    //         // will not provide generic type for now
    //         continue;
    //     }

    //     const signatureType = getTemplatedSignatureType(signature);
    //     const outputType = signatureType.specifier.output;
        
    //     const typeName = _.capitalize(signature.id);
    //     outputConstructorTypes[typeName] = outputType;
    // }

    return {
        name: 'document',
        content: {
            signatures: signatureList,
            types: {},
            // types: outputConstructorTypes,
        },
    };
}, undefined, { tag: 'makeDocumentNamespace' });
