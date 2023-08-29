import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import panelStateEnhancer from "../redux/panelStateEnhancer";
import { CreatePanelStateCallback, ViewTypes } from "../types";
import { FlowInspectorPanelState, FlowInspectorSelectionItem } from "../types/flowInspectorView";
import { getPanelState } from "../utils/panelManager";

export const createFlowInspectorPanelState: CreatePanelStateCallback<FlowInspectorPanelState> = () => {
    const panelState: FlowInspectorPanelState = {
        viewType: ViewTypes.FlowInspector,
    };
    return panelState;
}

export const flowInspectorPanelsSlice = createSlice({
    name: 'flowInspectorPanels',
    initialState: {} as Record<string, FlowInspectorPanelState>,
    reducers: {
        selectItem: (s, a: PayloadAction<{ panelId: string, type: FlowInspectorSelectionItem, id: string }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.selectedItem = { 
                type: a.payload.type, 
                id: a.payload.id, 
            };
        },
    },
});

export const {
    selectItem: flowInspectorPanelsSelectItem,
} = flowInspectorPanelsSlice.actions;

const flowInspectorPanelsReducer = panelStateEnhancer(
    flowInspectorPanelsSlice.reducer,
    ViewTypes.FlowInspector,
);

export default flowInspectorPanelsReducer;