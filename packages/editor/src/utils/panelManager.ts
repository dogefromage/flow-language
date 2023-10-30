import { Obj } from "@noodles/language/lib/types/types/utilTypes";
import { PayloadAction } from "@reduxjs/toolkit";
import { useEffect } from "react";
import { panelStateBind, panelStateRemove } from "../redux/panelStateEnhancer";
import { useAppDispatch } from "../redux/stateHooks";
import { CreatePanelStateCallback, ViewTypes, PanelState, Rect, Vec2, except } from "../types";

export function useBindPanelState(panelId: string, createPanelState: CreatePanelStateCallback, viewType: ViewTypes) {
    const dispatch = useAppDispatch();
    useEffect(() => {
        const panelState = createPanelState(panelId);
        dispatch(panelStateBind({ panelId, panelState, viewType }));
        return () => {
            dispatch(panelStateRemove({ panelId }))
        };
    }, [ panelId ]);
}

/**
 * Use inside a panel reducer.
 */
export function getPanelState<T extends PanelState>(s: Obj<T>, a: PayloadAction<{ panelId: string }>) {
    const ps = s[ a.payload.panelId ];
    if (!ps) except(`Panel state not found paneldId=${a.payload.panelId}`);
    return ps;
}

export function offsetToClientPos(clientRect: Rect, offsetPos: Vec2): Vec2 {
    return {
        x: offsetPos.x + clientRect.x,
        y: offsetPos.y + clientRect.y,
    }
}

export function clientToOffsetPos(clientRect: Rect, clientPos: Vec2): Vec2 {
    return {
        x: clientPos.x - clientRect.x,
        y: clientPos.y - clientRect.y,
    }
}