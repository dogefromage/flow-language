import { FlowDocumentContext, NamespacePath } from "@noodles/language";
import { shorthands } from "./shorthands";
import { ByteInstructionStream, ByteOperation, ByteSource, CallableChunk } from "./types";

const { op, data, chunk, evalthunks } = shorthands;

const stdChunks: Record<string, CallableChunk> = {};

stdChunks['module::standard::add'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.nadd),
    op(ByteOperation.return),
]);
stdChunks['module::standard::subtract'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.nsub),
    op(ByteOperation.return),
]);
stdChunks['module::standard::logical_and'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.band),
    op(ByteOperation.return),
]);
stdChunks['module::standard::logical_or'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.bor),
    op(ByteOperation.return),
]);
stdChunks['module::standard::truncate'] = chunk(1, [
    op(ByteOperation.evaluate),
    op(ByteOperation.ntrunc),
    op(ByteOperation.return),
]);
stdChunks['module::standard::multiply'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.nmul),
    op(ByteOperation.return),
]);
stdChunks['module::standard::divide'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.ndiv),
    op(ByteOperation.return),
]);
stdChunks['module::standard::choose'] = chunk(3, [
    op(ByteOperation.evaluate),
    op(ByteOperation.bneg),
    data(1), op(ByteOperation.jc),
    op(ByteOperation.swp),
    op(ByteOperation.pop),
    op(ByteOperation.evaluate),
    op(ByteOperation.return),
]);
stdChunks['module::standard::greater'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.ngt),
    op(ByteOperation.return),
]);
stdChunks['module::standard::concat_strings'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.sconcat),
    op(ByteOperation.return),
]);
stdChunks['module::standard::substring'] = chunk(3, [
    ...evalthunks(true, true, true),
    op(ByteOperation.ssub),
    op(ByteOperation.return),
]);
stdChunks['module::standard::concat_lists'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.aconcat),
    op(ByteOperation.return),
]);
stdChunks['module::standard::sublist'] = chunk(3, [
    ...evalthunks(true, true, true),
    op(ByteOperation.asub),
    op(ByteOperation.return),
]);
stdChunks['module::standard::access_list'] = chunk(2, [
    ...evalthunks(true, true),
    op(ByteOperation.swp),
    op(ByteOperation.aget),
    op(ByteOperation.evaluate),
    op(ByteOperation.return),
]);
stdChunks['module::standard::pop'] = chunk(1, [
    op(ByteOperation.evaluate),
    op(ByteOperation.apop),
    op(ByteOperation.moveaside),
    op(ByteOperation.thunk_id),
    data('tail'),
    op(ByteOperation.moveback),
    data('head'),
    data(2),
    op(ByteOperation.opack),
    op(ByteOperation.return),
]);
stdChunks['module::standard::push'] = chunk(1, [
    ...evalthunks(false, true),
    op(ByteOperation.apush),
    op(ByteOperation.return),
]);
stdChunks['module::standard::length'] = chunk(1, [
    op(ByteOperation.evaluate),
    data('length'),
    op(ByteOperation.oget),
    op(ByteOperation.return),
]);
stdChunks['module::standard::evaluate'] = chunk(2, [
    // spread arg tuple onto stack
    op(ByteOperation.moveaside),
    op(ByteOperation.evaluate),
    op(ByteOperation.aspread),
    op(ByteOperation.moveback),
    // call by thunked name
    op(ByteOperation.evaluate),
    op(ByteOperation.call),
    op(ByteOperation.return),
]);
stdChunks['helper::obj_get'] = chunk(2, [
    // object get but thunked.
    // expects: ( k, () -> { k: () -> v } )
    // returns: v
    ...evalthunks(false, true), // eval objects thunk
    op(ByteOperation.oget),
    op(ByteOperation.evaluate), // eval members thunk
    op(ByteOperation.return),
]);
stdChunks['helper::wrap_value'] = chunk(1, [
    // simply returns an UNTHUNKED object such that we can
    // thunk a plain object using this helper
    op(ByteOperation.return),
]);


export class StandardSource extends ByteSource {
    
    public get chunks(): Record<string, CallableChunk> {
        return stdChunks;
    }

    public useRoutine(bs: ByteInstructionStream, path: NamespacePath): boolean {
        const emptyInlinable = [
            'module::standard::number',
            'module::standard::boolean',
            'module::standard::string',
            'module::standard::function',
            'module::standard::pack',
        ];
        if (emptyInlinable.includes(path.path)) {
            // empty inline functions, no instructions needed
            return true;
        }

        const foundChunk = this.chunks[path.path];
        if (!foundChunk) {
            return false;
        }
        // thunk a call to standard chunk
        bs.push(
            data(path.path),
            op(ByteOperation.thunk),
        );
        return true;
    }
}

export class DocumentSource extends ByteSource {

    constructor(
        private doc: FlowDocumentContext,
    ) {
        super();
    }

    public get chunks(): Record<string, CallableChunk> {
        return {};    
    }

    public useRoutine(bs: ByteInstructionStream, path: NamespacePath): boolean {
        const pathLabel = path.path;

        const flowRegex =   /^document::([\w_\d]+)$/;
        const inputRegex =  /^document::[\w_\d]+::input$/;
        const outputRegex = /^document::[\w_\d]+::output$/;

        const flowMatch = pathLabel.match(flowRegex);
        if (flowMatch &&
            this.doc.flowContexts[flowMatch[1]] != null) {
            // doc has flow
            bs.push(
                data(pathLabel),
                op(ByteOperation.thunk),
            );
            return true;
        }

        if (pathLabel.match(inputRegex)) {
            bs.push(
                // assuming args are stored in frame.locals[0]
                data(0),
                op(ByteOperation.getlocal),
            );
            return true;
        }
        
        if (pathLabel.match(outputRegex)) {
            // no instructions needed
            return true;
        }

        // not document path
        return false;
    }
}