import { baseEnvironmentContent } from "../content/baseEnvironment";
import { createEnvironment, pushContent } from "../core/environment";
import { FlowDocument, FlowEnvironmentContent, FlowSignature, InputRowSignature, OutputRowSignature, getInternalId } from "../types";
import { DocumentContext, FlowGraphContext, DocumentProblem } from "../types/context";
import { Obj } from "../types/utilTypes";
import { deepFreeze } from "../utils";
import { memFreeze } from "../utils/functional";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";

export function validateDocument(document: FlowDocument): DocumentContext {
    const { 
        flows: rawFlowMap, 
        config: { /* entryFlows */ }
    } = document;

    const flowContexts: Obj<FlowGraphContext> = {};
    const problems: DocumentProblem[] = [];
    let environment = createEnvironment(baseEnvironmentContent);
    let criticalSubProblems = 0;
    
    // const signatureDeps = new DependencyGraph<string>();
    // for (const flow of Object.values(rawFlowMap)) {
    //     const flowDependencies = collectFlowDependencies(flow);
    //     signatureDeps.addDependencies(flow.id, flowDependencies);
    //     // add every dependency, also built-in ones
    // }

    // const topSortResult = signatureDeps.sortTopologically();
    // if (topSortResult.cycles.length) {
    //     result.problems.push({
    //         type: 'cyclic-flows',
    //         cycles: topSortResult.cycles,
    //     });
    // }
    // result.topologicalFlowOrder = topSortResult.bottomToTopDependencies;

    // for (const [entryId, entryPoint] of Object.entries(entryFlows)) {
    //     const topFlow = rawFlowMap[entryPoint.entryFlowId];
    //     if (topFlow == null) {
    //         result.problems.push({
    //             type: 'missing-top-flow',
    //             id: entryPoint.entryFlowId,
    //         });
    //     } else {
    //         const depsRecursive = signatureDeps.findDependenciesRecursive(entryPoint.entryFlowId);
    //         result.entryPointDependencies[entryId] = [...depsRecursive];
    //     }
    // }

    const flowsAnyOrder = Object.values(rawFlowMap);

    const signatureContent = makeFlowSignaturesContent(
        ...flowsAnyOrder.map(getFlowSignature)
    );
    environment = pushContent(environment, signatureContent);

    for (const flow of flowsAnyOrder) {
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
    deepFreeze(result);
    return result;
};

const makeFlowSignaturesContent = memFreeze(
    (...signatureList: FlowSignature[]): FlowEnvironmentContent => ({
        signatures: Object.fromEntries(signatureList.map(s => [ s.id, s ])),
        types: {}, // maybe generate return types or something
    })
);

const generateFlowSyntaxLayer = memFreeze(generateFlowSyntaxLayerInitial);
function generateFlowSyntaxLayerInitial(
    generics: string[],
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
