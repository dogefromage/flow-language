import { combineReducers } from "@reduxjs/toolkit";
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

const rootReducer = combineReducers({
    recorded: undoableEnhancer(
        combineReducers({
            project: combineReducers({
                flows: flowsReducer,
            }),
            context: contextReducer,
        }),
    ),
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