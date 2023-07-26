import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/store";
import { EditorSliceState, BASE_FLOW_ID } from "../types";

const initialState: EditorSliceState = {
    activeFlow: BASE_FLOW_ID
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