import _ from "lodash";
import { createReducedTemplateType, getTemplatedSignatureType, memoizeTemplatedType } from "../typeSystem";
import { DocumentProblem, FlowDocument, FlowDocumentContext, FlowEnvironmentNamespace, FlowGraphContext, FlowSignature, LanguageConfiguration, TypeSpecifier } from "../types";
import { ListCache } from "../utils/ListCache";
import { mem } from '../utils/mem';
import { createEnvironment } from "./environment";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";
import { instantiateTemplatedType } from "../typeSystem/generics";
import { TypeTreePath } from "../typeSystem/exceptionHandling";

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
        ref: document,
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
    const outputConstructorTypes: Record<string, TypeSpecifier> = {};
    for (const signature of signatureList) {
        const signatureType = getTemplatedSignatureType(signature);
        const templatedOutput = memoizeTemplatedType(
            createReducedTemplateType(
                signatureType.generics,
                signatureType.specifier.output,
            )
        );
        
        const dummyEnvironment = createEnvironment({ content: {
            types: {},
            signatures: [],
        }, name: '' });
        const crudeInstantiatedType = instantiateTemplatedType(
            new TypeTreePath(), templatedOutput, instantiationMap,
            templatedOutput.generics, dummyEnvironment);
        
        
        const typeName = _.capitalize(signature.id);
        outputConstructorTypes[typeName] = templatedOutput;
    }
    return {
        name: 'document',
        content: {
            signatures: signatureList,
            types: {},
        },
    };
}, undefined, { tag: 'makeDocumentNamespace' });
