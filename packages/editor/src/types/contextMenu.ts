import { CommandParameterMap } from "./commands";
import { Vec2 } from "./utils";

export interface ContextMenuState {
    panelId: string;
    name: string;
    position: Vec2;
    commandIds: string[];
    paramMap: CommandParameterMap;
}

export type ContextMenuSliceState = { contextMenu: ContextMenuState | null };
