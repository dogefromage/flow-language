import { undo, redo } from "../../redux/undoableEnhancer";
import { Command } from "../../types";
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
        actionCreator: undo,
        keyCombinations: [{ key: 'z', ctrlKey: true }],
    },
    {
        id: 'global.redo',
        name: 'Redo',
        scope: 'global',
        actionCreator: redo,
        keyCombinations: [{ key: 'y', ctrlKey: true }],
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