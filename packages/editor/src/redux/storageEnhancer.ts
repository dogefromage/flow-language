import { AnyAction, Reducer } from "@reduxjs/toolkit";

export default function storageEnhancer<S, A extends AnyAction>
    (reducer: Reducer<S, A>, load: () => S | undefined, store: (s: S) => void): Reducer<S, A> {
    return (state, action) => {
        // load
        state ||= load();
        // store
        const newState = reducer(state, action);
        if (state && state !== newState) {
            store(state);
        }
        return newState;
    }
}