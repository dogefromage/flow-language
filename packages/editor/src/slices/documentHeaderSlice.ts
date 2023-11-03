import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/rootReducer";
import { selectDocument } from "../redux/stateHooks";
import { UndoAction } from "../types";
import { DocumentHeaderSliceState } from "../types/document";

const initialState: DocumentHeaderSliceState = {
    title: 'New Document',
    description: '',
};

export const documentHeaderSlice = createSlice({
    name: 'documentHeader',
    initialState,
    reducers: {
        setTitle: (s, a: UndoAction<{ title: string }>) => {
            s.title = a.payload.title;
        },
        setDescription: (s, a: UndoAction<{ description: string }>) => {
            s.description = a.payload.description;
        },
    }
});

export const {
    setTitle: documentHeaderSetTitle,
    setDescription: documentHeaderSetDescription,
} = documentHeaderSlice.actions;

export const selectDocumentHeader = (state: RootState) => selectDocument(state).header;

const documentHeaderReducer = documentHeaderSlice.reducer;

export default documentHeaderReducer;