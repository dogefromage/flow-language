import { selectDocument } from "../../redux/stateHooks";
import { undoEnhancerUndo, undoEnhancerRedo } from "../../redux/undoableEnhancer";
import { Command } from "../../types";
import { download } from "../../utils/download";
import { flowEditorCommands } from "./flowEditorCommands";
import { pageOutlinerCommands } from "./pageOutlinerCommands";

export const defaultCommands: Command[] = [
    {
        id: 'global.undo',
        name: 'Undo',
        scope: 'global',
        actionCreator: () => undoEnhancerUndo(),
        keyCombinations: [{ key: 'z', ctrlKey: true }],
    },
    {
        id: 'global.redo',
        name: 'Redo',
        scope: 'global',
        actionCreator: () => undoEnhancerRedo(),
        keyCombinations: [{ key: 'y', ctrlKey: true }],
    },
    ...flowEditorCommands,
    ...pageOutlinerCommands,
]