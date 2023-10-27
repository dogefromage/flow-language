import { EditorConfig } from "../types/config";
import { defaultCommands } from "./commands/defaultCommands";
import { defaultToolbarInlineMenus } from './defaultToolbar';

const defaultCommandMap = Object.fromEntries(
    defaultCommands.map(c => ([ c.id, c ]))
);

export function getDefaultEditorConfig(): EditorConfig {
    return {
        debug: {},
        commands: {
            ...defaultCommandMap,
        },
        stateReducers: {},
        toolbarInlineMenuComponents: [
            ...defaultToolbarInlineMenus,
        ],
        toolbarWidgetComponents: [],
        managerComponents: [],
        storage: null,
    };
}
