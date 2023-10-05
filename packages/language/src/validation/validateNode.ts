import { getScopedSignature } from "../core/environment";
import { FlowEnvironment, FlowNode, FlowSignature, FunctionTypeSpecifier, OutputRowSignature, TypeSpecifier } from "../types";
import { FlowNodeContext, RowContext, RowDisplay } from "../types/context";
import { assertTruthy } from "../utils";
import { mem, memoList } from "../utils/functional";
import { validateNodeSyntax } from "./validateNodeSyntax";

export const validateNode = mem((
    node: FlowNode,
    env: FlowEnvironment,
    inferredNodeOutputs: Record<string, TypeSpecifier>,
    isUsed: boolean,
): FlowNodeContext => {
    const searchRes = getScopedSignature(env, node.signature);
    if (searchRes == null) {
        return noSignatureContext(node, isUsed);
    }
    const [templateSignature, baseScopeLabel] = searchRes;
    const scopedNodeLabel = `${baseScopeLabel}:${templateSignature.id}`;

    const { inferredType, rowContexts } =
        validateNodeSyntax(node.rowStates, templateSignature, inferredNodeOutputs, env);

    return bundleNodeContext(
        node,
        scopedNodeLabel,
        isUsed,
        templateSignature,
        inferredType,
        memoList(
            ...templateSignature.inputs.map((input, index) =>
                rowContexts[input.id]
            ),
        ),
    );
});

const noSignatureContext = mem(
    (node: FlowNode, isUsed: boolean): FlowNodeContext => ({
        ref: node,
        scopedLabel: 'missing',
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
    })
);

const outputDisplayTypes: Record<OutputRowSignature['rowType'], RowDisplay> = {
    'output-destructured': 'destructured' ,
    'output-hidden':       'hidden' ,
    'output-simple':       'simple' ,
}

const bundleNodeContext = mem((
    node: FlowNode,
    scopedLabel: string,
    isUsed: boolean,
    templateSignature: FlowSignature,
    inferredType: FunctionTypeSpecifier,
    inputContexts: RowContext[],
): FlowNodeContext => {
    const result: FlowNodeContext = {
        ref: node,
        scopedLabel,
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
    // debugHitMiss: true,
});
