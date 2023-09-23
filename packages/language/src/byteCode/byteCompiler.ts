import { helperChunks } from "../content/signatures";
import { getScopePath } from "../core/environment";
import { FlowDocumentContext, FlowGraphContext, FlowNodeContext, MAIN_FLOW_ID, TupleTypeSpecifier } from "../types";
import { ByteCompilerConfig, ByteInstruction, ByteOperation, ByteProgram, CallableChunk, StackValue, byteCodeConstructors } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";
import { byteProgramToString } from "./byteCodeUtils";

const { op, data } = byteCodeConstructors;

class Counter {
    private value = 0;
    next() {
        return this.value++;
    }
}

class Compiler {
    private flowQueue: string[] = [];
    private program!: ByteProgram;

    private constants = new Map<any, string>();
    private constantsCounter = new Counter;
    private helpers = new Set<string>();

    constructor(
        private doc: FlowDocumentContext,
    ) {}

    compile(entryFlowId: string) {
        assertTruthy(this.program == null, 'Compiler is single use.');
        const entryChunk = 'main';
        this.program = { 
            entryChunk,
            chunks: new Map(), 
        };
        this.program.chunks.set(entryChunk, {
            arity: 0,
            instructions: [
                data('global:document:main'),
                op(ByteOperation.call),
                op(ByteOperation.return),
            ]
        });

        this.compileFlowChunk(entryFlowId);

        console.log(byteProgramToString(this.program));
        return this.program;
    }

    private useConstant(value: any) {
        const memoized = this.constants.get(value);
        if (memoized != null) {
            return memoized;
        }
        const label = `const_${this.constantsCounter.next()}`;
        this.addChunk(label, {
            arity: 0,
            instructions: [
                data(value),
                op(ByteOperation.return),
            ],
        });
        this.constants.set(value, label);
        return label;
    }

    private useHelper(name: string) {
        const label = `helper.${name}`;
        if (!this.helpers.has(label)) {
            const helperChunk = assertDef(helperChunks[name], `Could not find helper chunk named '${name}'.`);
            this.addChunk(`helper.${name}`, helperChunk);
            this.helpers.add(label);
        }
        return label;
    }

    private addChunk(label: string, chunk: CallableChunk) {
        if (this.program.chunks.has(label)) {
            throw new Error(`Chunk already in program '${label}'.`);
        }
        this.program.chunks.set(label, chunk);
    }

    private useNode(flow: FlowGraphContext, nodeId: string) {
        const node = assertDef(flow.nodeContexts[nodeId]);
        const flowLabel = getScopePath(flow.flowEnvironment);

        let nodeLabel = `${flowLabel}.${node.ref.id}`;
        if (node.templateSignature?.id == 'output') {
            // special case, marks entry point
            nodeLabel = flowLabel; 
        }

        if (this.program.chunks.has(nodeLabel)) {
            return nodeLabel;
        }

        const inputRows = node.templateSignature!.inputs;
        const chunk: CallableChunk = {
            arity: 0 /* inputRows.length */,
            instructions: [],
        }

        this.addChunk(nodeLabel, chunk);

        for (let i = inputRows.length - 1; i >= 0; i--) {
            const inputRowSignature = inputRows[i];
            const rowContext = node.inputRows[inputRowSignature.id];

            const connections = rowContext.ref?.connections || [];
            for (let j = connections.length - 1; j >= 0; j--) {
                const conn = connections[j];
                chunk.instructions.push(
                    data(this.useNode(flow, conn.nodeId)),
                    op(ByteOperation.thunk),
                );
                if (conn.accessor != null) {
                    chunk.instructions.push(
                        data(conn.accessor),
                        data(this.useHelper('obj_get')),
                        op(ByteOperation.thunk),
                    );
                }
            }

            if (inputRowSignature.rowType === 'input-list') {
                assertNever('implement');
                chunk.instructions.push(
                    data(connections.length),
                    op(ByteOperation.apack),
                );
            }
            if (inputRowSignature.rowType === 'input-tuple') {
                assertNever('implement');
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
                    chunk.instructions.push(
                        data(this.useConstant(rowContext.displayValue)),
                        op(ByteOperation.thunk),
                    )
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

        // compute node
        chunk.instructions.push(
            ...this.getNodeBodyInstructions(node),
            op(ByteOperation.return),
        );

        return nodeLabel;
    }

    private getNodeBodyInstructions(node: FlowNodeContext): ByteInstruction[] {
        const signature = assertDef(node.templateSignature);
        const nodeRoutine = signature.byteCode;
        // if (nodeRoutine != null && nodeRoutine.type === 'inline') {
        //     assertNever('idk inline');
        //     // return nodeRoutine.instructions;
        // }

        if (signature.id === 'input') {
            assertNever('wtf');
            // // add arguments and keys back to back onto stack
            // // then specify prop count and pack them into an object
            // const instructions: ByteInstruction[] = [];
            // for (let i = 0; i < flowInputs.length; i++) {
            //     // args are stacked reverse
            //     const stackIndex = flowInputs.length - i - 1;
            //     instructions.push(
            //         data(stackIndex),
            //         op(ByteOperation.getarg),
            //         op(ByteOperation.evaluate),
            //         data(flowInputs[i].id),
            //     );
            // }
            // instructions.push(
            //     { type: 'data', data: { type: 'concrete', dataType: 'integer', value: flowInputs.length } },
            //     { type: 'operation', operation: ByteOperation.opack },
            // );
        }

        if (nodeRoutine != null) {
            this.program.chunks.set(node.scopedLabel, nodeRoutine.chunk);
        } 
        else {
            this.compileFlowChunk(node.templateSignature!.id);
        }

        return [
            data(node.scopedLabel),
            op(ByteOperation.call),
        ];
    }

    private compileFlowChunk(flowId: string) {
        const flow = assertDef(this.doc.flowContexts[flowId], 
            `A definition for flow '${flowId}' could not be found.`);

        const outputNodeId = flow.sortedUsedNodes.at(-1)!;
        this.useNode(flow, outputNodeId);
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