import { findEnvironmentSignature } from "../core/environment";
import { createAnyType, createMissingType, createTupleType, getSignatureFunctionType, memoizeTypeStructure } from "../typeSystem";
import { assertSubsetType } from "../typeSystem/comparison";
import { TypeSystemException, TypeSystemExceptionData, TypeTreePath } from "../typeSystem/exceptionHandling";
import { applyInstantiationConstraints, inferGenerics } from "../typeSystem/generics";
import { tryResolveTypeAlias } from "../typeSystem/resolution";
import { FlowConnection, FlowEnvironment, FlowNode, FlowSignature, FunctionTypeSpecifier, InputRowSignature, RowState, TupleTypeSpecifier, TypeSpecifier } from "../types";
import { FlowNodeContext, RowContext, RowProblem } from "../types/context";
import { Obj } from "../types/utilTypes";
import { assertTruthy } from "../utils";
import { mem, memoList } from "../utils/functional";
import { validateRows } from "./validateRows";

export const validateNode = mem((
    node: FlowNode,
    env: FlowEnvironment,
    previousOutputTypes: Record<string, TypeSpecifier>,
    isUsed: boolean,
): FlowNodeContext => {
    const templateSignature = findEnvironmentSignature(env, node.signature);
    if (templateSignature == null) {
        return noSignatureContext(node, isUsed);
    }

    const { instantiatedNodeType, rowProblemsMap } =
        validateNodeSyntax(node.rowStates, templateSignature, previousOutputTypes, env);

    return bundleNodeContext(
        node,
        isUsed,
        templateSignature,
        instantiatedNodeType,
        memoList(
            ...templateSignature.inputs.map((input, index) =>
                validateRows(
                    input,
                    node.rowStates[input.id],
                    (instantiatedNodeType.parameter as TupleTypeSpecifier).elements[index],
                    env,
                    rowProblemsMap[input.id],
                )
            )
        ),
    );
});

const validateNodeSyntax = mem((
    rowStates: Obj<RowState>,
    templateSignature: FlowSignature,
    previousOutputTypes: Obj<TypeSpecifier>,
    env: FlowEnvironment,
) => {
    const argumentTypeList: TypeSpecifier[] = [];
    const rowProblemsMap: Record<string, RowProblem[]> = {};

    for (const input of templateSignature.inputs) {
        const rowState = rowStates[input.id] as RowState | undefined;

        const connectedTypes: TypeSpecifier[] = [];
        for (const connection of rowState?.connections || []) {
            const { connectedType, accessorProblem } = validateNodeAccessor(connection, previousOutputTypes, env);
            connectedTypes.push(connectedType || createMissingType());
            objPushConditional(rowProblemsMap, input.id, accessorProblem);
        }

        const { rowProblems: typeProblems, incomingType } =
            validateIncomingTypes(input, rowState, connectedTypes, env);
            
        argumentTypeList.push(incomingType);
        objPushConditional(rowProblemsMap, input.id, ...typeProblems);
    }

    const argumentsTuple = createTupleType(...argumentTypeList);
    const signatureFunctionType = getSignatureFunctionType(templateSignature);

    const genericMap = Object.fromEntries(
        templateSignature.generics.map(generic => [
            generic.id,
            generic.constraint || createAnyType(),
        ]),
    );
    const constraints = inferGenerics(
        argumentsTuple,
        signatureFunctionType.parameter,
        genericMap,
        env
    );

    const unmemoizedInstantiatetType = applyInstantiationConstraints(new TypeTreePath(),
        signatureFunctionType, constraints, env) as FunctionTypeSpecifier;
    const instantiatedNodeType = memoizeTypeStructure(unmemoizedInstantiatetType);

    try {
        assertSubsetType(argumentsTuple, instantiatedNodeType.parameter, env);
    } catch (e) {
        if (e instanceof TypeSystemException) {
            for (let i = 0; i < templateSignature.inputs.length; i++) {
                const input = templateSignature.inputs[i];
                const rowTypeProblem = getRowsTypeProblem(e.data, i.toString());
                objPushConditional(rowProblemsMap, input.id, rowTypeProblem);
            }
        } else {
            throw e;
        }
    }

    return { instantiatedNodeType, rowProblemsMap };
});

