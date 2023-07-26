import { Command, FloatingMenuShape } from "../types";

export default function generateContextMenuShape(commandList: Command[]) {
    const root: FloatingMenuShape = {
        type: 'floating',
        list: commandList.map(command => ({
            type: 'command',
            key: command.id,
            name: command.name,
            command: command.id,
        })),
    };
    return root;
}