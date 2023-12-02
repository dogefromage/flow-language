import { createAliasType } from "../typeSystemOld";
import { FunctionTypeSpecifier, GenericTypeSpecifier, ListTypeSpecifier, MapTypeSpecifier, OutputRowSignature, SimpleInputRowSignature, TemplateParameter, TupleTypeSpecifier, TypeSpecifier, VariableInputRowSignature } from "../types";

interface VarRowOptions<T = VariableInputRowSignature['defaultValue']> {
    defaultValue: T;
    defaultDestructure: boolean;
}

const varRow = {
    string: (id: string, ops?: Partial<VarRowOptions<string>>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: createAliasType('string'),
        ...ops,
    }),
    number: (id: string, ops?: Partial<VarRowOptions<number>>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: createAliasType('number'),
        ...ops,
    }),
    boolean: (id: string, ops?: Partial<VarRowOptions<boolean>>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier: createAliasType('boolean'),
        ...ops,
    }),
    list: (id: string, specifier: ListTypeSpecifier | GenericTypeSpecifier, ops?: Partial<VarRowOptions>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        ...ops,
        defaultValue: null,
    }),
    tuple: (id: string, specifier: TupleTypeSpecifier | GenericTypeSpecifier, ops?: Partial<VarRowOptions>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        ...ops,
        defaultValue: null,
    }),
    map: (id: string, specifier: MapTypeSpecifier | GenericTypeSpecifier, ops?: Partial<VarRowOptions>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        ...ops,
        defaultValue: null,
    }),
    func: (id: string, specifier: FunctionTypeSpecifier | GenericTypeSpecifier, ops?: Partial<VarRowOptions>): VariableInputRowSignature => ({
        id,
        rowType: 'input-variable',
        specifier,
        ...ops,
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

interface OutputRowOptions {
    defaultDestructure: boolean;
    defaultHidden: boolean;
}

const outputRow = {
    alias: (id: string, alias: string, ops?: Partial<OutputRowOptions>): OutputRowSignature => ({
        id,
        rowType: 'output',
        specifier: createAliasType(alias),
        ...ops,
    }),
    custom: (id: string, specifier: TypeSpecifier, ops?: Partial<OutputRowOptions>): OutputRowSignature => ({
        id,
        rowType: 'output',
        specifier,
        ...ops,
    }),
    // string: (id: string): OutputRowSignature => ({
    //     id,
    //     rowType: 'output',
    //     specifier: createAliasType('string'),
    // }),
    // number: (id: string): OutputRowSignature => ({
    //     id,
    //     rowType: 'output',
    //     specifier: createAliasType('number'),
    // }),
    // boolean: (id: string): OutputRowSignature => ({
    //     id,
    //     rowType: 'output',
    //     specifier: createAliasType('boolean'),
    // }),
    // destructured: (id: string, specifier: TypeSpecifier): DestructuredOutputRowSignature => ({
    //     id,
    //     rowType: 'output-destructured',
    //     specifier,
    // }),
};
const genParam = (name: string, constraint: TypeSpecifier | null = null): TemplateParameter => ({ id: name, constraint });

export default {
    varRow,
    simpleRow,
    outputRow,
    genParam,
}