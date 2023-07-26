import { FlowEnvironmentContent } from "../types"

export const primitiveTypes = {
    number:  Symbol('number'),
    string:  Symbol('string'),
    boolean: Symbol('boolean'),
}

export const baseTypes: FlowEnvironmentContent['types'] = {
    number:  primitiveTypes.number,
    string:  primitiveTypes.string,
    boolean: primitiveTypes.boolean,
}