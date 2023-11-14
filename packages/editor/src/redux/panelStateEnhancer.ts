import { Reducer, createAction } from "@reduxjs/toolkit";
import { Draft, produce } from "immer";
import { useCallback } from "react";
import { PanelState } from "../types";
import { RootState } from "./rootReducer";

export const panelStateBind = createAction<{
    panelId: string, panelState: PanelState, viewType: string
}, 'panelstate.bind'>('panelstate.bind');

export const panelStateRemove = createAction<{
    panelId: string
}, 'panelstate.remove'>('panelstate.remove');

export function panelStateEnhancer<S extends PanelState>
    (reducer: Reducer<Record<string, S>>, viewType: string):
    Reducer<Record<string, PanelState>> {
    return (s = {}, a) => {
        if (panelStateBind.match(a)) {
            if (a.payload.viewType === viewType) {
                return produce(s, s => {
                    s[a.payload.panelId] = a.payload.panelState as Draft<S>;
                })
            }
        }
        if (panelStateRemove.match(a)) {
            return produce(s, s => {
                delete s[a.payload.panelId];
            })
        }
        return reducer(s as Record<string, S>, a);
    }
}

/**
 * Returns memoized typed selector with viewType and panelId
 */
export const useSelectPanelState = <S extends PanelState>(viewType: string, panelId: string) =>
    useCallback(selectPanelStateUnmemoized<S>(viewType, panelId), [viewType, panelId]);

export const selectPanelStateUnmemoized = <S extends PanelState>(viewType: string, panelId: string) =>
    (state: RootState) => (state as any).panels?.[viewType]?.[panelId]  as S | undefined;