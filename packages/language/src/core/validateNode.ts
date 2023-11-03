import { findEnvironmentSignature } from "./environment";
import { FlowEnvironment, FlowNode, FlowSignature, FunctionTypeSpecifier, OutputRowSignature, TemplatedTypeSpecifier } from "../types";
import { FlowNodeContext, RowContext, RowDisplay } from "../types/context";
import { Obj } from "../types/utilTypes";
import { assertTruthy } from "../utils";
import { memoList } from "../utils/functional";
import { mem } from '../utils/mem';
import { validateNodeSyntax } from "./validateNodeSyntax";

export const validateNode = mem((
    node: FlowNode,
    env: FlowEnvironment,
    inferredNodeOutputs: Obj<TemplatedTypeSpecifier>,
    isUsed: boolean,
): FlowNodeContext => {
    const templateSignature = findEnvironmentSignature(env, node.signature);
    if (templateSignature == null) {
        return noSignatureContext(node, isUsed);
    }
    const { inferredType, rowContexts } =
        validateNodeSyntax(node.rowStates, templateSignature, inferredNodeOutputs, env);

    return bundleNodeContext(
        node,
        isUsed,
        templateSignature,
        inferredType,
        memoList(
            ...templateSignature.inputs.map((input, index) =>
                rowContexts[input.id]
            ),
        ),
    );
}, undefined, { 
    tag: 'validateNode',
    generateInfo: ([node]) => `nodeId=${node.id}`,
});

const noSignatureContext = mem(
    (node: FlowNode, isUsed: boolean): FlowNodeContext => ({
        ref: node,
        problems: [{
            type: 'missing-signature',
            signature: node.signature,
            message: `Cannot find nodes signature '${node.signature}'.`,
        }],
        criticalSubProblems: 0,
        inferredType: null,
        templateSignature: null,
        inputRows: {},
        outputRow: {
            display: 'hidden',
            problems: [],
        },
        isUsed,
    }),
    undefined,
    { tag: 'noSignatureContext' },
);

const outputDisplayTypes: Record<OutputRowSignature['rowType'], RowDisplay> = {
    'output-destructured': 'destructured',
    'output-hidden': 'hidden',
    'output-simple': 'simple',
}

const bundleNodeContext = mem((
    node: FlowNode,
    isUsed: boolean,
    templateSignature: FlowSignature,
    inferredType: TemplatedTypeSpecifier<FunctionTypeSpecifier>,
    inputContexts: RowContext[],
): FlowNodeContext => {
    const result: FlowNodeContext = {
        ref: node,
        problems: [],
        criticalSubProblems: 0,
        templateSignature,
        inferredType,
        inputRows: {},
        outputRow: {
            display: outputDisplayTypes[templateSignature.output.rowType],
            problems: []
        },
        isUsed,
    };
    assertTruthy(templateSignature.inputs.length === inputContexts.length);
    for (let i = 0; i < templateSignature.inputs.length; i++) {
        const rowContext = inputContexts[i];
        result.inputRows[templateSignature.inputs[i].id] = rowContext;
        result.criticalSubProblems += rowContext.problems.length;
    }
    return result;
}, undefined, {
    tag: 'bundleNodeContext',
});
