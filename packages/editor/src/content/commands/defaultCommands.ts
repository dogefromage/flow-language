import { undoEnhancerRedo, undoEnhancerUndo } from "../../redux/undoableEnhancer";
import { Command, createGlobalCommand } from "../../types";
import { flowEditorCommands } from "./flowEditorCommands";
import { flowOutlinerCommands } from "./flowOutlinerCommands";

export const defaultCommands: Command[] = [
    createGlobalCommand(
        'global.undo', 'Undo',
        undoEnhancerUndo,
        [{ key: 'z', ctrlKey: true }],
    ),
    createGlobalCommand(
        'global.redo', 'Redo',
        undoEnhancerRedo,
        [{ key: 'y', ctrlKey: true }],
    ),
    ...flowEditorCommands,
    ...flowOutlinerCommands,
]