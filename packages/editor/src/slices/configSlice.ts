import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/rootReducer";
import { EditorConfig } from "../types";
import { getDefaultEditorConfig } from "../content/getDefaultEditorConfig";

const initialState: EditorConfig = getDefaultEditorConfig();

export const contentSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {}
});

// export const {
// } = contentSlice.actions;

export const selectConfig = (state: RootState) => state.config;

const contentReducer = contentSlice.reducer;

export default contentReducer;