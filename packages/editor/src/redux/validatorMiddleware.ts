import { Middleware } from 'redux';
import { selectConfig } from '../slices/configSlice';
import { validationSetResult } from '../slices/contextSlice';
import { EditorConfig } from '../types';
import { RootState } from './rootReducer';
import { selectDocument, useAppSelector } from './stateHooks';

/**
 * Directly updates context if document has changed
 * without it having to go through react and causing 
 * a double render.
 */
export function createValidatorMiddleware(config: EditorConfig) {
    const validatorMiddleware: Middleware<
        {},
        RootState
    > = storeApi => next => action => {
        const oldState = storeApi.getState();
        const oldDoc = selectDocument(oldState);
    
        let result = next(action);
    
        const newState = storeApi.getState();
        const newDoc = selectDocument(newState);
        if (oldDoc != newDoc) {
            // revalidate
            try {
                const projectContext = config.language.validator(newDoc);
                // send action to change validation
                next(validationSetResult({
                    context: projectContext,
                }));
            } catch (e) {
                console.error(e);
            }
        }
    
        return result;
    }
    return validatorMiddleware;
}