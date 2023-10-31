import { isRejected, isRejectedWithValue } from '@reduxjs/toolkit';
import { Middleware } from 'redux';
import { consolePushLine } from '../slices/consoleSlice';
import { AppDispatch, RootState } from './rootReducer';

export const catchRejectedMiddleware: Middleware<{}, RootState, AppDispatch> = storeApi => next => action => {
    if (isRejectedWithValue(action)) {
        alert('implement reject with value here');
    } 
    else if (isRejected(action)) {
        // log error object
        console.error(Object.assign(new Error(), action.error));

        next(consolePushLine({
            line: {
                text: `[${action.type}] Thunk error: ${action.error?.message || 'Unknown error.'}\n`,
                accent: 'error',
            },
        }));
    }

    return next(action);
}