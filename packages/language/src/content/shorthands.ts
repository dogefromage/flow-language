import { VariableInputRowSignature, ListTypeSpecifier, TupleTypeSpecifier, FunctionTypeSpecifier, SimpleInputRowSignature, TypeSpecifier, OutputRowSignature, DestructuredOutputRowSignature, GenericParameter, ByteInstruction, AnonymousFlowSignature } from "../types";

const varRow = {
    string: (id: string, defaultValue: string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: 'string',
        defaultValue,
    }),
    number: (id: string, defaultValue: number): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: 'number',
        defaultValue,
    }),
    boolean: (id: string, defaultValue: boolean): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: 'boolean',
        defaultValue,
    }),
    list: (id: string, specifier: ListTypeSpecifier | string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        defaultValue: null,
    }),
    tuple: (id: string, specifier: TupleTypeSpecifier | string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        defaultValue: null,
    }),
    func: (id: string, specifier: FunctionTypeSpecifier | string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        defaultValue: null,
    }),
};
const simpleRow = {
    string: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        specifier: 'string',
    }),
    number: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        specifier: 'number',
    }),
    boolean: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        specifier: 'boolean',
    }),
    generic: (id: string, specifier: TypeSpecifier): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        specifier,
    }),
};

const outputRow = {
    string: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: 'string',
    }),
    number: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: 'number',
    }),
    boolean: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: 'boolean',
    }),
    generic: (id: string, specifier: TypeSpecifier): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier,
    }),
    destructured: (id: string, specifier: TypeSpecifier): DestructuredOutputRowSignature => ({
        id,
        rowType: 'output-destructured',
        specifier,
    }),
};
const genParam = (name: string, constraint: TypeSpecifier | null = null): GenericParameter => ({ id: name, constraint });

const callableCode = (arity: number, instructions: ByteInstruction[]): AnonymousFlowSignature['byteCode'] =>
    ({ type: 'callable', chunk: { arity, instructions } });
const inlineCode = (instructions: ByteInstruction[]): AnonymousFlowSignature['byteCode'] =>
    ({ type: 'inline', instructions });

export default {
    varRow,
    simpleRow,
    outputRow,
    genParam,
    callableCode,
    inlineCode,
}