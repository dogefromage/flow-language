import { baseInterpretations, localDefinitions } from "../content/signatures";
import { DocumentContext, FlowSignature, InitializerValue } from "../types";
import { NodeValueMap } from "../types/local";
import { assertDef } from "../utils";
import { assertElementOfType } from "../typeSystem/validateElement";

interface InterpreterConfig {
    args: NodeValueMap;
}


export function interpretDocument(doc: DocumentContext, config: InterpreterConfig) {
    
    const totalProblemCount = doc.problems.length + doc.childProblemCount;
    if (totalProblemCount > 0) {
        throw new Error(`Document contains ${totalProblemCount} problem(s)`);
    }
    const flow = doc.flowContexts['curve'];
    const flowArgs = config.args;

    for (const input of flow.ref.inputs) {
        const arg = flowArgs[input.id];
        try {
            assertElementOfType(input.dataType, arg, flow.flowEnvironment);
        } catch (e) {
            throw new Error(`Invalid argument (${arg}) found for input ${input.id} in flow ${flow.ref.id}`);
        }
    }
    
    const outputValueMap = new Map<string, Record<string, InitializerValue>>();

    for (const nodeId of flow.sortedUsedNodes) {
        const node = flow.nodeContexts[nodeId];
        const signature = node.templateSignature!;

        // collect inputs
        const inputArgs: Record<string, InitializerValue> = {};

        for (const input of signature.inputs) {
            const rowContext = node.rowContexts[input.id];
            if (rowContext.ref?.connections.length) {
                // add support for multiple connections
                const firstConnection = rowContext.ref.connections[0];
                const transportedValue = outputValueMap.get(firstConnection.nodeId)?.[firstConnection.outputId];
                inputArgs[input.id] = assertDef(transportedValue, 'Value missing or misplaced.');
            } else {
                inputArgs[input.id] = assertDef(rowContext.displayValue);
            }
        }

        // process node
        const returnVal = interpretSignature(signature, inputArgs, flowArgs);
        outputValueMap.set(node.ref.id, returnVal);
    }

    const outputValue = outputValueMap.get(flow.sortedUsedNodes.at(-1)!);

    return {
        returnValue: outputValue,
    }
}

function interpretSignature(
    signature: FlowSignature, 
    nodeArgs: NodeValueMap, 
    flowArgs: NodeValueMap,
): NodeValueMap {

    if (signature.id === '@@input') {
        return flowArgs;
    }
    if (signature.id === '@@output') {
        return nodeArgs;
    }

    const localInterpretation = baseInterpretations[signature.id];
    if (!localInterpretation) {
        throw new Error(`Could not find an interpretation for signature ${signature.id}`);
    }
    return localInterpretation(nodeArgs, flowArgs);
}