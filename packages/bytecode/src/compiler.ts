import * as lang from "@noodles/language";
import _ from 'lodash';
import { shorthands } from "./shorthands";
import { DocumentSource, StandardSource } from "./sources";
import { ByteCompilerArgs, ByteInstructionStream, ByteOperation, ByteProgram, ByteSource, CallableChunk, MACHINE_ENTRY_LABEL } from "./types";
import { ByteCodeOptimizer } from "./ByteCodeOptimizer";

const { op, data } = shorthands;

class Counter {
    private value = 0;
    next() {
        return this.value++;
    }
}

class Compiler {
    private program!: ByteProgram;

    private constants = new Map<any, lang.NamespacePath>();
    private constantsCounter = new Counter;

    constructor(
        private doc: lang.FlowDocumentContext,
        private sources: ByteSource[],
    ) {}

    compile() {
        lang.assertTruthy(this.program == null, 'Compiler is single use.');
        this.program = { chunks: new Map() };

        for (const source of this.sources) {
            for (const [path, callableChunk] of Object.entries(source.chunks)) {
                this.addChunk({ path }, callableChunk);
            }
        }
        this.program.chunks.set(MACHINE_ENTRY_LABEL, {
            arity: 0,
            instructions: [
                data('document::main'),
                op(ByteOperation.call),
                op(ByteOperation.return),
            ]
        });

        this.emitDocument();

        new ByteCodeOptimizer(this.program)
            .optimize();

        return this.program;
    }

    private useConstant(value: any) {
        const memoized = this.constants.get(value);
        if (memoized != null) {
            return memoized;
        }
        const path: lang.NamespacePath = { path: `const::${this.constantsCounter.next()}` };
        this.addChunk(path, {
            arity: 0,
            instructions: [
                data(value),
                op(ByteOperation.return),
            ],
        });
        this.constants.set(value, path);
        return path;
    }

    private addChunk(path: lang.NamespacePath, chunk: CallableChunk) {
        if (this.program.chunks.has(path.path)) {
            throw new Error(`Duplicate chunk '${path.path}'.`);
        }
        this.program.chunks.set(path.path, chunk);
    }

    private useRoutine(bs: ByteInstructionStream, path: lang.NamespacePath) {
        for (const source of this.sources) {
            if (source.useRoutine(bs, path) == true) {
                return;
            }
        }
        throw new Error(`No source contained definition for routine '${path.path}'.`);
    }

    private emitDocument() {
        this.sources.push(new DocumentSource(this.doc));

        for (const flowId of Object.keys(this.doc.flowContexts)) {
            this.emitFlowChunk(flowId);
        }
    }

    private emitFlowChunk(flowId: string) {
        const flow = lang.assertDef(this.doc.flowContexts[flowId],
            `A definition for flow '${flowId}' could not be found.`);
        const flowPath: lang.NamespacePath = { path: `document::${flowId}` };

        let localsCounter = 0;

        const flowInputs = flow.flowSignature.inputs;
        const bs = new ByteInstructionStream();

        // get args and put into local object
        for (let i = 0; i < flowInputs.length; i++) {
            bs.push(
                op(ByteOperation.moveaside),
            );
        }
        for (let i = flowInputs.length - 1; i >= 0; i--) {
            bs.push(
                op(ByteOperation.moveback),
                data(flowInputs[i].id),
            );
        }

        bs.push(
            data(flowInputs.length),
            op(ByteOperation.opack),
        );
        // we now have plain object containing thunked items
        // wrap into thunk before storing
        this.useRoutine(bs, { path: 'helper::wrap_value' });
        bs.push(
            // store packed args in first local
            data(0),
            op(ByteOperation.setlocal),
        );
        localsCounter++;

        const nodeIdLocals = new Map<string, number>();

        // TODO replace with more sophisticated algorithm
        for (const nodeId of flow.sortedUsedNodes) {
            const node = lang.assertDef(flow.nodeContexts[nodeId]);
            const inputRows = node.templateSignature!.inputs;
            const paramsTuple = node.inferredType?.specifier.parameter as lang.TupleTypeSpecifier;
            lang.assertTruthy(paramsTuple.type === 'tuple');
            lang.assertTruthy(paramsTuple.elements.length === inputRows.length);
            for (let rowIndex = inputRows.length - 1; rowIndex >= 0; rowIndex--) {
                const inputRowSignature = inputRows[rowIndex];
                const rowContext = node.inputRows[inputRowSignature.id];
                this.emitNodeInputPlacement(
                    bs,
                    inputRows[rowIndex],
                    rowContext,
                    paramsTuple.elements[rowIndex],
                    flow.flowEnvironment,
                    nodeIdLocals,
                );
            }
            const nextLocalIndex = localsCounter++;
            nodeIdLocals.set(node.ref.id, nextLocalIndex);
            // compute node and store
            this.useRoutine(bs, node.ref.signature);
            bs.push(
                data(nextLocalIndex),
                op(ByteOperation.setlocal),
            );
        }

        const lastNodeId = flow.sortedUsedNodes.at(-1)!;
        const lastNodeLocal = lang.assertDef(nodeIdLocals.get(lastNodeId));

        bs.push(
            data(lastNodeLocal),
            op(ByteOperation.getlocal),
            op(ByteOperation.evaluate),
            op(ByteOperation.return),
        );

        const arity = flowInputs.length;
        this.addChunk(flowPath, bs.exportChunk(arity));
    }

