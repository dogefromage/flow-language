import { findEnvironmentSignature } from "../core/environment";
import { createFunctionType, createMapType, createMissingType, createTupleType, createAnyType, getSignatureFunctionType, memoizeTypeStructure } from "../typeSystem";
import { assertSubsetType } from "../typeSystem/comparison";
import { TypeSystemException, TypeSystemExceptionData, TypeTreePath } from "../typeSystem/exceptionHandling";
import { generateDefaultValue } from "../typeSystem/generateDefaultValue";
import { applyInstantiationConstraints, inferGenerics } from "../typeSystem/generics";
import { assertElementOfType } from "../typeSystem/validateElement";
import { FlowEnvironment, FlowNode, FlowSignature, FunctionTypeSpecifier, InitializerValue, InputRowSignature, MapTypeSpecifier, RowState, TypeSpecifier } from "../types";
import { FlowNodeContext, RowContext } from "../types/context";
import { Obj } from "../types/utilTypes";
import { assertTruthy } from "../utils";
import { mem, memoList } from "../utils/functional";

export const validateNode = mem((
    node: FlowNode,
    env: FlowEnvironment,
    earlierNodeOutputTypes: Record<string, MapTypeSpecifier>,
    isUsed: boolean,
): FlowNodeContext => {
    const templateSignature = findEnvironmentSignature(env, node.signature);
    if (templateSignature == null) {
        return noSignatureContext(node, isUsed);
    }

    const { instantiatedNodeType, typeComparisonProblem } =
        validateNodeInput(node.rowStates, templateSignature, earlierNodeOutputTypes, env);

    return bundleNodeContext(
        node,
        isUsed,
        templateSignature,
        instantiatedNodeType,
        memoList(
            ...templateSignature.inputs.map(input =>
                validateRows(
                    input,
                    node.rowStates[input.id], instantiatedNodeType.parameter.elements[input.id],
                    env,
                    typeComparisonProblem
                )
            )
        ),
        memoList(
            ...templateSignature.outputs.map(output =>
            ({
                ref: node.rowStates[output.id],
                problems: [],
            })
            )
        ),
    );
});

const validateNodeInput = mem((
    rowStates: Obj<RowState>,
    templateSignature: FlowSignature,
    earlierNodeOutputTypes: Obj<MapTypeSpecifier>,
    env: FlowEnvironment,
) => {
    const incomingTypeMap: Record<string, TypeSpecifier> = {};
    for (const input of templateSignature.inputs) {
        const rowState = rowStates[input.id] as RowState | undefined;
        // each node input receives a list of connections to support list inputs
        const connectedTypes = rowState?.connections.map(conn =>
            earlierNodeOutputTypes[conn.nodeId]?.elements[conn.outputId] || createAnyType()
        ) || [];

        switch (input.rowType) {
            case 'input-list':
                incomingTypeMap[input.id] = createTupleType(...connectedTypes);
                break;
            case 'input-simple':
                incomingTypeMap[input.id] = connectedTypes[0] || createMissingType();
                break;
            case 'input-variable':
                incomingTypeMap[input.id] = connectedTypes[0] || input.specifier;
                break;
        }
    }

    const argumentTypeSignature = createMapType(incomingTypeMap);
    const signatureFunctionType = getSignatureFunctionType(templateSignature);

    const genericMap = Object.fromEntries(
        templateSignature.generics.map(generic => [ 
            generic.id, 
            generic.constraint || createAnyType(), 
        ]),
    );
    const constraints = inferGenerics(
        argumentTypeSignature,
        signatureFunctionType.parameter,
        genericMap,
        env
    );

    const unmemoizedInstantiatetType = applyInstantiationConstraints(new TypeTreePath(),
        signatureFunctionType, constraints, env) as FunctionTypeSpecifier;
    const instantiatedNodeType = memoizeTypeStructure(unmemoizedInstantiatetType);

    let typeComparisonProblem: TypeSystemExceptionData | undefined;
    try {
        assertSubsetType(argumentTypeSignature, instantiatedNodeType.parameter, env);
    } catch (e) {
        if (e instanceof TypeSystemException) {
            typeComparisonProblem = e.data;
        } else {
            throw e;
        }
    }
    return { instantiatedNodeType, typeComparisonProblem };
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
        specifier: null,
        templateSignature: null,
        inputRows: {},
        outputRows: {},
        isUsed,
    })
);

