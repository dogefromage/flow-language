import { getScopePath } from "../core/environment";
import { FlowDocumentContext, FlowNodeContext, MAIN_FLOW_ID, TupleTypeSpecifier } from "../types";
import { ByteCompilerConfig, ByteInstruction, ByteOperation, ByteProgram, CallableChunk, ConcreteValue, operationNameTags } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";

const byteOp = (i: ByteOperation): ByteInstruction => ({ type: 'operation', operation: i });
const byteData = (d: ConcreteValue): ByteInstruction => ({ type: 'data', data: d });

class Compiler {
    private flowQueue: string[] = [];
    private program!: ByteProgram;

    constructor(
        private doc: FlowDocumentContext,
    ) {}

    compile(entryFlowId: string) {
        this.program = {
            chunks: new Map(),
        };
        this.flowQueue.push(entryFlowId);

        while (this.flowQueue.length) {
            const nextFlowId = this.flowQueue.shift()!;
            this.compileFlowChunk(nextFlowId);
        }

        console.log(byteProgramToString(this.program));

        return this.program;
    }

    compileFlowChunk(flowId: string) {
        const flow = assertDef(this.doc.flowContexts[flowId], `A definition for flow '${flowId}' could not be found.`);
        const flowLabel = getScopePath(flow.flowEnvironment);
        if (this.program.chunks.has(flowLabel)) {
            return;
        }

        const chunk: CallableChunk = {
            instructions: [],
            arity: flow.flowSignature.inputs.length,
            locals: 0,
        }

        const pushNode = (nodeId: string) => {
            const node = assertDef(flow.nodeContexts[nodeId]);
            // calculate deps
            const inputRows = node.templateSignature!.inputs;
            for (let i = inputRows.length - 1; i >= 0; i--) {
                const inputRowSignature = inputRows[i];
                const rowContext = node.inputRows[inputRowSignature.id];

                const connections = rowContext.ref?.connections || [];
                for (let j = connections.length - 1; j >= 0; j--) {
                    const conn = connections[j];
                    pushNode(conn.nodeId);
                    if (conn.accessor != null) {
                        chunk.instructions.push(
                            byteData(conn.accessor),
                            byteOp(ByteOperation.oget),
                        );
                    }
                }

                if (inputRowSignature.rowType === 'input-list') {
                    chunk.instructions.push(
                        byteData(connections.length),
                        byteOp(ByteOperation.apack),
                    );
                }
                if (inputRowSignature.rowType === 'input-tuple') {
                    const tupleSpec = inputRowSignature.specifier as TupleTypeSpecifier; 
                    assertTruthy(connections.length === tupleSpec.elements.length);
                    chunk.instructions.push(
                        byteData(connections.length),
                        byteOp(ByteOperation.apack),
                    );
                }
                if (inputRowSignature.rowType === 'input-simple') {
                    assertTruthy(connections.length === 1);
                }
                if (inputRowSignature.rowType === 'input-variable') {
                    if (connections.length == 0) {
                        const byteDataValue = this.validateByteData(rowContext.displayValue);
                        chunk.instructions.push(byteData(byteDataValue));
                    } else {
                        assertTruthy(connections.length === 1);
                    }
                }
                if (inputRowSignature.rowType === 'input-function') {
                    if (connections.length == 0) {
                        assertNever('implement');
                        // const cb: FlowInterpretation = (nodeArgs) => {
                        //     const signatureId = rowContext.ref?.value || '';
                        //     return this.interpretSignature(signatureId, nodeArgs);
                        // }
                        // return cb;
                    } else {
                        assertTruthy(connections.length === 1);
                    }
                }
            }

            // get node code
            const callOrInlineInstrs = this.generateNodeInstructions(node);
            chunk.instructions.push(...callOrInlineInstrs);
        }

        const lastNode = flow.sortedUsedNodes.at(-1)!;
        pushNode(lastNode);

        chunk.instructions.push(byteOp(ByteOperation.return));

        this.program.chunks.set(flowLabel, chunk);
    }

    validateByteData(input: any): ConcreteValue {
        switch (typeof input) {
            case 'number':
            case 'boolean':
            case 'string':
            case 'object':
                return input;
        }
        assertNever(`Invalid type of input '${typeof input}'.`);
    }

    generateNodeInstructions(node: FlowNodeContext): ByteInstruction[] {
        const nodeRoutine = node.templateSignature!.byteCode;
        // inline
        if (nodeRoutine != null && nodeRoutine.type === 'inline') {
            return nodeRoutine.instructions;
        }
        // unknown chunk, add to queue
        if (nodeRoutine == null) {
            this.flowQueue.push(node.templateSignature!.id);
        }
        // chunk known but not added
        else if (!this.program.chunks.has(node.scopedLabel)) {
            this.program.chunks.set(node.scopedLabel, nodeRoutine.chunk);
        }
        // execute call
        return [
            byteData(node.scopedLabel),
            byteOp(ByteOperation.call),
        ];
    }
}

export function compileDocument(doc: FlowDocumentContext, config: ByteCompilerConfig) {
    if (!config.skipValidation) {
        assertValidDocument(doc);
    }
    const compiler = new Compiler(doc);
    return compiler.compile(MAIN_FLOW_ID);
}

function assertValidDocument(doc: FlowDocumentContext) {
    const totalProblemCount = doc.problems.length + doc.criticalSubProblems;
    if (totalProblemCount > 0) {
        throw new Error(`Document contains ${totalProblemCount} problem(s).`);
    }
    const flow = doc.flowContexts[MAIN_FLOW_ID];
    if (flow == null) {
        throw new Error(`Document is missing a valid 'main' flow.`);
    }
}

export function byteProgramToString(program: ByteProgram) {
    const lines: string[] = [];
    for (const [label, chunk] of program.chunks) {
        lines.push(`.${label}`);
        for (let i = 0; i < chunk.instructions.length; i++) {
            const instr = chunk.instructions[i];
            let line = '?';
            switch (instr.type) {
                case 'data':
                    line = instr.data.toString();
                    break;
                case 'operation':
                    line = assertDef(operationNameTags[instr.operation]);
                    break;
            }
            lines.push(`${i.toString().padStart(6)} ${line}`);
        }
        lines.push('\n');
    }
    return lines.join('\n');
}