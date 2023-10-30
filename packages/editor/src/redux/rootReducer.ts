import { AnyAction, Dispatch, ThunkDispatch, combineReducers } from "@reduxjs/toolkit";
import consoleReducer from "../slices/consoleSlice";
import contentReducer from "../slices/contentSlice";
import contextMenuReducer from "../slices/contextMenuSlice";
import contextReducer from "../slices/contextSlice";
import editorReducer from "../slices/editorSlice";
import flowsReducer from "../slices/flowsSlice";
import menusReducer from "../slices/menusSlice";
import flowEditorPanelsReducer from "../slices/panelFlowEditorSlice";
import flowInspectorPanelsReducer from "../slices/panelFlowInspectorSlice";
import panelManagerReducer from "../slices/panelManagerSlice";
import pageOutlinerPanelsReducer from "../slices/panelPageOutlinerSlice";
import projectStorageReducer from "../slices/projectStorageSlice";
import { EditorConfig, ViewTypes } from "../types";
import storageEnhancer from "./storageEnhancer";
import undoableEnhancer from "./undoableEnhancer";
import catchExceptionEnhancer from "./catchExceptionEnhancer";

const documentReducer = combineReducers({
    flows: flowsReducer,
});

const appContent = {
    document: undoableEnhancer(
        storageEnhancer(
            documentReducer
        ),
    ),
    context: contextReducer,
    editor: editorReducer,
    panels: combineReducers({
        [ViewTypes.FlowEditor]: flowEditorPanelsReducer,
        [ViewTypes.PageOutliner]: pageOutlinerPanelsReducer,
        [ViewTypes.FlowInspector]: flowInspectorPanelsReducer,
    }),
    projectStorage: projectStorageReducer,
    panelManager: panelManagerReducer,
    menus: menusReducer,
    content: contentReducer,
    contextMenu: contextMenuReducer,
    console: consoleReducer,
};

const nonExtendedReducer = combineReducers(appContent);
// get typings from non-extended
export type RootState = ReturnType<typeof nonExtendedReducer>;
export type AppDispatch = ThunkDispatch<RootState, undefined, AnyAction> & Dispatch<AnyAction>;

function createFullReducer(config: EditorConfig) {
    return catchExceptionEnhancer(
        combineReducers({
            ...appContent,
            extensions: combineReducers(config.stateReducers),
        })
    );
}

export default createFullReducer;