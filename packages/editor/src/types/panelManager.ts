import { Rect } from "./utils";

export type PanelState = {
    viewType: string;
}

export type CreatePanelStateCallback<T extends PanelState = PanelState> =
    (panelId: string) => T;

export interface ViewProps {
    viewType: string;
    panelId: string;
}

export interface PanelManagerSliceState {
    activePanelId: string;
    rootClientRect: Rect;
    clientRects: Map<string, Rect>;
}
