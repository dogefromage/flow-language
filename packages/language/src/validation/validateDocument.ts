import { baseEnvironmentContent } from "../content/baseEnvironment";
import { createEnvironment, pushContent } from "../core/environment";
import { FlowDocument, FlowEnvironmentContent, FlowSignature, GenericTag, InputRowSignature, OutputRowSignature, getInternalId } from "../types";
import { DocumentContext, DocumentProblem, FlowGraphContext } from "../types/context";
import { Obj } from "../types/utilTypes";
import { mem } from "../utils/functional";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";

export const validateDocument = mem((document: FlowDocument) => {
    const { 
        flows: rawFlowMap, 
        config: {}
    } = document;

    const flowContexts: Obj<FlowGraphContext> = {};
    const problems: DocumentProblem[] = [];
    let environment = createEnvironment(baseEnvironmentContent);
    let criticalSubProblems = 0;
    
    const flowsSorted = Object.values(rawFlowMap)
        .sort((a, b) => a.id.localeCompare(b.id));

    const signatureContent = makeFlowSignaturesContent(
        ...flowsSorted.map(getFlowSignature)
    );
    environment = pushContent(environment, signatureContent);

    for (const flow of flowsSorted) {
        const flowSyntaxContent = generateFlowSyntaxLayer(flow.generics, flow.inputs, flow.outputs);
        const flowSyntaxEnv = pushContent(environment, flowSyntaxContent);
        const flowContext = validateFlowGraph(flow, flowSyntaxEnv);
        flowContexts[flow.id] = flowContext;
        criticalSubProblems += flowContext.problems.length + flowContext.criticalSubProblems;
    }

    const result: DocumentContext = {
        ref: document,
        flowContexts, 
        problems,
        criticalSubProblems,
        environment,
    };
    return result;
});

const makeFlowSignaturesContent = mem(
    (...signatureList: FlowSignature[]): FlowEnvironmentContent => ({
        signatures: Object.fromEntries(signatureList.map(s => [ s.id, s ])),
        types: {}, // maybe generate return types or something
    })
);

const generateFlowSyntaxLayer = mem(generateFlowSyntaxLayerInitial);
function generateFlowSyntaxLayerInitial(
    generics: GenericTag[],
    flowInputs: InputRowSignature[],
    flowOutputs: OutputRowSignature[],
): FlowEnvironmentContent {
    const input: FlowSignature = {
        id: getInternalId('input'),
        name: 'Input',
        description: null,
        attributes: { category: 'In/Out' },
        generics,
        inputs: [],
        outputs: flowInputs.map(o => ({
            id: o.id,
            label: o.label,
            specifier: o.specifier,
            rowType: 'output',
        })),
    }
    const output: FlowSignature = {
        id: getInternalId('output'),
        name: 'Output',
        description: null,
        attributes: { category: 'In/Out' },
        generics,
        inputs: flowOutputs.map(o => ({
            id: o.id,
            label: o.label,
            specifier: o.specifier,
            rowType: 'input-simple',
        })),
        outputs: [],
    }
    const signatures = Object.fromEntries([input, output].map(sig => [sig.id, sig]));
    return {
        signatures,
        types: {},
    }
}
