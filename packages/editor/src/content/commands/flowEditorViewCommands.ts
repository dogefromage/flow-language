import { flowsAddCommentNode, selectFlows } from "../../slices/flowsSlice";
import { flowEditorPanelsUpdateActiveCamera, flowEditorSetStateAddNodeAtPosition } from "../../slices/panelFlowEditorSlice";
import { EDITOR_SELECTABLE_ITEM_CLASS, FLOW_EDITOR_VIEW_TYPE, FlowEditorPanelState, PlanarCamera, createCommandGroup, createViewCommandUnlabeled, getActiveEditorCamera } from "../../types";
import { except } from "../../utils";
import { clientToOffsetPos, getPanelDivId } from "../../utils/panelManager";
import { pointScreenToWorld } from "../../utils/planarCameraMath";

export const {
    commands: flowEditorCommandList,
    labels: {
        addNodeAtPosition: flowEditorAddNodeAtPositionCommand,
        addCommandAtPosition: flowEditorAddCommandAtPositionCommand,
        paste: flowEditorPasteCommand,
        fitCamera: flowEditorFitCameraCommand,
    }
} = createCommandGroup(
    'flowEditor',
    {
        addNodeAtPosition: createViewCommandUnlabeled<FlowEditorPanelState>(
            FLOW_EDITOR_VIEW_TYPE,
            'Add Node',
            ({ targetPanelId, clientCursor, offsetCursor, offsetPanelCenter, clientPanelCenter }, params) => {
                return flowEditorSetStateAddNodeAtPosition({
                    panelId: targetPanelId,
                    clientPosition: clientCursor || clientPanelCenter,
                    offsetPosition: offsetCursor || offsetPanelCenter,
                });
            },
            [{ key: ' ', displayName: 'Space' }],
        ),
        addCommandAtPosition: createViewCommandUnlabeled<FlowEditorPanelState>(
            FLOW_EDITOR_VIEW_TYPE,
            'Add Comment',
            ({ panelState, offsetCursor, offsetPanelCenter }, params) => {
                const activeFlow = panelState.flowStack[0];
                const camera = getActiveEditorCamera(panelState);
                const offsetPoint = offsetCursor || offsetPanelCenter;
                const worldPoint = pointScreenToWorld(camera, offsetPoint);
                return flowsAddCommentNode({
                    flowId: activeFlow,
                    position: worldPoint,
                    undo: { desc: 'Added region in active flow.' },
                });
            },
        ),
        paste: createViewCommandUnlabeled<FlowEditorPanelState>(
            FLOW_EDITOR_VIEW_TYPE,
            'Paste',
            ({ appState, panelState: { flowStack } }, params) => {
                except(`Implement paste`);
                // const { clipboard } = selectEditor(appState);
                // const flowId = flowStack[0];
                // if (flowId == null || clipboard == null) return;
                // return flowsPasteNodes({
                //     flowId,
                //     clipboard,
                //     undo: { desc: `Pasted ${clipboard.selection.items.length} elements into active flow.` },
                // });
            },
            [{ key: 'v', ctrlKey: true }],
        ),
        fitCamera: createViewCommandUnlabeled<FlowEditorPanelState>(
            FLOW_EDITOR_VIEW_TYPE,
            'Fit camera to flow.',
            ({ targetPanelId, clientPanelRect, appState, panelState }) => {
                const activeFlow = panelState.flowStack[0];
                const camera = getActiveEditorCamera(panelState);
                const flow = selectFlows(appState)[activeFlow];
                if (!flow) return console.error(`Could not find flow.`);
    
                const panelDivId = getPanelDivId({ viewType: FLOW_EDITOR_VIEW_TYPE, panelId: targetPanelId });
                const selectorResult = document.querySelector(`#${panelDivId}`)
                    ?.querySelectorAll(`.${EDITOR_SELECTABLE_ITEM_CLASS}`) || [];
    
                const border = { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity };
    
                for (const elementDiv of Array.from(selectorResult)) {
                    const clientBounds = elementDiv.getBoundingClientRect();
                    border.l = Math.min(border.l, clientBounds.left);
                    border.t = Math.min(border.t, clientBounds.top);
                    border.r = Math.max(border.r, clientBounds.right);
                    border.b = Math.max(border.b, clientBounds.bottom);
                }
    
                const {
                    x: rect_l,
                    y: rect_t,
                } = pointScreenToWorld(
                    camera, clientToOffsetPos(
                        clientPanelRect, { x: border.l, y: border.t },
                    )
                );
                const {
                    x: rect_r,
                    y: rect_b,
                } = pointScreenToWorld(
                    camera, clientToOffsetPos(
                        clientPanelRect, { x: border.r, y: border.b },
                    )
                );
    
                const { w, h } = clientPanelRect;
                const k_x = w / (rect_r - rect_l);
                const k_y = h / (rect_b - rect_t);
    
                const MAX_ZOOM = 1.0;
                const newZoom = Math.min( 0.75 * Math.min(k_x, k_y), MAX_ZOOM );
    
                const newCamera: PlanarCamera = {
                    position: {
                        x: 0.5 * (rect_l + rect_r - w / newZoom),
                        y: 0.5 * (rect_t + rect_b - h / newZoom),
                    },
                    zoom: newZoom,
                };
    
                return flowEditorPanelsUpdateActiveCamera({
                    panelId: targetPanelId,
                    camera: newCamera,
                });
            }
        )
    }
)