const bundleNodeContext = mem((
    node: FlowNode,
    isUsed: boolean,
    templateSignature: FlowSignature,
    specifier: FunctionTypeSpecifier,
    inputContexts: RowContext[],
    outputContexts: RowContext[],
): FlowNodeContext => {

    const result: FlowNodeContext = {
        ref: node,
        problems: [],
        criticalSubProblems: 0,
        templateSignature,
        specifier,
        inputRows: {},
        outputRows: {},
        isUsed,
    };
    assertTruthy(templateSignature.inputs.length === inputContexts.length);
    for (let i = 0; i < templateSignature.inputs.length; i++) {
        const rowContext = inputContexts[i];
        result.inputRows[templateSignature.inputs[i].id] = rowContext;
        result.criticalSubProblems += rowContext.problems.length;
    }
    assertTruthy(templateSignature.outputs.length === outputContexts.length);
    for (let i = 0; i < templateSignature.outputs.length; i++) {
        const rowContext = outputContexts[i];
        result.outputRows[templateSignature.outputs[i].id] = rowContext;
        result.criticalSubProblems += rowContext.problems.length;
    }
    return result;
}, undefined, {
    tag: 'bundleNodeContext',
    // debugHitMiss: true,
});

const validateRows = mem((
    input: InputRowSignature,
    rowState: RowState | undefined,
    specifier: TypeSpecifier,
    env: FlowEnvironment,
    typeComparisonProblem: TypeSystemExceptionData | undefined,
): RowContext => {

    const result: RowContext = {
        ref: rowState,
        problems: [],
    };

    const rowTypeProblem = getRowSpecificProblem(typeComparisonProblem, input.id);
    if (rowTypeProblem != null) {
        const { connectionIndex, reducedData } = rowTypeProblem;
        if (reducedData.type === 'required-type') {
            result.problems.push({
                type: 'required-parameter',
                message: 'This row requires a connection.'
            });
        } else {
            result.problems.push({
                type: 'incompatible-argument-type',
                message: 'Connected value cannot be used as input for this row.',
                typeProblem: reducedData,
                connectionIndex,
            })
        }
    }

    const isConnected = rowState?.connections.length && rowState.connections.length > 0;

    if (input.rowType === 'input-variable' && !isConnected) {
        let displayValue: InitializerValue | undefined = rowState?.value ?? input.defaultValue;
        // validate value if there
        if (displayValue != null) {
            try {
                assertElementOfType(specifier, displayValue, env);
            } catch (e) {
                if (e instanceof TypeSystemException) {
                    result.problems.push({
                        type: 'invalid-value',
                        typeProblem: e.data,
                        message: 'Incompatible value stored in row.'
                    });
                    displayValue = undefined;
                } else {
                    throw e;
                }
            }
        }
        result.displayValue = displayValue ?? generateDefaultValue(specifier, env);
    }
    return result;
}, undefined, {
    tag: 'validateRows',
    // debugHitMiss: true,
    // debugHitMissRate: true,
});

function getRowSpecificProblem(typeComparisonProblem: TypeSystemExceptionData | undefined, rowId: string) {
    if (typeComparisonProblem != null) {
        const [_, rowKey, nextType, tupleIndex] = typeComparisonProblem.path.nodes.map(node => node.key);
        if (rowKey === rowId) {
            const reducedData: TypeSystemExceptionData = {
                ...typeComparisonProblem,
                path: new TypeTreePath(typeComparisonProblem.path.nodes.slice(2)),
            }
            let connectionIndex = 0;
            if (nextType === 'tuple' && tupleIndex != null && isFinite(parseInt(tupleIndex))) {
                connectionIndex = parseInt(tupleIndex);
            }
            return {
                connectionIndex,
                reducedData,
            }
        }
    }
}

// function generateIncomingTypeMap(rowStates: Obj<RowState>, templateSignature: FlowSignature, earlierNodeOutputTypes: Obj<MapTypeSpecifier>) {
// }

