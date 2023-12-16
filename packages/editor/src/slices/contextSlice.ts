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
        setContext: (s, a: PayloadAction<{ context: lang.DocumentContext }>) => {
            s.documentContext = castDraft(a.payload.context);
        }
    }
});

export const {
    setContext: validationSetResult,
} = contextSlice.actions;

export const selectContextDocument = (state: RootState) => state.context;
export const selectContextFlow = (flowId: string) => 
    (state: RootState) => selectContextDocument(state).documentContext?.flowContexts[flowId];
const selectContextNode = (flowId: string, nodeId: string) =>
    (state: RootState) => selectContextFlow(flowId)(state)?.nodes[nodeId];

export const useSelectContextFlow = (flowId: string) =>
    useCallback(selectContextFlow(flowId), [flowId]);
export const useSelectContextNode = (flowId: string, nodeId: string) =>
    useCallback(selectContextNode(flowId, nodeId), [flowId, nodeId]);

const contextReducer = contextSlice.reducer;

export default contextReducer;