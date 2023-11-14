import { createSlice } from "@reduxjs/toolkit";
import { panelStateEnhancer } from "../redux/panelStateEnhancer";
import { CreatePanelStateCallback } from "../types";
import { FLOW_OUTLINER_VIEW_TYPE, FlowOutlinerPanelState } from "../types/flowOutlinerView";

export const createFlowOutlinerPanelState: CreatePanelStateCallback<FlowOutlinerPanelState> = () => {
    const panelState: FlowOutlinerPanelState = {
        viewType: FLOW_OUTLINER_VIEW_TYPE,
    };
    return panelState;
}

export const flowOutlinerPanelsSlice = createSlice({
    name: 'flowOutlinerPanels',
    initialState: {} as Record<string, FlowOutlinerPanelState>,
    reducers: {}
});

export const {
} = flowOutlinerPanelsSlice.actions;

const flowOutlinerPanelsReducer = panelStateEnhancer(
    flowOutlinerPanelsSlice.reducer,
    FLOW_OUTLINER_VIEW_TYPE,
);

export default flowOutlinerPanelsReducer;