const validateNodeAccessor = (
    connection: FlowConnection,
    previousOutputTypes: Obj<TypeSpecifier>,
    env: FlowEnvironment,
): { connectedType?: TypeSpecifier, accessorProblem?: RowProblem } => {
    const outputType = previousOutputTypes[connection.nodeId];
    if (!outputType) {
        return {};
    }

    if (connection.accessor == null) {
        return { connectedType: outputType }
    }

    const resolvedType = tryResolveTypeAlias(outputType, env);
    if (resolvedType == null) {
        return {}
    }

    if (resolvedType.type === 'tuple') {
        const accessorIndex = parseInt(connection.accessor);
        if (isNaN(accessorIndex)) {
            return {
                accessorProblem: {
                    type: 'invalid-accessor',
                    message: `Cannot access tuple type with accessor '${connection.accessor}'.`,
                }
            };
        }
        const tupleLength = resolvedType.elements.length;
        if (accessorIndex < 0 || accessorIndex >= tupleLength) {
            return {
                accessorProblem: {
                    type: 'invalid-accessor',
                    message: `Accessor with index ${accessorIndex} out of range for tuple with length ${tupleLength}.`,
                }
            };
        }
        return { connectedType: resolvedType.elements[accessorIndex] };
    }

    if (resolvedType.type === 'map') {
        const hasKey = resolvedType.elements.hasOwnProperty(connection.accessor);
        if (!hasKey) {
            return {
                accessorProblem: {
                    type: 'invalid-accessor',
                    message: `Object type does not contain key '${connection.accessor}'.`,
                }
            };
        }
        return { connectedType: resolvedType.elements[connection.accessor] };
    }

    return {
        accessorProblem: {
            type: 'invalid-accessor',
            message: `Type of category '${resolvedType.type}' cannot be destructured.`,
        }
    };
}

const validateIncomingTypes = (
    input: InputRowSignature,
    rowState: RowState | undefined,
    connectedTypes: TypeSpecifier[],
    env: FlowEnvironment,
): { incomingType: TypeSpecifier, rowProblems: RowProblem[] } => {
    const rowProblems: RowProblem[] = [];

    if (input.rowType === 'input-list') {
        const incomingType = createTupleType(...connectedTypes);
        const resolvedSpec = tryResolveTypeAlias(input.specifier, env);
        if (resolvedSpec && resolvedSpec.type !== 'list') {
            rowProblems.push({
                type: 'invalid-specifier',
                message: 'A list input row must be of a list type.',
            });
        }
        return { incomingType, rowProblems };
    }

    if (input.rowType === 'input-function') {
        // find incoming type
        let functionSpec: TypeSpecifier | undefined;
        if (typeof rowState?.value === 'string') {
            const funcSignature = findEnvironmentSignature(env, rowState.value);
            functionSpec = funcSignature && getSignatureFunctionType(funcSignature);
        }

        // validate signature type
        const resolvedSpec = tryResolveTypeAlias(input.specifier, env);
        if (resolvedSpec && resolvedSpec.type !== 'function') {
            rowProblems.push({
                type: 'invalid-specifier',
                message: 'A function input row must be of a function type.',
            });
        }
        const incomingType = connectedTypes[0] || functionSpec || createMissingType();
        return { incomingType, rowProblems };
    }
    if (input.rowType === 'input-simple') {
        return {
            incomingType: connectedTypes[0] || createMissingType(),
            rowProblems: [],
        }
    }
    if (input.rowType === 'input-variable') {
        return {
            incomingType: connectedTypes[0] || input.specifier,
            rowProblems: [],
        };
    }

    // @ts-ignore
    throw new Error(`Unknown input type ${input.rowType}`);
}

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
        outputRow: { problems: [] },
        isUsed,
    })
);

const bundleNodeContext = mem((
    node: FlowNode,
    isUsed: boolean,
    templateSignature: FlowSignature,
    specifier: FunctionTypeSpecifier,
    inputContexts: RowContext[],
): FlowNodeContext => {
    const result: FlowNodeContext = {
        ref: node,
        problems: [],
        criticalSubProblems: 0,
        templateSignature,
        specifier,
        inputRows: {},
        outputRow: { problems: [] },
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

function getRowsTypeProblem(typeComparisonProblem: TypeSystemExceptionData | undefined, rowId: string): RowProblem | undefined {
    if (typeComparisonProblem == null) return;

    const [_, rowKey, nextType, tupleIndex] = typeComparisonProblem.path.nodes.map(node => node.key);
    if (rowKey !== rowId) return;

    const reducedData: TypeSystemExceptionData = {
        ...typeComparisonProblem,
        path: new TypeTreePath(typeComparisonProblem.path.nodes.slice(2)),
    }
    let connectionIndex = 0;
    if (nextType === 'tuple' && tupleIndex != null && isFinite(parseInt(tupleIndex))) {
        connectionIndex = parseInt(tupleIndex);
    }

    if (reducedData.type === 'required-type') {
        return {
            type: 'required-parameter',
            message: 'This row requires a connection.'
        };
    } else {
        return {
            type: 'incompatible-argument-type',
            message: 'Input is not compatible with rows specified type.',
            typeProblem: reducedData,
            connectionIndex,
        };
    }
}

function objPushConditional<T>(obj: Record<string, T[]>, key: string, ...elements: (T | undefined)[]) {
    if (obj[key] == null) {
        obj[key] = [];
    }
    elements.forEach(el => {
        if (el != null) {
            obj[key].push(el);
        }
    })
}