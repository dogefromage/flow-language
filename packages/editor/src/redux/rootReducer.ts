import { combineReducers } from "@reduxjs/toolkit";
import { enhanceReducer } from "redux-yjs-bindings";
import commandsReducer from "../slices/commandsSlice";
import contextMenuReducer from "../slices/contextMenuSlice";
import contextReducer from "../slices/contextSlice";
import editorReducer from "../slices/editorSlice";
import flowsReducer from "../slices/flowsSlice";
import menusReducer from "../slices/menusSlice";
import flowEditorPanelsReducer from "../slices/panelFlowEditorSlice";
import panelManagerReducer from "../slices/panelManagerSlice";
import pageOutlinerPanelsReducer from "../slices/panelPageOutlinerSlice";
import { ViewTypes } from "../types";
import undoableEnhancer from "./undoableEnhancer";
import configReducer from "../slices/configSlice";

const documentReducer = combineReducers({
    flows: flowsReducer,
    config: configReducer,
});

const rootReducer = combineReducers({
    // content: undoableEnhancer(combineReducers({
    //     document: documentReducer,
    //     context: contextReducer,
    // })),
    document: enhanceReducer(documentReducer),
    context: contextReducer,
    editor: editorReducer,
    panels: combineReducers({
        [ViewTypes.FlowEditor]: flowEditorPanelsReducer,
        [ViewTypes.PageOutliner]: pageOutlinerPanelsReducer,
    }),
    panelManager: panelManagerReducer,
    menus: menusReducer,
    commands: commandsReducer,
    contextMenu: contextMenuReducer,
});

export default rootReducer;