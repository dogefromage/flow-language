import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import panelStateEnhancer from "../redux/panelStateEnhancer";
import { CreatePanelStateCallback, ViewTypes } from "../types";
import { FlowInspectorLists, FlowInspectorPanelState } from "../types/flowInspectorView";
import { getPanelState } from "../utils/panelManager";

export const createFlowInspectorPanelState: CreatePanelStateCallback<FlowInspectorPanelState> = () => {
    const panelState: FlowInspectorPanelState = {
        viewType: ViewTypes.FlowInspector,
        selectedListItems: {},
    };
    return panelState;
}

export const flowInspectorPanelsSlice = createSlice({
    name: 'flowInspectorPanels',
    initialState: {} as Record<string, FlowInspectorPanelState>,
    reducers: {
        selectRow: (s, a: PayloadAction<{ panelId: string, listType: FlowInspectorLists, rowId: string }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.selectedListItems[a.payload.listType] = a.payload.rowId;
        },
    },
});

export const {
    selectRow: flowInspectorPanelsSelectRow,
} = flowInspectorPanelsSlice.actions;

const flowInspectorPanelsReducer = panelStateEnhancer(
    flowInspectorPanelsSlice.reducer,
    ViewTypes.FlowInspector,
);

export default flowInspectorPanelsReducer;