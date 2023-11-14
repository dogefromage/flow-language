import flowEditorPanelsReducer from "../slices/panelFlowEditorSlice";
import flowInspectorPanelsReducer from "../slices/panelFlowInspectorSlice";
import flowOutlinerPanelsReducer from "../slices/panelFlowOutlinerSlice";
import { EditorConfig, FLOW_EDITOR_VIEW_TYPE, FLOW_OUTLINER_VIEW_TYPE } from "../types";
import { FLOW_INSPECTOR_VIEW_TYPE } from "../types/flowInspectorView";

export const defaultPanelReducers: EditorConfig['panelReducers'] = {
    [FLOW_EDITOR_VIEW_TYPE]: flowEditorPanelsReducer,
    [FLOW_OUTLINER_VIEW_TYPE]: flowOutlinerPanelsReducer,
    [FLOW_INSPECTOR_VIEW_TYPE]: flowInspectorPanelsReducer,
}