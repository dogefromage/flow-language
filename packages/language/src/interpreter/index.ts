import { baseInterpretations } from "../content/signatures";
import { findEnvironmentSignature } from "../core/environment";
import { FlowDocumentContext, FlowGraphContext, FlowNodeContext, MAIN_FLOW_ID, MapTypeSpecifier } from "../types";
import { FlowInterpretation, InterpreterValue } from "../types/local";

export interface InterpreterConfig {
    args: InterpreterValue[];
    skipValidation?: boolean;
}

export function interpretDocument(doc: FlowDocumentContext, config: InterpreterConfig) {
    if (!config.skipValidation) {
        assertValidDocument(doc, config);
    }
    const mainFlow = doc.flowContexts[MAIN_FLOW_ID];
    const mainArgs: InterpreterValue[] = [];
    const returnValue = new FlowInterpreter(doc, mainFlow, mainArgs).interpret();
    return { returnValue };
}

class FlowInterpreter {
    private memoizedOutputs = new Map<string, InterpreterValue>();

    constructor(
        private doc: FlowDocumentContext,
        private flow: FlowGraphContext,
        private args: InterpreterValue[],
    ) {}

    interpret() {
        const lastNodeId = this.flow.sortedUsedNodes.at(-1)!;
        return this.interpretNode(lastNodeId);
    }

    private interpretNode(nodeId: string) {
        const memoed = this.memoizedOutputs.get(nodeId);
        if (memoed != null) {
            return memoed;
        }

        const node = this.flow.nodeContexts[nodeId];
        const signature = node.templateSignature!;

        const argumentProxy = new Proxy([] as InterpreterValue[], {
            get: (_, property: string) => {
                const inputIndex = parseInt(property);
                if (isNaN(inputIndex)) {
                    throw new InterpretationException(`Interpretation argument property must be a number (property='${property}').`);
                }
                this.getInputValue(node, inputIndex);
            }
        });

        const returnVal = this.interpretSignature(signature.id, argumentProxy);
        this.memoizedOutputs.set(node.ref.id, returnVal);
        return returnVal;
    }

    private getInputValue(node: FlowNodeContext, inputIndex: number) {
        const inputRowSignature = node.templateSignature!.inputs[inputIndex];
        const rowContext = node.inputRows[inputRowSignature.id];
        const connections = rowContext.ref?.connections || [];

        const connectedValues = connections.map(conn => {
            const prev = this.interpretNode(conn.nodeId);
            if (conn.accessor != null) {
                if (typeof prev !== 'object') {
                    throw new InterpretationException(`Cannot destructure value '${prev}'.`);
                }
                return prev[conn.accessor];
            }
            return prev;
        });

        if (inputRowSignature.rowType === 'input-list' ||
            inputRowSignature.rowType === 'input-tuple') {
            return connectedValues;
        }
        if (inputRowSignature.rowType === 'input-variable') {
            if (connections.length > 0) {
                return connectedValues[0];
            }
            return rowContext.displayValue;
        }
        if (inputRowSignature.rowType === 'input-simple') {
            if (connectedValues.length == 0) {
                throw new InterpretationException(`No connection present on node.`);
            }
            return connectedValues[0];
        }
        if (inputRowSignature.rowType === 'input-function') {
            if (connections.length > 0) {
                return connectedValues[0];
            }
            const cb: FlowInterpretation = (nodeArgs) => {
                const signatureId = rowContext.ref?.value || '';
                return this.interpretSignature(signatureId, nodeArgs);
            }
            return cb;
        }

        throw new InterpretationException(`Unknown input row type '${(inputRowSignature as any).rowType}'.`);
    }

    private interpretSignature(signatureId: string, nodeArgs: InterpreterValue[]): InterpreterValue {
        const signature = findEnvironmentSignature(this.flow.flowEnvironment, signatureId);
        if (!signature) {
            throw new InterpretationException(`Could not find signature '${signatureId}' in document.`);
        }

        if (signature.id === 'input') {
            return this.flow.flowSignature.inputs
                .map((_, index) => this.args[index]);
        }
        if (signature.id === 'output') {
            return nodeArgs[0];
        }

        const signatureFlow = this.doc.flowContexts[signature.id];
        if (signatureFlow != null) {
            return new FlowInterpreter(this.doc, signatureFlow, nodeArgs).interpret();
        }

        const localInterpretation = baseInterpretations[signature.id];
        if (localInterpretation != null) {
            return localInterpretation(nodeArgs, this.args);
        }

        throw new InterpretationException(`Could not find an interpretation for signature ${signature.id}.`);
    }
}

// function ainterpretFlow(doc: FlowDocumentContext, flow: FlowGraphContext, flowArgs: InterpreterValueMap) {
//     const memoizedOutputs = new Map<string, InterpreterValue>();

//     function interpretNode(nodeId: string): InterpreterValue {
//         const node = flow.nodeContexts[nodeId];
//         const signature = node.templateSignature!;

//         const memoed = memoizedOutputs.get(nodeId);
//         if (memoed != null) {
//             return memoed;
//         }

//         // function getInputValue(inputId: string) {
//         // }

//         const inputProxy = new Proxy({} as InterpreterValueMap, {
//             get(_, inputId: string) { return getInputValue(inputId); }
//         });

//         const returnVal = interpretSignature(doc, signature, inputProxy, flowArgs);
//         memoizedOutputs.set(node.ref.id, returnVal);
//         return returnVal;
//     }

//     const lastNodeId = flow.sortedUsedNodes.at(-1)!;
//     return interpretNode(lastNodeId);
// }

// // function interpretSignature(
// //     doc: FlowDocumentContext,
// //     signature: FlowSignature,
// //     nodeArgs: Record<string, InterpreterValue>,
// //     flowArgs: Record<string, InterpreterValue>,
// // ): InterpreterValue {
// // }

// function getInterpretation(
//     doc: FlowDocumentContext,
//     signature: FlowSignature,
// ) {

//     if (signature.id === 'input') {
//         const vals: InterpreterValueMap = {};
//         const mapOutput = signature.output.specifier as MapTypeSpecifier;
//         for (const outputId of Object.keys(mapOutput.elements)) {
//             vals[outputId] = flowArgs[outputId];
//         }
//         return vals;
//     }
//     if (signature.id === 'output') {
//         return nodeArgs[signature.inputs[0].id];
//     }

//     const signatureFlow = doc.flowContexts[signature.id];
//     if (signatureFlow != null) {
//         return interpretFlow(doc, signatureFlow, nodeArgs);
//     }
// }

export class InterpretationException extends Error {}

function assertValidDocument(doc: FlowDocumentContext, config: InterpreterConfig) {
    const totalProblemCount = doc.problems.length + doc.criticalSubProblems;
    if (totalProblemCount > 0) {
        throw new InterpretationException(`Document contains ${totalProblemCount} problem(s).`);
    }
    const flow = doc.flowContexts[MAIN_FLOW_ID];
    if (flow == null) {
        throw new InterpretationException(`Document is missing a valid 'main' flow.`);
    }
}
