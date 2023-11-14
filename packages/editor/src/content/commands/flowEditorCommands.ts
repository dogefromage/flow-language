import { flowsAddRegion, flowsPasteNodes, flowsRemoveNodes, selectFlows } from "../../slices/flowsSlice";
import { flowEditorSetClipboard, flowEditorSetStateAddNodeAtPosition } from "../../slices/panelFlowEditorSlice";
import { Command, ViewTypes, except, makeViewCommand } from "../../types";
import { pointScreenToWorld } from "../../utils/planarCameraMath";

export const flowEditorCommands: Command[] = [
    makeViewCommand<ViewTypes.FlowEditor>(
        'flowEditor.addNodeAtPosition',
        ViewTypes.FlowEditor,
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
    makeViewCommand<ViewTypes.FlowEditor>(
        'flowEditor.addRegionAtPosition',
        ViewTypes.FlowEditor,
        'Add Region',
        ({ panelState: { flowStack, camera }, clientCursor, offsetCursor, offsetPanelCenter, clientPanelCenter }, params) => {
            const offsetPoint = offsetCursor || offsetPanelCenter;
            const worldPoint = pointScreenToWorld(camera, offsetPoint);
            return flowsAddRegion({
                flowId: flowStack[0],
                position: worldPoint,
                undo: { desc: 'Added region in active flow.' },
            });
        },
        // [{ key: ' ', displayName: 'Space' }],
    ),
    {
        scope: 'view',
        viewType: ViewTypes.FlowEditor,
        id: 'flowEditor.deleteSelected',
        name: 'Delete Selected',
        actionCreator({ panelState: { flowStack, selection } }, params) {
            const flowId = flowStack[0];
            if (flowId == null) return;
            return flowsRemoveNodes({
                flowId,
                selection,
                undo: { desc: `Deleted selected nodes in active flow.` },
            });
        },
        keyCombinations: [{ key: 'Delete', displayName: 'Del' },],
    },
    {
        scope: 'view',
        viewType: ViewTypes.FlowEditor,
        id: 'flowEditor.copySelected',
        name: 'Copy Selected',
        actionCreator({ appState, activePanelId, panelState: { flowStack, selection } }, params) {
            const flow = selectFlows(appState)[flowStack[0]];
            if (!flow) return console.error(`Could not find flow.`);
            return flowEditorSetClipboard({
                panelId: activePanelId,
                clipboard: { selection, flow },
            });
        },
        keyCombinations: [{ key: 'c', ctrlKey: true }],
    },
    {
        scope: 'view',
        viewType: ViewTypes.FlowEditor,
        id: 'flowEditor.cutSelected',
        name: 'Cut Selected',
        actionCreator({ appState, activePanelId, panelState: { flowStack, selection } }, params) {
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
        keyCombinations: [{ ctrlKey: true, key: 'x' }],
    },
    {
        scope: 'view',
        viewType: ViewTypes.FlowEditor,
        id: 'flowEditor.paste',
        name: 'Paste',
        actionCreator({ appState, panelState: { clipboard, flowStack } }, params) {
            const flowId = flowStack[0];
            if (flowId == null || clipboard == null) return;
            return flowsPasteNodes({
                flowId,
                clipboard,
                undo: { desc: `Pasted ${clipboard.selection.items.length} nodes into active flow.` },
            });
        },
        keyCombinations: [{ key: 'v', ctrlKey: true }],
    },
];