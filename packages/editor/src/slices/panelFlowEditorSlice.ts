import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { castDraft } from "immer";
import { useCallback } from "react";
import panelStateEnhancer, { useSelectPanelState } from "../redux/panelStateEnhancer";
import { CreatePanelStateCallback, DraggingJointContext, EditorClipboardNodeContent, FlowEditorPanelState, JointLocationKey, PlanarCamera, Vec2, ViewTypes } from "../types";
import { clamp } from "../utils/math";
import { getPanelState } from "../utils/panelManager";
import { pointScreenToWorld, vectorScreenToWorld } from "../utils/planarCameraMath";
import { RootState } from "../redux/rootReducer";

export const CAMERA_MIN_ZOOM = 1e-2;
export const CAMERA_MAX_ZOOM = 1e+2;

export const createFlowEditorPanelState: CreatePanelStateCallback<FlowEditorPanelState> = () => {
    const panelState: FlowEditorPanelState = {
        viewType: ViewTypes.FlowEditor,
        flowStack: [],
        camera: { position: { x: 0, y: 0 }, zoom: 1, },
        selection: [],
        state: { type: 'neutral' },
        relativeJointPosition: new Map(),
        clipboard: null,
    };
    return panelState;
}

export const flowEditorPanelsSlice = createSlice({
    name: 'flowEditorPanels',
    initialState: {} as Record<string, FlowEditorPanelState>,
    reducers: {
        setFlowId: (s, a: PayloadAction<{ panelId: string, flowId: string }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;

            const geoId = a.payload.flowId;
            if (ps.flowStack.includes(geoId)) {
                while (ps.flowStack[0] != geoId && ps.flowStack.length > 0) {
                    ps.flowStack.shift();
                }
            } else {
                ps.flowStack = [geoId];
            }
        },
        pushFlowId: (s, a: PayloadAction<{ panelId: string, flowId: string }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.flowStack.unshift(a.payload.flowId);
        },
        updateCamera: (s, a: PayloadAction<{ panelId: string, newCamera: Partial<PlanarCamera> }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;

            Object.assign(ps.camera, a.payload.newCamera);

            ps.camera.zoom = clamp(ps.camera.zoom, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM);
        },
        setStateNeutral: (s, a: PayloadAction<{ panelId: string }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.state = { type: 'neutral' };
        },
        setStateAddNodeAtPosition: (s, a: PayloadAction<{ panelId: string, clientPosition: Vec2, offsetPosition: Vec2 }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            const worldPosition = pointScreenToWorld(ps.camera, a.payload.offsetPosition);
            ps.state = {
                type: 'add-node-at-position',
                location: {
                    clientPosition: a.payload.clientPosition,
                    worldPosition,
                },
            };
        },
        setStateDraggingLink: (s, a: PayloadAction<{ panelId: string, draggingContext: DraggingJointContext }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.state = {
                type: 'dragging-link',
                draggingContext: castDraft(a.payload.draggingContext),
                cursorWorldPosition: null,
            };
        },
        updateDragginLinkPosition: (s, a: PayloadAction<{ panelId: string, offsetCursor: Vec2 }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            if (ps.state.type !== 'dragging-link') {
                return;
            }
            ps.state.cursorWorldPosition = pointScreenToWorld(ps.camera, a.payload.offsetCursor);
        },
        setStateAddNodeWithConnection: (s, a: PayloadAction<{ panelId: string, clientPosition: Vec2, offsetPosition: Vec2 }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            const worldPosition = pointScreenToWorld(ps.camera, a.payload.offsetPosition);
            const lastState = ps.state;
            if (lastState?.type !== 'dragging-link') {
                return console.error(`Tried to add node with connection but last state was not draggin-link`);
            }
            ps.state = {
                type: 'add-node-with-connection',
                location: {
                    clientPosition: a.payload.clientPosition,
                    worldPosition,
                },
                draggingContext: lastState.draggingContext,
            };
        },
        setSelection: (s, a: PayloadAction<{ panelId: string, selection: string[] }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.selection = a.payload.selection;
        },
        setRelativeClientJointPositions: (s, a: PayloadAction<{ panelId: string, updates: Array<{ jointKey: JointLocationKey, relativeClientPosition: Vec2 }> }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            for (const { jointKey, relativeClientPosition } of a.payload.updates) {
                const relativeWorldPos = vectorScreenToWorld(ps.camera, relativeClientPosition);
                ps.relativeJointPosition.set(jointKey, relativeWorldPos);
            }
        },
        setClipboard: (s, a: PayloadAction<{ panelId: string, clipboard: EditorClipboardNodeContent }>) => {
            const ps = getPanelState(s, a);
            if (!ps) return;
            ps.clipboard = a.payload.clipboard;
        },
    }
});

export const {
    setFlowId: flowEditorPanelsSetFlowId,
    pushFlowId: flowEditorPanelsPushFlowId,
    updateCamera: flowEditorPanelsUpdateCamera,
    setStateNeutral: flowEditorSetStateNeutral,
    setStateAddNodeAtPosition: flowEditorSetStateAddNodeAtPosition,
    setStateDraggingLink: flowEditorSetStateDraggingLink,
    updateDragginLinkPosition: flowEditorUpdateDragginLinkPosition,
    setStateAddNodeWithConnection: flowEditorSetStateAddNodeWithConnection,
    setSelection: flowEditorSetSelection,
    setRelativeClientJointPositions: flowEditorSetRelativeClientJointPositions,
    setClipboard: flowEditorSetClipboard,
} = flowEditorPanelsSlice.actions;

const flowEditorPanelsReducer = panelStateEnhancer(
    flowEditorPanelsSlice.reducer,
    ViewTypes.FlowEditor,
);

export const selectFlowEditorPanelActionState = (panelId: string) => {
    const panelStateSelector = useSelectPanelState(ViewTypes.FlowEditor, panelId);
    return useCallback((state: RootState) =>
        panelStateSelector(state)?.state,
        [panelStateSelector],
    );
}

export default flowEditorPanelsReducer;
