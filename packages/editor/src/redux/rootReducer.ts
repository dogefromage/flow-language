import { AnyAction, combineReducers } from "@reduxjs/toolkit";
import { enhanceReducer } from "redux-yjs-bindings";
import commandsReducer from "../slices/commandsSlice";
import configReducer from "../slices/configSlice";
import contextMenuReducer from "../slices/contextMenuSlice";
import contextReducer from "../slices/contextSlice";
import editorReducer from "../slices/editorSlice";
import flowsReducer from "../slices/flowsSlice";
import menusReducer from "../slices/menusSlice";
import flowEditorPanelsReducer from "../slices/panelFlowEditorSlice";
import panelManagerReducer from "../slices/panelManagerSlice";
import pageOutlinerPanelsReducer from "../slices/panelPageOutlinerSlice";
import { ViewTypes } from "../types";
import { getAndDeserializeLocalProject, serializeAndStoreProjectLocally } from "../utils/localProjectStorage";
import storageEnhancer from "./storageEnhancer";

const documentReducer = combineReducers({
    flows: flowsReducer,
    config: configReducer,
});

const rootReducer = combineReducers({
    // content: undoableEnhancer(combineReducers({
    //     document: documentReducer,
    //     context: contextReducer,
    // })),
    document: /* enhanceReducer( */
        storageEnhancer<ReturnType<typeof documentReducer>, AnyAction>(
            documentReducer,
            getAndDeserializeLocalProject,
            serializeAndStoreProjectLocally,
        ),
    /* ), */
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