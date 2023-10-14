import { createEnvironment, pushContent } from "../core/environment";
import { createAnyType, createMapType } from "../typeSystem";
import { ByteOperation, FlowDocument, FlowEnvironmentContent, FlowSignature, InputRowSignature, OutputRowSignature, TemplateParameter, byteCodeShorthands } from "../types";
import { DocumentProblem, FlowDocumentContext, FlowEnvironmentNamespace, FlowGraphContext } from "../types/context";
import { Obj } from "../types/utilTypes";
import { mem } from "../utils/functional";
import { getFlowSignature, validateFlowGraph } from "./validateFlowGraph";

const { op, data } = byteCodeShorthands;

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
        const flowContext = validateFlowGraph(flow, baseEnvironment);
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
            types: [], // maybe generate return types or something
        },
    })
);

const generateFlowSyntaxLayer = mem(generateFlowSyntaxLayerInitial);
function generateFlowSyntaxLayerInitial(
    generics: TemplateParameter[],
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
        description: null,
        attributes: { category: 'In/Out' },
        generics,
        inputs: [],
        output: {
            id: 'inputs',
            specifier: inputSpecifier,
            rowType: 'output-destructured',
        },
        byteCode: {
            type: 'inline',
            instructions: [
                // assuming args are stored in frame.locals[0]
                data(0),
                op(ByteOperation.getlocal),
            ],
        }
    }

    const outputInputs: InputRowSignature[] = [];
    if (flowOutput != null) {
        outputInputs.push({
            id: flowOutput.id,
            specifier: flowOutput.specifier,
            rowType: 'input-simple',
        });
    }
    const output: FlowSignature = {
        id: 'output',
        description: null,
        attributes: { category: 'In/Out' },
        generics,
        inputs: outputInputs,
        output: {
            id: 'output',
            rowType: 'output-hidden',
            specifier: createAnyType(),
        },
        byteCode: { type: 'inline', instructions: [] },
    }

    return {
        signatures: Object.fromEntries([input, output].map(sig => [sig.id, sig])),
        types: {},
    }
}
