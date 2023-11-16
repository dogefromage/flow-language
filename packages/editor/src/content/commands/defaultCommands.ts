import { Command } from "../../types";
import { flowEditorCommandList } from "./flowEditorViewCommands";
import { flowOutlinerCommandList } from "./flowOutlinerCommands";
import { editCommandsList } from "./globalEditorCommands";

export const defaultCommands: Command[] = [
    ...editCommandsList,
    ...flowEditorCommandList,
    ...flowOutlinerCommandList,
]