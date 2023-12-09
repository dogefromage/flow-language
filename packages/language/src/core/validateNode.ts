import { Obj } from "../types/internal";
import { assertTruthy } from "../utils";
import { memoList } from "../utils/functional";
import { mem } from '../utils/mem';
import { validateNodeSyntax } from "./validateNodeSyntax";

export const validateNode = mem((
    node: ApplicationNode,
    env: FlowEnvironment,
    inferredNodeOutputs: Obj<TemplatedTypeSpecifier>,
    isUsed: boolean,
): ApplicationFlowElementContext => {
    const templateSignature = findEnvironmentSignature(env, node.protoPath);
    if (templateSignature == null) {
        return noSignatureContext(node, isUsed);
    }
    const { inferredType, rowContexts } =
        validateNodeSyntax(node.inputs, templateSignature, inferredNodeOutputs, env);

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
    (node: ApplicationNode, isUsed: boolean): ApplicationFlowElementContext => ({
        ref: node,
        problems: [{
            type: 'missing-signature',
            signature: node.protoPath,
            message: `Cannot find nodes signature '${node.protoPath}'.`,
        }],
        criticalSubProblems: 0,
        inferredType: null,
        proto: null,
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

const bundleNodeContext = mem((
    node: ApplicationNode,
    isUsed: boolean,
    templateSignature: FlowSignature,
    inferredType: TemplatedTypeSpecifier<FunctionTypeSpecifier>,
    inputContexts: ArgumentRowContext[],
): ApplicationFlowElementContext => {

    const shouldDestructure = 
        node.output.destructure 
        ?? templateSignature.output.defaultDestructure 
        ?? false;

    let rowDisplay: RowDisplay = 'simple';
    if (shouldDestructure) {
        rowDisplay = 'destructured';
    }
    if (templateSignature.output.hidden) {
        rowDisplay = 'hidden';
    }

    const result: ApplicationFlowElementContext = {
        ref: node,
        problems: [],
        criticalSubProblems: 0,
        proto: templateSignature,
        inferredType,
        inputRows: {},
        outputRow: {
            display: rowDisplay,
            problems: [],
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
