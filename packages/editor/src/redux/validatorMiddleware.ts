import { Middleware } from 'redux';
import { selectContextDocument, validationSetResult } from '../slices/contextSlice';
import { selectDocument } from '../slices/documentSlice';
import { EditorConfig } from '../types';
import { RootState } from './rootReducer';

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
        const context = selectContextDocument(oldState);

        let result = next(action);
    
        const newState = storeApi.getState();
        const newDoc = selectDocument(newState);
        if (context.documentContext == null || oldDoc != newDoc) {
            // revalidate
            try {
                const projectContext = config.language.validator(newDoc);
                // console.log(projectContext);
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