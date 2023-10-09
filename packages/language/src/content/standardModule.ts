import { FlowSignature } from "../types";
import { FlowModule } from "../types/module";
import shorthands from "./shorthands";

const { varRow, simpleRow, outputRow, genParam, callableCode, inlineCode } = shorthands;

const signatures: FlowSignature[] = [];

signatures.push({
    id: 'add',
    attributes: { category: 'Numbers' },
    description: null,
    generics: [],
    inputs: [varRow.number('a', 0), varRow.number('b', 0)],
    output: outputRow.number('sum'),
    // byteCode: callableCode(2, [
    //     ...evalthunks(true, true),
    //     op(ByteOperation.nadd),
    //     op(ByteOperation.return),
    // ]),
})

export const standardModule: FlowModule = {
    name: 'standard',
    signatures: Object.fromEntries(signatures.map(s => [ s.id, s ])),
    types: {},
};