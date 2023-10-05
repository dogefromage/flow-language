import { findEnvironmentSignature } from "../core/environment";
import { createAnyType, createMapType, createTupleType, getTemplatedSignatureType, memoizeTypeStructure } from "../typeSystem";
import { assertSubsetType } from "../typeSystem/comparison";
import { TypeSystemException, TypeSystemExceptionData, TypeTreePath } from "../typeSystem/exceptionHandling";
import { generateDefaultValue } from "../typeSystem/generateDefaultValue";
import { closeTemplatedSpecifier, instantiateTemplatedType, mapTypeInference } from "../typeSystem/generics";
import { resolveTypeAlias, tryResolveTypeAlias } from "../typeSystem/resolution";
import { checkElementOfType } from "../typeSystem/validateElement";
import { FlowConnection, FlowEnvironment, FlowSignature, FunctionTypeSpecifier, InputRowSignature, RowContext, RowProblem, RowState, TupleTypeSpecifier, TypeSpecifier } from "../types";
import { Obj } from "../types/utilTypes";
import { assertDef, assertTruthy } from "../utils";
import { mapObj, mem, objToArr } from "../utils/functional";

export const validateNodeSyntax = mem((
    rowStates: Obj<RowState>,
    signature: FlowSignature,
    inferredNodeOutputs: Record<string, TypeSpecifier>,
    env: FlowEnvironment,
): { inferredType: FunctionTypeSpecifier, rowContexts: Obj<RowContext> } => {
    const rowProblemsMap: Record<string, RowProblem[]> = {};

    // accumulator for type inference in loop
    let templatedAccumulatedType = getTemplatedSignatureType(signature);
    let closedAccumulatedType = closeTemplatedSpecifier(templatedAccumulatedType);

    const incomingTypes: TypeSpecifier[] = [];

    for (let inputIndex = 0; inputIndex < signature.inputs.length; inputIndex++) {
        const input = signature.inputs[inputIndex];
        const rowState = rowStates[input.id] as RowState | undefined;

        // debugger

        const closedInputType = getFunctionParamType(closedAccumulatedType, inputIndex);
        const { incomingType, rowProblems: incomingProblems } =
            findIncomingType(input, rowState, env, inferredNodeOutputs, closedInputType);
        incomingTypes.push(incomingType);
        objPushConditional(rowProblemsMap, input.id, ...incomingProblems);

        if (templatedAccumulatedType.generics.length) {
            const freeGenerics = templatedAccumulatedType.generics.reduce(
                (acc, next) => ({ ...acc, [next.id]: next.constraint }),
                {} as Obj<TypeSpecifier | null>,
            );
            
            const templatedInputType = getFunctionParamType(templatedAccumulatedType.specifier, inputIndex);
            const inputsConstrains = mapTypeInference(new TypeTreePath(), 
                templatedInputType, incomingType, freeGenerics, env);
    
            templatedAccumulatedType = instantiateTemplatedType(new TypeTreePath(),
                templatedAccumulatedType, inputsConstrains, env);
            closedAccumulatedType = closeTemplatedSpecifier(templatedAccumulatedType);
        }
    }

    const finalInferredType = memoizeTypeStructure(closedAccumulatedType);
    const incomingTuple = createTupleType(...incomingTypes);

    // check for type errors
    try {
        assertSubsetType(incomingTuple, finalInferredType.parameter, env);
    } catch (e) {
        if (e instanceof TypeSystemException) {
            for (let i = 0; i < signature.inputs.length; i++) {
                const input = signature.inputs[i];
                const rowTypeProblem = getRowsTypeProblem(e.data, i.toString());
                objPushConditional(rowProblemsMap, input.id, rowTypeProblem);
            }
        } else {
            throw e;
        }
    }

    // generate display for rows and pack with problems
    const rowContexts: Record<string, RowContext> = {};
    const instantiatedParamTypes = (finalInferredType.parameter as TupleTypeSpecifier).elements;
    for (let i = 0; i < signature.inputs.length; i++) {
        const input = signature.inputs[i];
        rowContexts[input.id] = bundleRowContext(
            input,
            instantiatedParamTypes[i],
            env,
            rowStates[input.id],
            assertDef(rowProblemsMap[input.id]),
        );
    }
    return { inferredType: finalInferredType, rowContexts };
});

