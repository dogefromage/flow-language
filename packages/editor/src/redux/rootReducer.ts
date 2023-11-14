import { AnyAction, Dispatch, ThunkDispatch, combineReducers } from "@reduxjs/toolkit";
import contentReducer from "../slices/configSlice";
import consoleReducer from "../slices/consoleSlice";
import contextMenuReducer from "../slices/contextMenuSlice";
import contextReducer from "../slices/contextSlice";
import documentReducer from "../slices/documentSlice";
import editorReducer from "../slices/editorSlice";
import menusReducer from "../slices/menusSlice";
import panelManagerReducer from "../slices/panelManagerSlice";
import { EditorConfig } from "../types";
import catchExceptionEnhancer from "./catchExceptionEnhancer";
import undoableEnhancer from "./undoableEnhancer";

const appContent = {
    document: undoableEnhancer(
        documentReducer,
    ),
    context: contextReducer,
    editor: editorReducer,
    panelManager: panelManagerReducer,
    menus: menusReducer,
    config: contentReducer,
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
            extensions: combineReducers(config.customReducers || {}),
            panels: combineReducers(config.panelReducers || {}),
        })
    );
}

export default createFullReducer;