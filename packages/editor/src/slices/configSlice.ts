import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/store";
import { FlowDocumentConfig } from "@fluss/language";
import { defaultDocumentConfig } from "../types";
import { selectDocument } from "../redux/stateHooks";

const initialState: FlowDocumentConfig = defaultDocumentConfig;

export const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {}
});

export const {
} = configSlice.actions;

export const selectConfig = (state: RootState) => selectDocument(state).config;

const configReducer = configSlice.reducer;

export default configReducer;