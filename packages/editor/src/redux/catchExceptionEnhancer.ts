import { AnyAction, Reducer } from "redux";
import { consolePushLine } from "../slices/consoleSlice";

export default function catchExceptionEnhancer<S, A extends AnyAction>
    (reducer: Reducer<S, A>): Reducer<S, A> {
    return (state, action) => {
        try {
            return reducer(state, action);
        }
        catch (e: any) {
            console.error(e);
            const consoleAction = consolePushLine({
                line: {
                    text: `[${action.type}] Error in reducer: ${e?.message || 'Unknown error.'}\n`,
                    accent: 'error',
                }
            })
            return reducer(state, consoleAction as any);
        }
    }
}