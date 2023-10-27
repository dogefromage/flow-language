import { AnyAction, PayloadAction, Reducer } from "@reduxjs/toolkit";
import { produce, Draft } from "immer";
import { useCallback } from "react";
import { PanelState } from "../types";
import { ViewTypes, PanelStateMap } from "../types";
import { RootState } from "./rootReducer";

enum PanelStateActionTypes {
    Bind = 'panelState/create',
    Remove = 'panelState/remove',
}

type BindPayload = { panelId: string, panelState: PanelState, viewType: ViewTypes };
type RemovePayload = { panelId: string };

type PanelStateAction =
    | PayloadAction<BindPayload, PanelStateActionTypes.Bind>
    | PayloadAction<RemovePayload, PanelStateActionTypes.Remove>

export const panelStateBind = (payload: BindPayload) => ({
    type: PanelStateActionTypes.Bind,
    payload,
});

export const panelStateRemove = (payload: RemovePayload) => ({
    type: PanelStateActionTypes.Remove,
    payload,
});

export default function panelStateEnhancer<S extends PanelState, A extends AnyAction>
    (reducer: Reducer<Record<string, S>, A>, viewType: ViewTypes):
    Reducer<Record<string, S>, A> {
    return (state = {}, action) => {
        const a = action as unknown as PanelStateAction;

        if (a.type === PanelStateActionTypes.Bind) {
            if (a.payload.viewType === viewType) {
                return produce(state, s => {
                    s[a.payload.panelId] = a.payload.panelState as Draft<S>;
                })
            }
        }

        if (a.type === PanelStateActionTypes.Remove) {
            return produce(state, s => {
                delete s[a.payload.panelId];
            })
        }

        return reducer(state, action);
    }
}

/**
 * Returns memoized typed selector with viewType and panelId
 */
export function useSelectPanelState<T extends ViewTypes>(viewType: T, panelId: string):
    (state: RootState) => PanelStateMap[T] | undefined {
    return useCallback((state: RootState) => {
        type ReducerState = RootState['panels'];
        const panelsOfType = state.panels[viewType as keyof ReducerState]!;
        return panelsOfType[panelId] as PanelStateMap[T];
    }, [viewType, panelId]);
}