import * as lang from 'noodle-language';
import Menus from "../components/Menus";
import { EditorConfig } from "../types";
import { defaultCommands } from "./commands/defaultCommands";
import { editClearSelectionCommand, editCutSelectedCommand, editDeleteSelectedCommand, editRedoCommand, editUndoCommand } from "./commands/globalEditorCommands";
import { defaultPanelReducers } from "./defaultPanels";

function getDefaultCommandMap() {
    return Object.fromEntries(
        defaultCommands.map(c => ([c.id, c]))
    );
}

function getDefaultToolbar(): EditorConfig['toolbar'] {

    const DocumentSubmenu = () => (<></>);

    const EditSubmenu = () => (<>
        <Menus.Command commandId={editUndoCommand} />
        <Menus.Command commandId={editRedoCommand} />
        <Menus.Divider />
        <Menus.Command commandId={editClearSelectionCommand} />
        <Menus.Command commandId={editDeleteSelectedCommand} />
        <Menus.Command commandId={editCutSelectedCommand} />
    </>);

    return {
        inlineMenus: [
            ['Document', DocumentSubmenu],
            ['Edit', EditSubmenu],
        ],
        widgetsCenter: [],
        widgetsRight: [],
    };
}

export function getDefaultEditorConfig(): EditorConfig {
    return {
        customReducers: {},
        panelReducers: defaultPanelReducers,
        debug: {
            reduxLogger: false,
        },
        commands: getDefaultCommandMap(),
        toolbar: getDefaultToolbar(),
        managerComponents: [],
        language: {
            validator: lang.createLanguageValidator(lang.content.defaultConfiguration),
        }
    };
}