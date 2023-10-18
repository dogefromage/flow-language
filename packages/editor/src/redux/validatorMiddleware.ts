import { Middleware } from 'redux'
import { RootState } from './store'
import { selectDocument } from './stateHooks';
import * as lang from '@noodles/language';
import { validationSetResult } from '../slices/contextSlice';

/**
 * Directly updates context if document has changed
 * without it having to go through react and causing 
 * a double render.
 */
export const validatorMiddleware: Middleware<
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
            // console.log('\n\nStarting validation (middleware)\n\n\n');

            const projectContext = lang.validateDocument(newDoc);
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