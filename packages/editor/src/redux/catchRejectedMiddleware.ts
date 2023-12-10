import { isRejected, isRejectedWithValue } from '@reduxjs/toolkit';
import { Middleware } from 'redux';
import { AppDispatch, RootState } from './rootReducer';
import { createConsoleError } from '../utils';

export const catchRejectedMiddleware: Middleware<{}, RootState, AppDispatch> = storeApi => next => action => {
    if (isRejectedWithValue(action)) {
        alert('implement reject with value here');
    } 
    else if (isRejected(action)) {
        // log error object
        const err = Object.assign(new Error(), action.error);
        console.error(err);
        next(createConsoleError(err));
    }

    return next(action);
}