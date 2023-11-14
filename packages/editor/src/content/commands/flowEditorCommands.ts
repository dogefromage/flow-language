import { flowsAddRegion, flowsPasteNodes, flowsRemoveNodes, selectFlows } from "../../slices/flowsSlice";
import { flowEditorPanelsUpdateCamera, flowEditorSetClipboard, flowEditorSetStateAddNodeAtPosition } from "../../slices/panelFlowEditorSlice";
import { FLOW_NODE_MIN_WIDTH, FLOW_NODE_ROW_HEIGHT } from "../../styles/flowStyles";
import { Command, EDITOR_SELECTABLE_ITEM_CLASS, FLOW_EDITOR_VIEW_TYPE, FlowEditorPanelState, PlanarCamera, Vec2, createViewCommand } from "../../types";
import { clientToOffsetPos, getPanelDivId } from "../../utils/panelManager";
import { pointScreenToWorld } from "../../utils/planarCameraMath";

export const flowEditorCommands: Command[] = [
    createViewCommand<FlowEditorPanelState>(
        'flowEditor.addNodeAtPosition',
        FLOW_EDITOR_VIEW_TYPE,
        'Add Node',
        ({ activePanelId, clientCursor, offsetCursor, offsetPanelCenter, clientPanelCenter }, params) => {
            return flowEditorSetStateAddNodeAtPosition({
                panelId: activePanelId,
                clientPosition: clientCursor || clientPanelCenter,
                offsetPosition: offsetCursor || offsetPanelCenter,
            });
        },
        [{ key: ' ', displayName: 'Space' }],
    ),
    createViewCommand<FlowEditorPanelState>(
        'flowEditor.addRegionAtPosition',
        FLOW_EDITOR_VIEW_TYPE,
        'Add Region',
        ({ panelState: { flowStack, camera }, offsetCursor, offsetPanelCenter }, params) => {
            const offsetPoint = offsetCursor || offsetPanelCenter;
            const worldPoint = pointScreenToWorld(camera, offsetPoint);
            return flowsAddRegion({
                flowId: flowStack[0],
                position: worldPoint,
                undo: { desc: 'Added region in active flow.' },
            });
        },
    ),
    createViewCommand<FlowEditorPanelState>(
        'flowEditor.deleteSelected',
        FLOW_EDITOR_VIEW_TYPE,
        'Delete Selected',
        ({ panelState: { flowStack, selection } }, params) => {
            const flowId = flowStack[0];
            if (flowId == null) return;
            return flowsRemoveNodes({
                flowId,
                selection,
                undo: { desc: `Deleted selected nodes in active flow.` },
            });
        },
        [{ key: 'Delete', displayName: 'Del' },]
    ),

    createViewCommand<FlowEditorPanelState>(
        'flowEditor.copySelected',
        FLOW_EDITOR_VIEW_TYPE,
        'Copy Selected',
        ({ appState, activePanelId, panelState: { flowStack, selection } }, params) => {
            const flow = selectFlows(appState)[flowStack[0]];
            if (!flow) return console.error(`Could not find flow.`);
            return flowEditorSetClipboard({
                panelId: activePanelId,
                clipboard: { selection, flow },
            });
        },
        [{ key: 'c', ctrlKey: true }],
    ),
    createViewCommand<FlowEditorPanelState>(
        'flowEditor.cutSelected',
        FLOW_EDITOR_VIEW_TYPE,
        'Cut Selected',
        ({ appState, activePanelId, panelState: { flowStack, selection } }, params) => {
            const flow = selectFlows(appState)[flowStack[0]];
            if (!flow) return console.error(`Could not find flow.`);

            return [
                flowEditorSetClipboard({
                    panelId: activePanelId,
                    clipboard: { selection, flow },
                }),
                flowsRemoveNodes({
                    flowId: flow.id,
                    selection,
                    undo: { desc: 'Cut selected nodes in active flow.' },
                })
            ];
        },
        [{ ctrlKey: true, key: 'x' }],
    ),
    createViewCommand<FlowEditorPanelState>(
        'flowEditor.paste',
        FLOW_EDITOR_VIEW_TYPE,
        'Paste',
        ({ appState, panelState: { clipboard, flowStack } }, params) => {
            const flowId = flowStack[0];
            if (flowId == null || clipboard == null) return;
            return flowsPasteNodes({
                flowId,
                clipboard,
                undo: { desc: `Pasted ${clipboard.selection.items.length} nodes into active flow.` },
            });
        },
        [{ key: 'v', ctrlKey: true }],
    ),
    createViewCommand<FlowEditorPanelState>(
        'flowEditor.fitCamera',
        FLOW_EDITOR_VIEW_TYPE,
        'Fit camera to flow.',
        ({ activePanelId, clientPanelRect, appState, panelState: { flowStack, camera } }) => {
            const flow = selectFlows(appState)[flowStack[0]];
            if (!flow) return console.error(`Could not find flow.`);


            const panelDivId = getPanelDivId({ viewType: FLOW_EDITOR_VIEW_TYPE, panelId: activePanelId });
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

            return flowEditorPanelsUpdateCamera({
                panelId: activePanelId,
                newCamera,
            });
        }
    )
];