function resolveRowConnection(
    connection: FlowConnection,
    previousOutputTypes: Obj<TypeSpecifier>,
    env: FlowEnvironment,
): { connectedType?: TypeSpecifier, accessorProblem?: RowProblem } {
    const outputType = previousOutputTypes[connection.nodeId];
    if (!outputType) {
        return {
            accessorProblem: {
                type: 'invalid-connection',
                message: `Cannot find node with id '${connection.nodeId}' which should be connected to this row.`,
            },
        };
    }

    const resolvedType = tryResolveTypeAlias(outputType, env);
    if (connection.accessor == null || resolvedType == null) {
        return { connectedType: outputType };
    }

    if (resolvedType.type === 'tuple') {
        const accessorIndex = parseInt(connection.accessor);
        if (isNaN(accessorIndex)) {
            return {
                accessorProblem: {
                    type: 'invalid-connection',
                    message: `Cannot access tuple type with accessor '${connection.accessor}'.`,
                },
            };
        }
        const tupleLength = resolvedType.elements.length;
        if (accessorIndex < 0 || accessorIndex >= tupleLength) {
            return {
                accessorProblem: {
                    type: 'invalid-connection',
                    message: `Accessor with index ${accessorIndex} out of range for tuple with length ${tupleLength}.`,
                },
            };
        }
        return { connectedType: resolvedType.elements[accessorIndex] };
    }
    if (resolvedType.type === 'map') {
        const hasKey = resolvedType.elements.hasOwnProperty(connection.accessor);
        if (!hasKey) {
            return {
                accessorProblem: {
                    type: 'invalid-connection',
                    message: `Object type does not contain key '${connection.accessor}'.`,
                },
            };
        }
        return { connectedType: resolvedType.elements[connection.accessor] };
    }

    return {
        accessorProblem: {
            type: 'invalid-connection',
            message: `Type of category '${resolvedType.type}' cannot be accessed.`,
        },
    };
}

