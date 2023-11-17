import * as lang from "noodle-language";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { castDraft } from "immer";
import { useCallback } from "react";
import { RootState } from "../redux/rootReducer";
import { ContextSliceState } from '../types';

const initialState: ContextSliceState = {
    documentContext: null,
};

export const contextSlice = createSlice({
    name: 'context',
    initialState,
    reducers: {
        setContext: (s, a: PayloadAction<{ context: lang.FlowDocumentContext }>) => {
            s.documentContext = castDraft(a.payload.context);
        }
    }
});

export const {
    setContext: validationSetResult,
} = contextSlice.actions;

export const selectDocumentContext = (state: RootState) => state.context;
export const useSelectFlowContext = (flowId: string) => {
    return useCallback((state: RootState) =>
        selectDocumentContext(state).documentContext?.flowContexts[flowId],
        [flowId],
    );
}

const contextReducer = contextSlice.reducer;

export default contextReducer;