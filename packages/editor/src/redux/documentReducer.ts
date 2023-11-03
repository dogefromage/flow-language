import { createAction, Reducer } from "@reduxjs/toolkit";
import { AnyAction, combineReducers } from "redux";
import documentHeaderReducer from "../slices/documentHeaderSlice";
import flowsReducer from "../slices/flowsSlice";

const documentReducer = combineReducers({
    header: documentHeaderReducer,
    flows: flowsReducer,
});

export type EditorDocumentState = ReturnType<typeof documentReducer>;

export const editorDocumentReplace = createAction<{ document: EditorDocumentState }, 'document.replace'>('document.replace');

const enhancedDocumentReducer: Reducer<EditorDocumentState, AnyAction> = (s, a) => {
    if (a.type === editorDocumentReplace.type) {
        const docAction = a as ReturnType<typeof editorDocumentReplace>;
        return docAction.payload.document;
    }
    return documentReducer(s, a);
}

export default enhancedDocumentReducer;