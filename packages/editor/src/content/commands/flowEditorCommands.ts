import { v4 as uuidv4 } from "uuid";
import { flowsRemoveNodes } from "../../slices/flowsSlice";
import { flowEditorSetStateAddNodeAtPosition } from "../../slices/panelFlowEditorSlice";
import { Command, ViewTypes } from "../../types";

export const flowEditorCommands: Command[] = [
    {
        scope: 'view',
        viewType: ViewTypes.FlowEditor,
        id: 'flowEditor.addNodeAtPosition',
        name: 'Add Node',
        actionCreator({ activePanelId, clientCursor, offsetCursor, offsetCenter, clientCenter }, params) {
            return flowEditorSetStateAddNodeAtPosition({
                panelId: activePanelId,
                clientPosition: clientCursor || clientCenter,
                offsetPosition: offsetCursor || offsetCenter,
            });
        },
        keyCombinations: [{ key: ' ', displayName: 'Space' }],
    },
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
                undo: { desc: `Removed all selected nodes in active geometry.` },
            });
        },
        keyCombinations: [{ key: 'Delete', displayName: 'Del' }, { key: 'x', ctrlKey: true }],
    },
    // {
    //     scope: 'view',
    //     viewType: ViewTypes.FlowEditor,
    //     id: 'flowEditor.resetSelected',
    //     name: 'Reset Selected',
    //     actionCreator({ panelState: { geometryStack } }, params) {
    //         const geometryId = geometryStack[0];
    //         if (geometryId == null) return;
    //         return geometriesResetUserSelectedNodes({
    //             geometryId,
    //             userId: TEST_USER_ID,
    //             undo: { desc: `Reset values of all selected nodes in active geometry.` },
    //         });
    //     },
    //     // keyCombinations: [ { key: 'Delete', displayName: 'Del' }, { key: 'x', ctrlKey: true } ],
    // },
    // {
    //     scope: 'view',
    //     viewType: ViewTypes.FlowEditor,
    //     id: 'flowEditor.createGroup',
    //     name: 'Create Group',
    //     actionCreator({ offsetCursor, offsetCenter, panelState: { flowStack, camera } }, params) {
    //         const parentFlowId = flowStack[0];
    //         if (parentFlowId == null) return;

    //         const groupId = saveUUID();
    //         const signatureId: FlowSignatureId = `composed:${groupId}`;
    //         const worldPos = pointScreenToWorld(camera, offsetCursor || offsetCenter);

    //         const undoRecord: UndoRecord = {
    //             actionToken: 'createsub:' + signatureId,
    //             desc: `Created new flow group and placed node into current.`
    //         };

    //         return [
    //             flowsCreate({
    //                 flowId: groupId,
    //                 name: 'New Group',
    //                 signature: topFlowSignature,
    //                 undo: undoRecord,
    //             }),
    //             flowsAddNode({
    //                 flowId: parentFlowId,
    //                 signatureId,
    //                 position: worldPos,
    //                 undo: undoRecord,
    //             })
    //         ];
    //     },
    // }
]

function saveUUID() {
    return `group_${uuidv4().replaceAll('-', '').slice(10)}`;
}