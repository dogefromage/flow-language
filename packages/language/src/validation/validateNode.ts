import { findEnvironmentSignature } from "../core/environment";
import { createFunctionType, createMapType, createMissingType, createTupleType, createUnknownType } from "../typeSystem";
import { assertSubsetType } from "../typeSystem/comparison";
import { TypeSystemException, TypeSystemExceptionData, TypeTreePath } from "../typeSystem/exceptionHandling";
import { generateDefaultValue } from "../typeSystem/generateDefaultValue";
import { applyInstantiationConstraints, inferGenerics } from "../typeSystem/generics";
import { assertElementOfType } from "../typeSystem/validateElement";
import { FlowEnvironment, FlowNode, FlowSignature, FunctionTypeSpecifier, InitializerValue, InputRowSignature, MapTypeSpecifier, RowState, TypeSpecifier } from "../types";
import { FlowNodeContext, RowContext } from "../types/context";
import { assertTruthy } from "../utils";
import { memFreeze, memoList } from "../utils/functional";

export function validateNode(
    node: FlowNode,
    env: FlowEnvironment,
    earlierNodeOutputTypes: Map<string, MapTypeSpecifier>,
    isUsed: boolean,
): FlowNodeContext {
    const templateSignature = findEnvironmentSignature(env, node.signature);
    if (templateSignature == null) {
        return noSignatureContext(node, isUsed);
    }

    const incomingTypeMap: Record<string, TypeSpecifier> = {};
    for (const input of templateSignature.inputs) {
        const rowState = node.rowStates[input.id] as RowState | undefined;
        const connectedTypes = selectConnectedTypes(rowState, earlierNodeOutputTypes);
        switch (input.rowType) {
            case 'input-list':
                incomingTypeMap[input.id] = createTupleType(...connectedTypes);
                break;
            case 'input-simple':
                incomingTypeMap[input.id] = connectedTypes[0] || createMissingType();
                break;
            case 'input-variable':
                incomingTypeMap[input.id] = connectedTypes[0] || input.dataType;
                break;
        }
    }

    const argumentTypeSignature = createMapType(incomingTypeMap);
    const signatureFunctionType = getSignatureFunctionType(templateSignature);

    const freeGenerics = new Set(templateSignature.generics);
    const constraints = inferGenerics(new TypeTreePath(),
        argumentTypeSignature, signatureFunctionType.parameter, freeGenerics, env);

    const instantiatedNodeType = applyInstantiationConstraints(new TypeTreePath(),
        signatureFunctionType, constraints, env) as FunctionTypeSpecifier;

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

    const inputContexts: RowContext[] = [];
    for (const input of templateSignature.inputs) {
        const rowState = node.rowStates[input.id] as RowState | undefined;
        const specifier = instantiatedNodeType.parameter.elements[input.id];
        const rowResult = validateRows(input, rowState, specifier, env, typeComparisonProblem);
        inputContexts.push(rowResult);
    }
    const outputContexts: RowContext[] = [];
    for (const output of templateSignature.outputs) {
        outputContexts.push({
            ref: node.rowStates[output.id], // probably empty
            problems: [],
        });
    }
    return bundleNodeContext(
        node,
        isUsed,
        templateSignature,
        instantiatedNodeType,
        memoList(...inputContexts),
        memoList(...outputContexts),
    );
}

function getSignatureFunctionType(signature: FlowSignature) {
    return createFunctionType(
        createMapType(
            Object.fromEntries(
                signature.inputs.map(s => [s.id, s.dataType])
            )
        ),
        createMapType(
            Object.fromEntries(
                signature.outputs.map(s => [s.id, s.dataType])
            )
        )
    );
}

const noSignatureContext = memFreeze(
    (node: FlowNode, isUsed: boolean): FlowNodeContext => ({
        ref: node,
        problems: [{
            type: 'missing-signature',
            signature: node.signature,
        }],
        childProblemCount: 0,
        specifier: null,
        templateSignature: null,
        rowContexts: {},
        isUsed,
    })
);

const bundleNodeContext = memFreeze((
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
        childProblemCount: 0,
        templateSignature,
        specifier,
        rowContexts: {},
        isUsed,
    };
    assertTruthy(templateSignature.inputs.length === inputContexts.length);
    for (let i = 0; i < templateSignature.inputs.length; i++) {
        const rowContext = inputContexts[i];
        result.rowContexts[templateSignature.inputs[i].id] = rowContext;
        result.childProblemCount += rowContext.problems.length;
    }
    assertTruthy(templateSignature.outputs.length === outputContexts.length);
    for (let i = 0; i < templateSignature.outputs.length; i++) {
        const rowContext = outputContexts[i];
        result.rowContexts[templateSignature.outputs[i].id] = rowContext;
        result.childProblemCount += rowContext.problems.length;
    }
    return result;
});

const selectConnectedTypes = memFreeze((
    rowState: RowState | undefined,
    earlierNodeOutputTypes: Map<string, MapTypeSpecifier>,
) => {
    // each node input receives a list of connections to support list inputs
    const connectedTypes: TypeSpecifier[] = rowState?.connections
        .map(conn => earlierNodeOutputTypes
            .get(conn.nodeId)?.elements[conn.outputId] || createUnknownType()
        ) || [];
    return memoList(...connectedTypes);
});

const validateRows = memFreeze((
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
            });
        } else {
            result.problems.push({
                type: 'incompatible-argument-type',
                typeProblem: reducedData,
                connectionIndex,
            })
        }
    }

    const isConnected = rowState?.connections.length && rowState.connections.length > 0;

    if (input.rowType === 'input-variable' && !isConnected) {
        let displayValue: InitializerValue | undefined = rowState?.value ?? input.defaultValue;

        if (displayValue != null) {
            try {
                assertElementOfType(specifier, displayValue, env);
            } catch (e) {
                if (e instanceof TypeSystemException) {
                    result.problems.push({
                        type: 'invalid-value',
                        typeProblem: e.data,
                    });
                    displayValue = undefined;
                } else {
                    throw e;
                }
            }
        }
        const generatedDefault = generateDefaultValue(specifier, env);
        result.displayValue = displayValue ?? generatedDefault;
    }
    return result;
});

function getRowSpecificProblem(typeComparisonProblem: TypeSystemExceptionData | undefined, rowId: string) {
    if (typeComparisonProblem != null) {
        const [_, rowKey, nextType, tupleIndex ] = typeComparisonProblem.path.nodes.map(node => node.key);
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
