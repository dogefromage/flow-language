import Menus from "../components/Menus";
import { EditorConfig } from "../types/config";
import { defaultCommands } from "./commands/defaultCommands";
import * as lang from '@noodles/language';

function getDefaultCommandMap() {
    return Object.fromEntries(
        defaultCommands.map(c => ([c.id, c]))
    );
}

function getDefaultToolbar(): EditorConfig['toolbar'] {

    const DocumentSubmenu = () => (
        <Menus.Command commandId='global.export_document' />
    );
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
        debug: {
            reduxLogger: false,
        },
        commands: getDefaultCommandMap(),
        stateReducers: {},
        toolbar: getDefaultToolbar(),
        managerComponents: [],
        language: {
            validator: lang.createLanguageValidator(lang.content.defaultConfiguration),
        }
    };
}