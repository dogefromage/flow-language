import { baseEnvironmentContent } from "../content/baseEnvironment";
import { createEnvironment, pushContent } from "../core/environment";
import { createAnyType, createMapType } from "../typeSystem";
import { FlowDocument, FlowEnvironmentContent, FlowSignature, GenericTag, InputRowSignature, OutputRowSignature } from "../types";
import { FlowDocumentContext, DocumentProblem, FlowGraphContext } from "../types/context";
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
        const flowSyntaxContent = generateFlowSyntaxLayer(flow.generics, flow.inputs, flow.output);
        const flowSyntaxEnv = pushContent(environment, flowSyntaxContent);
        const flowContext = validateFlowGraph(flow, flowSyntaxEnv);
        flowContexts[flow.id] = flowContext;
        criticalSubProblems += flowContext.problems.length + flowContext.criticalSubProblems;
    }

    const result: FlowDocumentContext = {
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
        signatures: Object.fromEntries(signatureList.map(s => [s.id, s])),
        types: {}, // maybe generate return types or something
    })
);

const generateFlowSyntaxLayer = mem(generateFlowSyntaxLayerInitial);
function generateFlowSyntaxLayerInitial(
    generics: GenericTag[],
    flowInputs: InputRowSignature[],
    flowOutput: OutputRowSignature | null,
): FlowEnvironmentContent {
    const inputSpecifier = createMapType(
        Object.fromEntries(
            flowInputs.map(input => [input.id, input.specifier])
        )
    );
    const input: FlowSignature = {
        id: 'input',
        // id: getInternalId('input'),
        // name: 'Input',
        description: null,
        attributes: { category: 'In/Out' },
        generics,
        inputs: [],
        output: {
            id: 'inputs',
            // label: 'Inputs',
            specifier: inputSpecifier,
            rowType: 'output-destructured',
        }
        // outputs: flowInputs.map(o => ({
        //     id: o.id,
        //     label: o.label,
        //     specifier: o.specifier,
        //     rowType: 'output',
        // })),
    }

    const outputInputs: InputRowSignature[] = [];
    if (flowOutput != null) {
        outputInputs.push({
            id: flowOutput.id,
            // label: flowOutput.label,
            specifier: flowOutput.specifier,
            rowType: 'input-simple',
        });
    }
    const output: FlowSignature = {
        id: 'output',
        // id: getInternalId('output'),
        // name: 'Output',
        description: null,
        attributes: { category: 'In/Out' },
        generics,
        inputs: outputInputs,
        output: {
            id: 'output',
            // label: 'Output',
            rowType: 'output-hidden',
            specifier: createAnyType(),
        },
    }
    
    return {
        signatures: Object.fromEntries([input, output].map(sig => [sig.id, sig])),
        types: {},
    }
}
