import { createSlice } from "@reduxjs/toolkit";
import { getDefaultEditorConfig } from "../content/getDefaultEditorConfig";
import { RootState } from "../redux/rootReducer";

export const contentSlice = createSlice({
    name: 'config',
    initialState: getDefaultEditorConfig,
    reducers: {}
});

// export const {
// } = contentSlice.actions;

export const selectConfig = (state: RootState) => state.config;

const contentReducer = contentSlice.reducer;

export default contentReducer;