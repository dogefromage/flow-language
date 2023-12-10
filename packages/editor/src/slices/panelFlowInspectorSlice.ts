import { createSlice } from "@reduxjs/toolkit";
import { panelStateEnhancer, useSelectPanelState } from "../redux/panelStateEnhancer";
import { CreatePanelStateCallback } from "../types";
import { FLOW_INSPECTOR_VIEW_TYPE, FlowInspectorPanelState } from "../types/flowInspectorView";

export const createFlowInspectorPanelState: CreatePanelStateCallback<FlowInspectorPanelState> = () => {
    const panelState: FlowInspectorPanelState = {
        viewType: FLOW_INSPECTOR_VIEW_TYPE,
    };
    return panelState;
}

export const flowInspectorPanelsSlice = createSlice({
    name: 'flowInspectorPanels',
    initialState: {} as Record<string, FlowInspectorPanelState>,
    reducers: {
        // selectItem: (s, a: PayloadAction<{ panelId: string, type: FlowInspectorSelectionItem, id: string }>) => {
        //     const ps = getPanelState(s, a);
        //     ps.selectedItem = { 
        //         type: a.payload.type, 
        //         id: a.payload.id, 
        //     };
        // },
    },
});

export const {
    // selectItem: flowInspectorPanelsSelectItem,
} = flowInspectorPanelsSlice.actions;

const flowInspectorPanelsReducer = panelStateEnhancer(
    flowInspectorPanelsSlice.reducer,
    FLOW_INSPECTOR_VIEW_TYPE,
);

export const useSelectFlowInspectorPanel = (panelId: string) => 
    useSelectPanelState<FlowInspectorPanelState>(FLOW_INSPECTOR_VIEW_TYPE, panelId);

export default flowInspectorPanelsReducer;