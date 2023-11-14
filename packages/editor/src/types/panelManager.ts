import { FlowEditorPanelState } from "./flowEditorView";
import { FlowInspectorPanelState } from "./flowInspectorView";
import { PageOutlinerPanelState } from "./pageOutlinerView";
import { Rect } from "./utils";

export type PanelState = {
    viewType: ViewTypes;
}

export type CreatePanelStateCallback<T extends PanelState = PanelState> =
    (panelId: string) => T;

export interface ViewProps {
    viewType: ViewTypes;
    panelId: string;
}

/**
 * Serves also as keys of panels slice in store
 */
export enum ViewTypes {
    FlowEditor = 'flow_editor',
    PageOutliner = 'page_outliner',
    FlowInspector = 'flow_inspector',
    Console = 'console',
}

export type PanelStateMap = {
    [ViewTypes.FlowEditor]: FlowEditorPanelState;
    [ViewTypes.PageOutliner]: PageOutlinerPanelState;
    [ViewTypes.FlowInspector]: FlowInspectorPanelState;
}

export interface PanelManagerSliceState {
    activePanelId: string;
    rootClientRect: Rect;
    clientRects: Map<string, Rect>;
}
