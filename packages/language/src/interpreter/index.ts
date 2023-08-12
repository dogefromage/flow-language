import { baseInterpretations } from "../content/signatures";
import { DocumentContext, FlowGraphContext, FlowSignature, InitializerValue, MAIN_FLOW_ID } from "../types";
import { ValueMap } from "../types/local";
import { assertDef, assertTruthy } from "../utils";

export interface InterpreterConfig {
    args: ValueMap;
    skipValidation?: boolean;
}

export function interpretDocument(doc: DocumentContext, config: InterpreterConfig) {
    if (!config.skipValidation) {
        assertValidDocument(doc, config);
    }
    const mainFlow = doc.flowContexts[MAIN_FLOW_ID];
    const mainArgs: ValueMap = {};

    const outputMap = interpretFlow(doc, mainFlow, mainArgs);

    return {
        returnValue: outputMap!.value,
    };
}

function interpretFlow(doc: DocumentContext, flow: FlowGraphContext, flowArgs: ValueMap) {
    const memoizedOutputs = new Map<string, Record<string, InitializerValue>>();

    function interpretNode(nodeId: string): ValueMap {
        const node = flow.nodeContexts[nodeId];
        const signature = node.templateSignature!;

        const memoed = memoizedOutputs.get(nodeId);
        if (memoed != null) {
            return memoed;
        }

        const inputProxy = new Proxy({} as ValueMap, {
            get(_, inputId: string) {
                const rowContext = node.rowContexts[inputId];
                const connections = rowContext.ref?.connections || [];
                if (connections.length > 0) {
                    assertTruthy(connections.length < 2, "Multiple connections not implemented.");
                    const firstConnection = connections[0];
                    const prevNodeOutput = interpretNode(firstConnection.nodeId);
                    const transportedValue = prevNodeOutput[firstConnection.outputId];
                    return assertDef(transportedValue, 'Value missing or misplaced.');
                } else {
                    return assertDef(rowContext.displayValue, 'No input connected but not display value found.');
                }
            }
        });
        
        const returnVal = interpretSignature(doc, signature, inputProxy, flowArgs);
        memoizedOutputs.set(node.ref.id, returnVal);
        return returnVal;
    }

    const lastNodeId = flow.sortedUsedNodes.at(-1)!;
    return interpretNode(lastNodeId);
}

function interpretSignature(
    doc: DocumentContext,
    signature: FlowSignature,
    nodeArgs: ValueMap,
    flowArgs: ValueMap,
): ValueMap {

    if (signature.id === '@@input') {
        const vals: ValueMap = {};
        for (const output of signature.outputs) {
            vals[output.id] = flowArgs[output.id];
        }
        return vals;
    }
    if (signature.id === '@@output') {
        const vals: ValueMap = {};
        for (const input of signature.inputs) {
            vals[input.id] = nodeArgs[input.id];
        }
        return vals;
    }

    const signatureFlow = doc.flowContexts[signature.id];
    if (signatureFlow != null) {
        return interpretFlow(doc, signatureFlow, nodeArgs);
    }

    const localInterpretation = baseInterpretations[signature.id];
    if (localInterpretation != null) {
        return localInterpretation(nodeArgs, flowArgs);
    }

    throw new InterpretationException(`Could not find an interpretation for signature ${signature.id}.`);
}

export class InterpretationException extends Error {}

function assertValidDocument(doc: DocumentContext, config: InterpreterConfig) {
    const totalProblemCount = doc.problems.length + doc.criticalSubProblems;
    if (totalProblemCount > 0) {
        throw new InterpretationException(`Document contains ${totalProblemCount} problem(s).`);
    }

    const flow = doc.flowContexts[MAIN_FLOW_ID];
    if (flow == null || flow.ref.outputs[0].id !== 'value') {
        throw new InterpretationException(`Document is missing a valid 'main' flow with an output named 'value'.`);
    }

    // for (const input of flow.ref.inputs) {
    //     const arg = flowArgs[input.id];
    //     try {
    //         assertElementOfType(input.dataType, arg, flow.flowEnvironment);
    //     } catch (e) {
    //         throw new InterpretationException(`Invalid argument (${arg}) found for input ${input.id} in flow ${flow.ref.id}.`);
    //     }
}
