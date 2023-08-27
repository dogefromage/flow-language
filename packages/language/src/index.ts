
export * from './types';
export {
    validateDocument
} from './validation/validateDocument';

export {
    interpretDocument,
    InterpreterConfig,
    InterpretationException
} from './interpreter';

export {
    collectTotalEnvironmentContent,
    findEnvironmentSignature,
    findEnvironmentType,
    getAllReferencedSpecifiers,
} from './core/environment';

export {
    createMissingType,
    createAnyType,
    createPrimitiveType,
    createListType,
    createTupleType,
    createFunctionType,
    createMapType,
} from './typeSystem';

export {
    tryResolveTypeAlias,
} from './typeSystem/resolution';

export {
    isSubsetType,
} from './typeSystem/comparison';