import { DocumentContext, DocumentProblem, FlowDocument, FlowGraphContext, LanguageConfiguration } from "../types";
import { createEnvironment } from "./environment";
import { validateFlow } from "./validateFlow";

export const validateDocument = (document: FlowDocument, configuration: LanguageConfiguration) => {
    const flowContexts: Record<string, FlowGraphContext> = {};
    const problems: DocumentProblem[] = [];

    let baseEnvironment = createEnvironment(null);

    for (const flow of Object.values(document.flows)) {
        const flowContext = validateFlow(flow, baseEnvironment, configuration.modules);
        flowContexts[flow.id] = flowContext;
    }
    const result: DocumentContext = {
        flowContexts,
        problems,
    };
    return result;
};

// const makeDocumentNamespace = mem((
//     ...signatureList: FlowSignature[]
// ): EnvScopeFrame => {
//     // const outputConstructorTypes: Record<string, TExpr> = {};
//     // for (const signature of signatureList) {

//     //     if (signature.generics.length > 0) {
//     //         // will not provide generic type for now
//     //         continue;
//     //     }

//     //     const signatureType = getTemplatedSignatureType(signature);
//     //     const outputType = signatureType.specifier.output;
        
//     //     const typeName = _.capitalize(signature.id);
//     //     outputConstructorTypes[typeName] = outputType;
//     // }

//     return {
//         name: 'document',
//         content: {
//             signatures: signatureList,
//             types: {},
//             // types: outputConstructorTypes,
//         },
//     };
// }, undefined, { tag: 'makeDocumentNamespace' });
