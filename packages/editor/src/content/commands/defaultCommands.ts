import { selectDocument } from "../../redux/stateHooks";
import { undoEnhancerUndo, undoEnhancerRedo } from "../../redux/undoableEnhancer";
import { Command } from "../../types";
import { download } from "../../utils/download";
import { serializeProject } from "../../utils/serialization";
import { flowEditorCommands } from "./flowEditorCommands";
import { pageOutlinerCommands } from "./pageOutlinerCommands";

export const defaultCommands: Command[] = [
    /**
     * GLOBAL
     */
    {
        id: 'global.undo',
        name: 'Undo',
        scope: 'global',
        actionCreator: async () => undoEnhancerUndo(),
        keyCombinations: [{ key: 'z', ctrlKey: true }],
    },
    {
        id: 'global.redo',
        name: 'Redo',
        scope: 'global',
        actionCreator: async () => undoEnhancerRedo(),
        keyCombinations: [{ key: 'y', ctrlKey: true }],
    },
    {
        id: 'global.export_document',
        name: "Export Document",
        scope: 'global',
        actionCreator: async ({ appState }) => {
            const doc = selectDocument(appState);
            const jsonProject = serializeProject(doc);
            const fileName = 'document.noodles';
            if (jsonProject) {
                download(jsonProject, 'application/json', fileName);
            } else {
                console.error(`No Project found.`);
            }
        }
    },
    // /**
    //  * Console view
    //  */
    // {
    //     scope: 'view',
    //     viewType: ViewTypes.Console,
    //     id: 'console.clearMessages',
    //     name: 'Clear Messages',
    //     actionCreator() {
    //         return consoleClearMessages({
    //             undo: { desc: `Cleared all messages from the console.` }
    //         });
    //     },
    // },
    ...flowEditorCommands,
    ...pageOutlinerCommands,
]