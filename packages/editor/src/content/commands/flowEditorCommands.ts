import { flowsAddRegion, flowsPasteNodes, flowsRemoveNodes, selectFlows } from "../../slices/flowsSlice";
import { flowEditorSetClipboard, flowEditorSetStateAddNodeAtPosition } from "../../slices/panelFlowEditorSlice";
import { Command, FLOW_EDITOR_VIEW_TYPE, FlowEditorPanelState, createViewCommand } from "../../types";
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
];