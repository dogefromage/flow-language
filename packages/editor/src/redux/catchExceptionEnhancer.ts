import { Reducer } from "redux";
import { createConsoleError } from "../utils";

export default function catchExceptionEnhancer<S>
    (reducer: Reducer<S>): Reducer<S> {
    return (state, action) => {
        try {
            return reducer(state, action);
        }
        catch (e: any) {
            console.error(e);
            return reducer(state, createConsoleError(e));
        }
    }
}