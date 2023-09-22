import { getScopePath } from "../core/environment";
import { FlowDocumentContext, FlowNodeContext, MAIN_FLOW_ID, TupleTypeSpecifier } from "../types";
import { ByteCompilerConfig, ByteInstruction, ByteOperation, ByteProgram, CallableChunk, StackValue } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";
import { byteProgramToString } from "./byteCodeUtils";

const op = (operation: ByteOperation): ByteInstruction => ({ type: 'operation', operation });
const data = (data: StackValue): ByteInstruction => ({ type: 'data', data });

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

    private addChunk(label: string, chunk: CallableChunk) {
        if (this.program.chunks.has(label)) {
            throw new Error(`Chunk already in program '${label}'.`);
        }
        this.program.chunks.set(label, chunk);
    }

    compileFlowChunk(flowId: string) {
        const flow = assertDef(this.doc.flowContexts[flowId], `A definition for flow '${flowId}' could not be found.`);
        const flowLabel = getScopePath(flow.flowEnvironment);
        if (this.program.chunks.has(flowLabel)) {
            return;
        }

        const pushChunk = (label: string, arity: number, instructions: ByteInstruction[]): ByteInstruction[] => {
            this.addChunk(label, { arity, instructions });
            return [];
        }

        const makeConstant = (value: any, nodeId: string, rowId: string) => {
            const constantLabel = `${flowLabel}.${nodeId}.${rowId}.constant`;
            pushChunk(constantLabel, 0, [
                data(value),
                op(ByteOperation.return),
            ]);
            return constantLabel;
        }

        let instructions: ByteInstruction[] = [];

        const makeNode = (nodeId: string): string => {
            const node = assertDef(flow.nodeContexts[nodeId]);
            const inputRows = node.templateSignature!.inputs;

            // const chunk: CallableChunk = {
            //     arity: inputRows.length,
            //     instructions: [],
            // }

            for (let i = inputRows.length - 1; i >= 0; i--) {
                const inputRowSignature = inputRows[i];
                const rowContext = node.inputRows[inputRowSignature.id];

                const connections = rowContext.ref?.connections || [];
                for (let j = connections.length - 1; j >= 0; j--) {
                    const conn = connections[j];
                    const nodeLabel = makeNode(conn.nodeId);
                    instructions.push(
                        data(nodeLabel),
                        op(ByteOperation.thunk),
                    );
                    if (conn.accessor != null) {
                        instructions.push(
                            data(conn.accessor),
                            op(ByteOperation.oget),
                        );
                    }
                }

                if (inputRowSignature.rowType === 'input-list') {
                    chunk.instructions.push(
                        data(connections.length),
                        op(ByteOperation.apack),
                    );
                }
                if (inputRowSignature.rowType === 'input-tuple') {
                    const tupleSpec = inputRowSignature.specifier as TupleTypeSpecifier; 
                    assertTruthy(connections.length === tupleSpec.elements.length);
                    chunk.instructions.push(
                        data(connections.length),
                        op(ByteOperation.apack),
                    );
                }
                if (inputRowSignature.rowType === 'input-simple') {
                    assertTruthy(connections.length === 1);
                }
                if (inputRowSignature.rowType === 'input-variable') {
                    if (connections.length == 0) {
                        const constantRoutine = makeConstant(rowContext.displayValue, nodeId, inputRowSignature.id);
                        chunk.instructions.push()
                        // chunk.instructions.push(byteDataValue);
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
        makeNode(lastNode);

        chunk.instructions.push(op(ByteOperation.return));

        this.program.chunks.set(flowLabel, chunk);
    }

    // makeDataInstruction(input: any): ByteInstruction {
    //     switch (typeof input) {
    //         case 'number':
    //             return data(input, 'number');
    //         case 'boolean':
    //             return data(input, 'boolean');
    //         case 'string':
    //             return data(input, 'string');
    //         case 'object':
    //             if (Array.isArray(input))   return data(input, 'array'); 
    //             else                        return data(input, 'object');
    //     }
    //     assertNever(`Invalid type of input '${typeof input}'.`);
    // }

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
            data(node.scopedLabel, 'string'),
            op(ByteOperation.call),
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
