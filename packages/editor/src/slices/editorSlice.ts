import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/store";
import { EditorSliceState } from "../types";
import * as lang from "@noodles/language";

const initialState: EditorSliceState = {
    activeFlow: lang.MAIN_FLOW_ID
};

export const editorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setActiveFlow: (s, a: PayloadAction<{ flowId: string }>) => {
            s.activeFlow = a.payload.flowId;
        },
    }
});

export const {
    setActiveFlow: editorSetActiveFlow,
} = editorSlice.actions;

export const selectEditor = (state: RootState) => state.editor;

const editorReducer = editorSlice.reducer;

export default editorReducer;