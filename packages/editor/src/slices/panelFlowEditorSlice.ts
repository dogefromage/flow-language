import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { castDraft } from "immer";
import { useCallback } from "react";
import { panelStateEnhancer, useSelectPanelState } from "../redux/panelStateEnhancer";
import { RootState } from "../redux/rootReducer";
import { CreatePanelStateCallback, DEFAULT_EDITOR_CAMERA, DraggingJointContext, FLOW_EDITOR_VIEW_TYPE, FlowEditorPanelState, getActiveEditorCamera, JointLocationKey, PlanarCamera, Vec2 } from "../types";
import { except } from "../utils/exceptions";
import { clamp } from "../utils/math";
import { getPanelState } from "../utils/panelManager";
import { pointScreenToWorld, vectorScreenToWorld } from "../utils/planarCameraMath";

export const CAMERA_MIN_ZOOM = 1e-2;
export const CAMERA_MAX_ZOOM = 1e+2;

export const createFlowEditorPanelState: CreatePanelStateCallback<FlowEditorPanelState> = () => {
    const panelState: FlowEditorPanelState = {
        flowStack: [],
        viewType: FLOW_EDITOR_VIEW_TYPE,
        cameras: {},
        state: { type: 'neutral' },
        relativeJointPosition: new Map(),
    };
    return panelState;
}

export const flowEditorPanelsSlice = createSlice({
    name: 'flowEditorPanels',
    initialState: {} as Record<string, FlowEditorPanelState>,
    reducers: {
        setFlowId: (s, a: PayloadAction<{ panelId: string, flowId: string }>) => {
            const ps = getPanelState(s, a);

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
            ps.flowStack.unshift(a.payload.flowId);
        },
        updateActiveCamera: (s, a: PayloadAction<{ panelId: string, camera: Partial<PlanarCamera> }>) => {
            const ps = getPanelState(s, a);
            const activeFlow = ps.flowStack[0];
            if (!activeFlow) return;
            const newCamera: PlanarCamera = {
                ...getActiveEditorCamera(ps),
                ...a.payload.camera,
            }
            newCamera.zoom = clamp(newCamera.zoom, CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM);
            ps.cameras[activeFlow] = newCamera;
        },
        setStateNeutral: (s, a: PayloadAction<{ panelId: string }>) => {
            const ps = getPanelState(s, a);
            ps.state = { type: 'neutral' };
        },
        setStateAddNodeAtPosition: (s, a: PayloadAction<{ panelId: string, clientPosition: Vec2, offsetPosition: Vec2 }>) => {
            const ps = getPanelState(s, a);
            const cam = getActiveEditorCamera(ps);
            const worldPosition = pointScreenToWorld(cam, a.payload.offsetPosition);
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
            ps.state = {
                type: 'dragging-link',
                draggingContext: castDraft(a.payload.draggingContext),
                cursorWorldPosition: null,
            };
        },
        updateDragginLinkPosition: (s, a: PayloadAction<{ panelId: string, offsetCursor: Vec2 }>) => {
            const ps = getPanelState(s, a);
            if (ps.state.type !== 'dragging-link') {
                return;
            }
            const cam = getActiveEditorCamera(ps);
            ps.state.cursorWorldPosition = pointScreenToWorld(cam, a.payload.offsetCursor);
        },
        setStateAddNodeWithConnection: (s, a: PayloadAction<{ panelId: string, clientPosition: Vec2, offsetPosition: Vec2 }>) => {
            const ps = getPanelState(s, a);
            const cam = getActiveEditorCamera(ps);
            const worldPosition = pointScreenToWorld(cam, a.payload.offsetPosition);
            const lastState = ps.state;
            if (lastState?.type !== 'dragging-link') {
                except(`Tried to add node with connection but last state was not draggin-link`);
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
        setRelativeClientJointPositions: (s, a: PayloadAction<{ panelId: string, updates: Array<{ jointKey: JointLocationKey, relativeClientPosition: Vec2 }> }>) => {
            const ps = getPanelState(s, a);
            const cam = getActiveEditorCamera(ps);
            for (const { jointKey, relativeClientPosition } of a.payload.updates) {
                const relativeWorldPos = vectorScreenToWorld(cam, relativeClientPosition);
                ps.relativeJointPosition.set(jointKey, relativeWorldPos);
            }
        },
    }
});

export const {
    setFlowId: flowEditorPanelsSetFlowId,
    pushFlowId: flowEditorPanelsPushFlowId,
    updateActiveCamera: flowEditorPanelsUpdateActiveCamera,
    setStateNeutral: flowEditorSetStateNeutral,
    setStateAddNodeAtPosition: flowEditorSetStateAddNodeAtPosition,
    setStateDraggingLink: flowEditorSetStateDraggingLink,
    updateDragginLinkPosition: flowEditorUpdateDragginLinkPosition,
    setStateAddNodeWithConnection: flowEditorSetStateAddNodeWithConnection,
    setRelativeClientJointPositions: flowEditorSetRelativeClientJointPositions,
} = flowEditorPanelsSlice.actions;

const flowEditorPanelsReducer = panelStateEnhancer(
    flowEditorPanelsSlice.reducer,
    FLOW_EDITOR_VIEW_TYPE,
);

export const useSelectFlowEditorPanel = (panelId: string) =>
    useSelectPanelState<FlowEditorPanelState>(FLOW_EDITOR_VIEW_TYPE, panelId);

export const useSelectFlowEditorPanelActionState = (panelId: string) => {
    const panelStateSelector = useSelectFlowEditorPanel(panelId);
    return useCallback((state: RootState) =>
        panelStateSelector(state)?.state,
        [panelStateSelector],
    );
}

export default flowEditorPanelsReducer;
