import { TypeSystemException } from "../typeSystem/exceptionHandling";
import { generateDefaultValue } from "../typeSystem/generateDefaultValue";
import { assertElementOfType } from "../typeSystem/validateElement";
import { InputRowSignature, RowState, TypeSpecifier, FlowEnvironment, RowProblem, RowContext, InitializerValue } from "../types";
import { mem } from "../utils/functional";

export const validateRows = mem((
    input: InputRowSignature,
    rowState: RowState | undefined,
    specifier: TypeSpecifier,
    env: FlowEnvironment,
    rowProblems: RowProblem[] | null,
): RowContext => {

    const result: RowContext = {
        ref: rowState,
        problems: rowProblems || [],
    };

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
