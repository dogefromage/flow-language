import { createAliasType } from "../typeSystem";
import { AnonymousFlowSignature, DestructuredOutputRowSignature, FunctionTypeSpecifier, GenericTypeSpecifier, ListTypeSpecifier, OutputRowSignature, SimpleInputRowSignature, TemplateParameter, TupleTypeSpecifier, TypeSpecifier, VariableInputRowSignature } from "../types";

const varRow = {
    string: (id: string, defaultValue: string): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: createAliasType('string'),
        defaultValue,
    }),
    number: (id: string, defaultValue: number): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: createAliasType('number'),
        defaultValue,
    }),
    boolean: (id: string, defaultValue: boolean): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: createAliasType('boolean'),
        defaultValue,
    }),
    list: (id: string, specifier: ListTypeSpecifier | GenericTypeSpecifier): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        defaultValue: null,
    }),
    tuple: (id: string, specifier: TupleTypeSpecifier | GenericTypeSpecifier): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        defaultValue: null,
    }),
    func: (id: string, specifier: FunctionTypeSpecifier | GenericTypeSpecifier): VariableInputRowSignature => ({
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
        specifier: createAliasType('string'),
    }),
    number: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        specifier: createAliasType('number'),
    }),
    boolean: (id: string): SimpleInputRowSignature => ({
        id,
        rowType: 'input-simple',
        specifier: createAliasType('boolean'),
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
        specifier: createAliasType('string'),
    }),
    number: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: createAliasType('number'),
    }),
    boolean: (id: string): OutputRowSignature => ({
        id,
        rowType: 'output-simple',
        // label: autoName(id),
        specifier: createAliasType('boolean'),
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
const genParam = (name: string, constraint: TypeSpecifier | null = null): TemplateParameter => ({ id: name, constraint });

export default {
    varRow,
    simpleRow,
    outputRow,
    genParam,
}