    private emitNodeInputPlacement(
        bs: ByteInstructionStream,
        inputRow: lang.InputRowSignature,
        context: lang.RowContext,
        inferredType: lang.TypeSpecifier,
        env: lang.FlowEnvironment,
        nodeIdLocals: Map<string, number>,
    ) {
        const connectionMap = context.ref?.connections || {};

        const placeConnection = (accessors: string) => {
            const conn = lang.assertDef(connectionMap[accessors]);
            const neededLocalIndex = lang.assertDef(nodeIdLocals.get(conn.nodeId));
            bs.push(
                data(neededLocalIndex),
                op(ByteOperation.getlocal),
            );
            if (conn.accessor != null) {
                bs.push(data(conn.accessor));
                this.useRoutine(bs, { path: 'helper::obj_get' });
            }
        }

        if (context.display === 'hidden') {
            lang.assertNever('wtf');
        }
        if (context.display === 'simple') {
            placeConnection('0');
            return;
        }
        if (context.display === 'initializer') {
            const value = lang.assertDef(context.value);
            bs.push(
                data(this.useConstant(value).path),
                op(ByteOperation.thunk),
            );
            return;
        }
        if (context.display === 'destructured') {
            const resType = lang.tryResolveTypeAlias(inferredType, env);
            if (resType?.type === 'list' ||
                resType?.type === 'tuple') {
                const highestListItem = lang.utils.findMaxIntegerKey(connectionMap);
                const listLength = highestListItem + 1;
                if (resType.type === 'tuple') {
                    lang.assertTruthy(listLength === resType.elements.length);
                }
                // access in reverse over range
                _.range(0, listLength, 1).reverse()
                    .forEach(index => placeConnection(index.toString()))
                bs.push(
                    // pack into list of length
                    data(listLength),
                    op(ByteOperation.apack),
                );
                this.useRoutine(bs, { path: 'helper::wrap_value' });
                return;
            }
            if (resType?.type === 'map') {
                const mapKeys = Object.keys(connectionMap);
                // place connection followed by key for every property
                for (const key of mapKeys) {
                    placeConnection(key);
                    bs.push(data(key));
                }
                // place size and pack
                bs.push(
                    data(mapKeys.length),
                    op(ByteOperation.opack),
                );
                this.useRoutine(bs, { path: 'helper::wrap_value' });
                return;
            }
            lang.assertNever();
        }
        lang.assertNever();
    }
}

export function compileDocument(doc: lang.FlowDocumentContext, config: ByteCompilerArgs) {
    if (!config.skipValidation) {
        assertValidDocument(doc);
    }
    const sources: ByteSource[] = [new StandardSource()];
    const compiler = new Compiler(doc, sources);
    return compiler.compile();
}

function assertValidDocument(doc: lang.FlowDocumentContext) {

    const problemTree = lang.generateProblemTree(doc);
    if (problemTree != null) {
        const msg = [
            'Document contains problems.',
            ...formatProblemTree(problemTree),
        ].join('\n');
        throw new Error(msg);
    }

    const flow = doc.flowContexts[lang.MAIN_FLOW_ID];
    if (flow == null) {
        throw new Error(`Document requires a flow named 'main' to run.`);
    }
}

function indentLines(lines: string[]) {
    const indent = ' '.repeat(4);
    return lines.map(l => indent + l);
}

function formatProblemTree(node: lang.ProblemTreeNode): string[] {
    return [
        `@ ${node.name}`,
        ...indentLines(node.problems.map(p => p.message)),
        ...indentLines(node.children.map(c => formatProblemTree(c)).flat()),
    ]
}