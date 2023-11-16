import { undoEnhancerRedo, undoEnhancerUndo } from "../../redux/undoableEnhancer";
import { selectDocument } from "../../slices/documentSlice";
import { editorSetClipboard, editorSetSelection, selectEditor } from "../../slices/editorSlice";
import { flowsRemoveNodes } from "../../slices/flowsSlice";
import { createCommandGroup, createGlobalCommandUnlabeled } from "../../types";

export const {
    commands: editCommandsList,
    labels: {
        undo: editUndoCommand,
        redo: editRedoCommand,
        deleteSelected: editDeleteSelectedCommand,
        copySelected: editCopySelectedCommand,
        cutSelected: editCutSelectedCommand,
        clearSelection: editClearSelectionCommand,
    }
} = createCommandGroup(
    'edit',
    {
        undo: createGlobalCommandUnlabeled(
            'Undo',
            undoEnhancerUndo,
            [{ key: 'z', ctrlKey: true }],
        ),
        redo: createGlobalCommandUnlabeled(
            'Redo',
            undoEnhancerRedo,
            [{ key: 'y', ctrlKey: true }],
        ),
        deleteSelected: createGlobalCommandUnlabeled(
            'Delete Selected',
            ({ appState }) => {
                const { selection, activeFlow } = selectEditor(appState);
                if (activeFlow == null || selection == null) return;
                return flowsRemoveNodes({
                    flowId: activeFlow,
                    selection,
                    undo: { desc: `Deleted selected elements in active flow.` },
                });
            },
            [{ key: 'Delete', displayName: 'Del' },]
        ),
        copySelected: createGlobalCommandUnlabeled(
            'Copy Selected',
            ({ appState }) => {
                const { selection } = selectEditor(appState);
                if (selection == null) return;
                const currentDocument = selectDocument(appState);
                return editorSetClipboard({
                    clipboard: { selection, snapshot: currentDocument },
                });
            },
            [{ key: 'c', ctrlKey: true }],
        ),
        cutSelected: createGlobalCommandUnlabeled(
            'Cut Selected',
            ({ appState }) => {
                const { selection, activeFlow } = selectEditor(appState);
                if (activeFlow == null || selection == null) return;
                const currentDocument = selectDocument(appState);
                return [
                    editorSetClipboard({
                        clipboard: { selection, snapshot: currentDocument },
                    }),
                    flowsRemoveNodes({
                        flowId: activeFlow,
                        selection,
                        undo: { desc: 'Cut selected elements in active flow.' },
                    })
                ];
            },
            [{ ctrlKey: true, key: 'x' }],
        ),
        clearSelection: createGlobalCommandUnlabeled(
            'Clear Selection',
            () => editorSetSelection({ selection: null }),
        ),
    }
);