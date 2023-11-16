import * as lang from "noodle-language";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { EditorClipboardData, EditorSliceState } from "../types";
import { RootState } from "../redux/rootReducer";

const initialState: EditorSliceState = {
    activeFlow: lang.MAIN_FLOW_ID,
    clipboard: null,
    selection: null,
};

export const editorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setActiveFlow: (s, a: PayloadAction<{ flowId: string }>) => {
            s.activeFlow = a.payload.flowId;
        },
        setSelection: (s, a: PayloadAction<{ selection: lang.FlowSelection | null }>) => {
            s.selection = a.payload.selection;
        },
        setClipboard: (s, a: PayloadAction<{ clipboard: EditorClipboardData | null }>) => {
            s.clipboard = a.payload.clipboard;
        },
    }
});

export const {
    setActiveFlow: editorSetActiveFlow,
    setSelection: editorSetSelection,
    setClipboard: editorSetClipboard,
} = editorSlice.actions;

export const selectEditor = (state: RootState) => state.editor;

const editorReducer = editorSlice.reducer;

export default editorReducer;