import { createSlice } from "@reduxjs/toolkit";
import panelStateEnhancer from "../redux/panelStateEnhancer";
import { CreatePanelStateCallback, FlowEditorPanelState, ViewTypes } from "../types";
import { PageOutlinerPanelState } from "../types/pageOutlinerView";

export const createPageOutlinerPanelState: CreatePanelStateCallback<PageOutlinerPanelState> = () => {
    const panelState: PageOutlinerPanelState = {
        viewType: ViewTypes.PageOutliner,
    };
    return panelState;
}

export const pageOutlinerPanelsSlice = createSlice({
    name: 'pageOutlinerPanels',
    initialState: {} as Record<string, PageOutlinerPanelState>,
    reducers: {
        
    }
});

export const {
} = pageOutlinerPanelsSlice.actions;

const pageOutlinerPanelsReducer = panelStateEnhancer(
    pageOutlinerPanelsSlice.reducer,
    ViewTypes.PageOutliner,
);

export default pageOutlinerPanelsReducer;