function findIncomingType(
    input: InputRowSignature,
    rowState: RowState | undefined,
    env: FlowEnvironment,
    previousOutputTypes: Obj<TypeSpecifier>,
    resolvedInputType: TypeSpecifier,
): { incomingType: TypeSpecifier, rowProblems: RowProblem[] } {
    const rowProblems: RowProblem[] = [];

    const incomingTypeMap = mapObj(rowState?.connections || {}, connection => {
        const { connectedType, accessorProblem } = resolveRowConnection(connection, previousOutputTypes, env);
        accessorProblem && rowProblems.push(accessorProblem);
        return connectedType || createAnyType();
    });
    const firstConnectedType = incomingTypeMap[0];

    resolvedInputType = resolveTypeAlias(new TypeTreePath(), resolvedInputType, env);

    if (input.rowType === 'input-variable' &&
        (resolvedInputType.type === 'list' || resolvedInputType.type === 'tuple')) {
        // treat inputs as list
        const incomingList = objToArr(incomingTypeMap);
        // remove holes
        for (let i = 0; i < incomingList.length; i++) {
            if (typeof incomingList[i] == 'undefined') {
                incomingList[i] = createAnyType();
                rowProblems.push({
                    type: 'required-parameter',
                    message: `Input element at index ${i} is required.`,
                });
            }
        }
        // creating tuple type: we must check if all elements in list
        // can pass as expected type without removing information
        const incomingType = createTupleType(...incomingList as TypeSpecifier[]);
        return { incomingType, rowProblems };
    }
    if (input.rowType === 'input-variable' &&
        resolvedInputType.type === 'function') {
        if (firstConnectedType != null) {
            return {
                incomingType: firstConnectedType,
                rowProblems
            };
        }

        if (typeof rowState?.value !== 'string' || !rowState?.value.length) {
            rowProblems.push({
                type: 'invalid-value',
                message: `A function is required.`,
            });
            return { incomingType: createAnyType(), rowProblems };
        }
        const nameValue = rowState!.value;
        const funcSignature = findEnvironmentSignature(env, nameValue);
        const templatedFunctionSpec = funcSignature && getTemplatedSignatureType(funcSignature);
        const closedFuncSpec = templatedFunctionSpec && closeTemplatedSpecifier(templatedFunctionSpec);
        if (closedFuncSpec == null) {
            rowProblems.push({
                type: 'invalid-value',
                message: `Could not find function named '${nameValue}'.`,
            });
            return { incomingType: createAnyType(), rowProblems };
        }
        return { incomingType: closedFuncSpec, rowProblems };
    }
    if (input.rowType === 'input-variable' &&
        resolvedInputType.type === 'map') {
        return {
            incomingType: createMapType(incomingTypeMap),
            rowProblems,
        };
    }
    if (input.rowType === 'input-variable') {
        return {
            incomingType: firstConnectedType || input.specifier,
            rowProblems,
        };
    }
    if (input.rowType === 'input-simple') {
        if (firstConnectedType == null) {
            rowProblems.push({
                type: 'required-parameter',
                message: `This parameter is required and must be connected.`,
            });
        }
        return {
            incomingType: firstConnectedType || createAnyType(),
            rowProblems,
        };
    }
    throw new Error(`Unknown input type ${(input as any).rowType}`);
}

function bundleRowContext(
    input: InputRowSignature,
    specifier: TypeSpecifier,
    env: FlowEnvironment,
    rowState: RowState | undefined,
    problems: RowProblem[],
): RowContext {
    const resolvedSpec = tryResolveTypeAlias(specifier, env);
    const isUnconnected = rowState?.connections[0] == null;

    if (input.rowType === 'input-variable' && isUnconnected) {
        if (resolvedSpec?.type === 'function') {
            return { ref: rowState, problems, display: 'initializer', value: rowState?.value || '' };
        }
        if (resolvedSpec?.type === 'primitive') {
            if (input.defaultValue != null) {
                const typeProblem = checkElementOfType(input.specifier, input.defaultValue, env);
                if (typeProblem) {
                    problems.push({
                        type: 'invalid-value',
                        typeProblem,
                        message: 'Inputs default value is not compatible with inputs type.'
                    });
                }
            }
            if (rowState?.value != null) {
                const typeProblem = checkElementOfType(input.specifier, rowState.value, env);
                if (typeProblem) {
                    problems.push({
                        type: 'invalid-value',
                        typeProblem,
                        message: 'Inputs stored value is not compatible with inputs type.',
                    });
                }
            }
            return {
                ref: rowState,
                problems,
                display: 'initializer',
                value: rowState?.value ?? input.defaultValue ?? generateDefaultValue(resolvedSpec, env),
            };
        }
    }

    if (input.rowType === 'input-variable' &&
        ['list', 'tuple', 'map'].includes(resolvedSpec?.type!)) {
        return {
            ref: rowState,
            problems,
            display: 'destructured',
        };
    }

    return { ref: rowState, problems, display: 'simple' };
}

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

    return {
        type: 'incompatible-argument-type',
        message: 'Incoming value is not compatible with rows type.',
        typeProblem: reducedData,
        connectionIndex,
    };
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

function getFunctionParamType(F: FunctionTypeSpecifier, index: number) {
    const paramTuple = F.parameter as TupleTypeSpecifier;
    assertTruthy(typeof paramTuple !== 'string' && paramTuple.type === 'tuple');
    return paramTuple.elements[index];
}