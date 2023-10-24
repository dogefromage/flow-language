import { combineReducers } from "@reduxjs/toolkit";
import commandsReducer from "../slices/commandsSlice";
import contextMenuReducer from "../slices/contextMenuSlice";
import contextReducer from "../slices/contextSlice";
import editorReducer from "../slices/editorSlice";
import flowsReducer from "../slices/flowsSlice";
import menusReducer from "../slices/menusSlice";
import flowEditorPanelsReducer from "../slices/panelFlowEditorSlice";
import flowInspectorPanelsReducer from "../slices/panelFlowInspectorSlice";
import panelManagerReducer from "../slices/panelManagerSlice";
import pageOutlinerPanelsReducer from "../slices/panelPageOutlinerSlice";
import { ViewTypes } from "../types";
import storageEnhancer from "./storageEnhancer";
import undoableEnhancer from "./undoableEnhancer";
import projectStorageReducer from "../slices/projectStorageSlice";

const documentReducer = combineReducers({
    flows: flowsReducer,
});

const rootReducer = combineReducers({
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
    commands: commandsReducer,
    contextMenu: contextMenuReducer,
});

export default rootReducer;