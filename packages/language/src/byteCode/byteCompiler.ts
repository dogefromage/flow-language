import { helperChunks } from "../content/signatures";
import { getScopePath } from "../core/environment";
import { FlowDocumentContext, FlowNodeContext, MAIN_FLOW_ID, TupleTypeSpecifier } from "../types";
import { ByteCompilerConfig, ByteInstruction, ByteOperation, ByteProgram, CallableChunk, byteCodeConstructors } from "../types/byteCode";
import { assertDef, assertTruthy } from "../utils";
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

    private getNodeBodyInstructions(node: FlowNodeContext): ByteInstruction[] {
        const signature = assertDef(node.templateSignature);
        const nodeRoutine = signature.byteCode;
        if (nodeRoutine != null && nodeRoutine.type === 'inline') {
            return nodeRoutine.instructions;
        }

        if (nodeRoutine != null) {
            this.program.chunks.set(node.scopedLabel, nodeRoutine.chunk);
        }
        else {
            this.compileFlowChunk(node.templateSignature!.id);
        }

        return [
            data(node.scopedLabel),
            op(ByteOperation.thunk),
        ];
    }

    private compileFlowChunk(flowId: string) {
        const flow = assertDef(this.doc.flowContexts[flowId],
            `A definition for flow '${flowId}' could not be found.`);
        const flowLabel = getScopePath(flow.flowEnvironment);

        if (this.program.chunks.has(flowLabel)) {
            return; // visited
        }

        const flowInputs = flow.flowSignature.inputs;
        const flowChunk: CallableChunk = {
            arity: flowInputs.length,
            instructions: [],
        }
        this.addChunk(flowLabel, flowChunk);

        // get args and put into local object
        for (let i = 0; i < flowInputs.length; i++) {
            flowChunk.instructions.push(
                op(ByteOperation.moveaside),
            );
        }
        for (let i = flowInputs.length - 1; i >= 0; i--) {
            flowChunk.instructions.push(
                op(ByteOperation.moveback),
                data(flowInputs[i].id),
            );
        }
        flowChunk.instructions.push(
            data(flowInputs.length),
            op(ByteOperation.opack),
            // we now have plain object containing thunked items
            // wrap into thunk before storing
            data(this.useHelper('wrap_value')),
            op(ByteOperation.thunk),
            // store packed args in first local
            data(0),
            op(ByteOperation.setlocal),
        );

        const locals = new Map<string, number>();
        let localsCounter = 1; // leave 0 for inputs

        for (const nodeId of flow.sortedUsedNodes) {
            const node = assertDef(flow.nodeContexts[nodeId]);
            const inputRows = node.templateSignature!.inputs;

            for (let rowIndex = inputRows.length - 1; rowIndex >= 0; rowIndex--) {
                const inputRowSignature = inputRows[rowIndex];
                const rowContext = node.inputRows[inputRowSignature.id];
                const connections = rowContext.ref?.connections || [];
                for (let j = connections.length - 1; j >= 0; j--) {
                    const conn = connections[j];
                    const neededLocalIndex = assertDef(locals.get(conn.nodeId));
                    flowChunk.instructions.push(
                        data(neededLocalIndex),
                        op(ByteOperation.getlocal),
                    );
                    if (conn.accessor != null) {
                        flowChunk.instructions.push(
                            data(conn.accessor),
                            data(this.useHelper('obj_get')),
                            op(ByteOperation.thunk),
                        );
                    }
                }

                if (inputRowSignature.rowType === 'input-list') {
                    flowChunk.instructions.push(
                        data(connections.length),
                        op(ByteOperation.apack),
                        data(this.useHelper('wrap_value')),
                        op(ByteOperation.thunk),
                    );
                }
                if (inputRowSignature.rowType === 'input-tuple') {
                    // verify number args
                    const nodeParamTuple = node.specifier!.parameter! as TupleTypeSpecifier;
                    const argTupleSpec = nodeParamTuple.elements[rowIndex] as TupleTypeSpecifier;
                    assertTruthy(connections.length === argTupleSpec.elements.length);
                    flowChunk.instructions.push(
                        data(connections.length),
                        op(ByteOperation.apack),
                        data(this.useHelper('wrap_value')),
                        op(ByteOperation.thunk),
                    );
                }
                if (inputRowSignature.rowType === 'input-simple') {
                    assertTruthy(connections.length === 1);
                }
                if (inputRowSignature.rowType === 'input-variable') {
                    if (connections.length == 0) {
                        flowChunk.instructions.push(
                            data(this.useConstant(rowContext.displayValue)),
                            op(ByteOperation.thunk),
                        );
                    } else {
                        assertTruthy(connections.length === 1);
                    }
                }
                if (inputRowSignature.rowType === 'input-function') {
                    if (connections.length == 0) {
                        const referencedFlowId = rowContext.ref?.value;
                        const hackedLabel = `global:${referencedFlowId}`;

                        // const test = findEnvironmentSignature(flow.flowEnvironment, referencedFlowId)?.byteCode as any;
                        // this.addChunk(hackedLabel, test.chunk);
                        
                        flowChunk.instructions.push(
                            data(this.useConstant(hackedLabel)),
                            op(ByteOperation.thunk),
                        );
                    } else {
                        assertTruthy(connections.length === 1);
                    }
                }
            }

            const nextLocalIndex = localsCounter++;
            locals.set(node.ref.id, nextLocalIndex);
            // compute node
            flowChunk.instructions.push(
                ...this.getNodeBodyInstructions(node),
                data(nextLocalIndex),
                op(ByteOperation.setlocal),
            );
        }

        const lastNodeId = flow.sortedUsedNodes.at(-1)!;
        const lastNodeLocal = assertDef(locals.get(lastNodeId));

        flowChunk.instructions.push(
            data(lastNodeLocal),
            op(ByteOperation.getlocal),
            op(ByteOperation.evaluate),
            op(ByteOperation.return),
        );
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