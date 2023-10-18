import { AnyAction, Reducer } from "@reduxjs/toolkit";
import { MAX_LENGTH, UndoAction, UndoHistory } from "../types/undoTypes";

enum UndoableActionTypes {
    Undo = 'undo.undo',
    Redo = 'undo.redo',
}

export const undoEnhancerUndo = () => ({ type: UndoableActionTypes.Undo, payload: {} });
export const undoEnhancerRedo = () => ({ type: UndoableActionTypes.Redo, payload: {} });

export default function undoableEnhancer<S, A extends AnyAction>
    (reducer: Reducer<S, A>): Reducer<UndoHistory<S>, A> {

    const initialState: UndoHistory<S> = {
        past: [],
        present: reducer(undefined, {} as A),
        future: [],
    };

    const enhancer: Reducer<UndoHistory<S>, A> = (state, _action): UndoHistory<S> => {
        if (state == null) {
            state = initialState;
        }
        let { past, present, future, lastRecord } = state;
        
        const action: UndoAction = _action as any;

        if (action.type === UndoableActionTypes.Undo) {
            const previous = past[past.length - 1];
            if (!previous) {
                return state;
            }
            const newPast = past.slice(0, past.length - 1);
            const newFuture = [present, ...future];
            return {
                past: newPast,
                present: previous,
                future: newFuture,
            }
        }
        if (action.type === UndoableActionTypes.Redo) {
            const next = future[0]
            if (!next) {
                return state;
            }
            return {
                past: [...past, present],
                present: next,
                future: future.slice(1)
            }
        }

        const newPresent = reducer(present, _action);

        // nothing changed
        if (present === newPresent) {
            return state;
        }

        const isUndoable = action.payload.undo != null;
        if (isUndoable) {
            const ignore = action.payload.undo.doNotRecord ?? false;
            const sameRecord = action.payload.undo == lastRecord;
            const sameToken = typeof (lastRecord?.actionToken) === 'string' &&
                lastRecord?.actionToken === action.payload?.undo?.actionToken;

            if (!ignore && !sameRecord && !sameToken) {
                // record snapshot of last present
                past = [...past, present].slice(-MAX_LENGTH);
                // prone future branch away
                future = [];
            }
        }

        return {
            past,
            present: newPresent,
            future,
            lastRecord: action.payload?.undo ?? lastRecord, // overwrite if defined
        }
    }

    return enhancer;
}