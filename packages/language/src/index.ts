
export * from './types';
export { validateProject } from './core/validateProject';

export {
    collectTotalEnvironmentContent,
    findEnvironmentSignature,
    findEnvironmentType,
} from './core/environment';

export {
    types
} from './core/typeStructure';

export {
    areTypesCompatible,
} from './core/compareTypes';