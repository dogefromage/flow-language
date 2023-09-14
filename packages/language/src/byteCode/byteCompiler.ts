import { getScopePath } from "../core/environment";
import { FlowDocumentContext, FlowNodeContext, MAIN_FLOW_ID } from "../types";
import { ByteInstruction, ByteToken, DataValue, UnlinkedToken } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";

const instr = (i: ByteInstruction): ByteToken => ({ type: 'instruction', instruction: i });
const data =  (d: DataValue): ByteToken => ({ type: 'data', data: d });
const label = (l: string, m: 'absolute' | 'offset'): UnlinkedToken => ({ type: 'label', label: l, method: m });

class Linker {
    private program: UnlinkedToken[] = [];
    private labels = new Map<string, number>();

    hasChunk(label: string) {
        return this.labels.has(label);
    }

    addChunk(label: string, chunk: UnlinkedToken[]) {
        if (this.labels.has(label)) {
            throw new Error(`Linker already contains chunk '${label}'`);
        }
        this.labels.set(label, this.program.length);
        this.program = this.program.concat(chunk);
    }

    link() {
        const linkedProg = this.program.slice();
        for (let i = 0; i < linkedProg.length; i++) {
            const instr = linkedProg[i];
            if (instr.type === 'label') {
                let labelPointer = this.labels.get(instr.label);
                if (labelPointer == null) {
                    throw new Error(`Unknown label found '${instr.label}'.`);
                }
                if (instr.method === 'offset') {
                    labelPointer -= i;
                }
                linkedProg[i] = data(labelPointer);
            }
        }
        return linkedProg as ByteToken[];
    }

    toString() {
        const progLines = this.program.map(token => {
            switch (token.type) {
                case 'data':
                    return token.data.toString();
                case 'instruction':
                    return token.instruction;
                case 'label':
                    if (token.method === 'absolute') {
                        return `=${token.label}`;
                    } else {
                        return `~${token.label}`;
                    }
            }
        });

        const labelLines = new Array<string | null>(progLines.length)
            .fill(null);
        for (const [ labelTag, lineNum ] of this.labels) {
            labelLines[lineNum] = `.${labelTag}`;
        }

        const numDigits = Math.floor(Math.log10(progLines.length) + 1);

        const zipped = [];
        // zip both arrs
        for (let i = 0; i < progLines.length; i++) {
            if (labelLines[i] != null) {
                zipped.push(labelLines[i]);
            }
            zipped.push(`${i.toString().padStart(numDigits)}: ${progLines[i]}`);
        }

        return zipped.join('\n');
    }
}

class Compiler {
    private linker = new Linker();
    private flowQueue: string[] = [];

    constructor(
        private doc: FlowDocumentContext,
    ) {}

    compile(entryFlowId: string) {
        this.flowQueue.push(entryFlowId);

        while (this.flowQueue.length) {
            const nextFlowId = this.flowQueue.shift()!;
            this.compileFlowChunk(nextFlowId);
        }

        console.log(this.linker.toString());

        const program = this.linker.link();
        return program;
    }

    compileFlowChunk(flowId: string) {
        const flow = assertDef(this.doc.flowContexts[flowId], `A definition for flow '${flowId}' could not be found.`);
        const flowLabel = getScopePath(flow.flowEnvironment);
        if (this.linker.hasChunk(flowLabel)) {
            return;
        }

        const flowChunk: UnlinkedToken[] = [];
        
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
                    if (conn.accessor) {
                        assertNever('implement');
                    }
                }
    
                if (inputRowSignature.rowType === 'input-list' ||
                    inputRowSignature.rowType === 'input-tuple') {
                    assertNever('implement');
                }
                if (inputRowSignature.rowType === 'input-simple') {
                    assertTruthy(connections.length === 1);
                }
                if (inputRowSignature.rowType === 'input-variable') {
                    if (connections.length == 0) {
                        let rowValue = rowContext.displayValue;
                        if (typeof rowValue === 'boolean') {
                            rowValue = +rowValue;
                        }
                        flowChunk.push(data(rowValue));
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
            const callOrInlineInstrs = this.addCall(node);
            flowChunk.push(...callOrInlineInstrs);
        }
    
        const lastNode = flow.sortedUsedNodes.at(-1)!;
        pushNode(lastNode);
    
        this.linker.addChunk(flowLabel, flowChunk);
    }

    addCall(node: FlowNodeContext): UnlinkedToken[] {
        const nodeRoutine = node.templateSignature!.byteCode;
        if (nodeRoutine != null) {
            if (nodeRoutine.type === 'inline') {
                return nodeRoutine.chunk;
            }
            if (!this.linker.hasChunk(node.scopedLabel)) {
                this.linker.addChunk(node.scopedLabel, nodeRoutine.chunk);
            }
            // call instruction
            return [
                label(node.scopedLabel, 'absolute'),
                instr(ByteInstruction.call),
            ];
        }

        // No routine => is flow or missing
        // Queue compilation to allow cyclic refs
        this.flowQueue.push(node.templateSignature!.id);
        return [
            label(node.scopedLabel, 'absolute'),
            instr(ByteInstruction.call),
        ];
    }
}

export function compileDocument(doc: FlowDocumentContext) {
    assertValidDocument(doc);
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
