import { createPrimitiveType } from "../typeSystem"
import { FlowEnvironmentContent } from "../types"

export const primitiveTypes = {
    number:  createPrimitiveType('number'),
    string:  createPrimitiveType('string'),
    boolean: createPrimitiveType('boolean'),
    // number:  Symbol('number'),
    // string:  Symbol('string'),
    // boolean: Symbol('boolean'),
}

export const baseTypes: FlowEnvironmentContent['types'] = {
    number:  primitiveTypes.number,
    string:  primitiveTypes.string,
    boolean: primitiveTypes.boolean,
}