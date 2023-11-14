import Menus from "../components/Menus";
import { EditorConfig } from "../types/config";
import { defaultCommands } from "./commands/defaultCommands";
import * as lang from 'noodle-language';
import { defaultPanelReducers } from "./defaultPanels";

function getDefaultCommandMap() {
    return Object.fromEntries(
        defaultCommands.map(c => ([c.id, c]))
    );
}

function getDefaultToolbar(): EditorConfig['toolbar'] {

    const DocumentSubmenu = () => (<></>);

    const EditSubmenu = () => (<>
        <Menus.Command commandId='global.undo' />
        <Menus.Command commandId='global.redo' />
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