import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { useCallback } from "react";
import { RootState } from "../redux/store";
import { ContextSliceState } from "../types";
import { ProjectContext } from "@fluss/language";
import { castDraft } from "immer";

const initialState: ContextSliceState = {
    projectContext: null,
};

export const contextSlice = createSlice({
    name: 'context',
    initialState,
    reducers: {
        setContext: (s, a: PayloadAction<{ context: ProjectContext }>) => {
            s.projectContext = castDraft(a.payload.context);
        }
    }
});

export const {
    setContext: validationSetResult,
} = contextSlice.actions;

export const selectProjectContext = (state: RootState) => state.recorded.present.context;
export const selectFlowContext = (flowId: string) => {
    return useCallback((state: RootState) =>
        selectProjectContext(state).projectContext?.flowContexts[flowId],
        [flowId],
    );
}

const contextReducer = contextSlice.reducer;

export default contextReducer;