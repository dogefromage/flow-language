
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
} from './core/environment';

export {
    createUnknownType,
} from './typeSystem';

export {
    tryResolveTypeAlias,
} from './typeSystem/resolution';

export {
    isSubsetType as areTypesCompatible,
} from './typeSystem/comparison';