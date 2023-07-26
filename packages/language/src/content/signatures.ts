import { upperFirst } from "lodash";
import { FlowSignature, InputRowSignature, OutputRowSignature } from "../types";

const varNumberRow = (tag: string, defaultValue = 0): InputRowSignature => ({
    rowType: 'input-variable',
    id: tag,
    label: upperFirst(tag),
    dataType: 'number',
    defaultValue,
});
const outNumberRow = (tag: string): OutputRowSignature => ({
    rowType: 'output',
    id: tag,
    label: upperFirst(tag),
    dataType: 'number',
});

const add: FlowSignature = {
    id: 'add',
    name: 'Add',
    attributes: {},
    description: null,
    inputs: [ varNumberRow('a'), varNumberRow('b') ],
    outputs: [ outNumberRow('sum') ],
}
const test: FlowSignature = {
    id: 'test',
    name: 'Test',
    attributes: {},
    description: null,
    inputs: [ 
        varNumberRow('Number'),
        {
            rowType: 'input-variable',
            id: 'b',
            label: 'Boolean',
            dataType: 'boolean',
            defaultValue: true,
        },
        {
            rowType: 'input-variable',
            id: 's',
            label: 'String',
            dataType: 'string',
            defaultValue: 'Hello',
        }

    ],
    outputs: [],
}



const sigs: FlowSignature[] = [
    add,
    test,
];

export const baseSignatures = Object.fromEntries(
    sigs.map(s => [s.id, s])
);