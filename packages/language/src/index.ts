
export * from './types';
export {
    validateDocument
} from './validation/validateDocument';

export {
    collectTotalEnvironmentContent,
    findEnvironmentSignature,
    findEnvironmentType,
} from './core/environment';

export {
    createAnyType,
    createPrimitiveType,
    createListType,
    createTupleType,
    createFunctionType,
    createMapType,
    getSignatureFunctionType,
} from './typeSystem';

export {
    tryResolveTypeAlias,
} from './typeSystem/resolution';

export {
    isSubsetType,
} from './typeSystem/comparison';

export {
    compileDocument,
} from './byteCode/byteCompiler';
export {
    StackMachine,
} from './byteCode/stackMachine';

export * as utils from './utils/functional';