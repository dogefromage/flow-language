import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useCallback } from "react";
import { RootState } from "../redux/store";
import { PanelManagerSliceState, Rect } from "../types";

const initialState: PanelManagerSliceState = {
    activePanelId: '',
    rootClientRect: { x: 0, y: 0, w: 0, h: 0 },
    clientRects: new Map(),
};

export const panelManagerSlice = createSlice({
    name: 'panelManager',
    initialState,
    reducers: {
        setActive: (s, a: PayloadAction<{ activePanel: string }>) => {
            s.activePanelId = a.payload.activePanel;
        },
        setClientRect: (s, a: PayloadAction<{ panelId: string, rect: Rect }>) => {
            s.clientRects.set(a.payload.panelId, a.payload.rect);
        },
        setRootClientRect: (s, a: PayloadAction<{ rect: Rect }>) => {
            s.rootClientRect = a.payload.rect;
        },
    }
});

export const {
    setActive: panelManagerSetActive,
    setClientRect: panelManagerSetClientRect,
    setRootClientRect: panelManagerSetRootClientRect,
} = panelManagerSlice.actions;

export const selectPanelManager = (state: RootState) => state.panelManager;

export const selectPanelClientRect = 
    (panelId: string) =>
        useCallback((state: RootState) => 
            state.panelManager.clientRects.get(panelId), 
            [ panelId ]
        );

const panelManagerReducer = panelManagerSlice.reducer;

export default panelManagerReducer;