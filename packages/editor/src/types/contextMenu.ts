import { CustomCommandParams } from "./commands";
import { Vec2 } from "./utils";

export interface ContextMenuState {
    panelId: string;
    name: string;
    clientCursor: Vec2;
    commandIds: string[];
    paramMap: CustomCommandParams;
}

export type ContextMenuSliceState = { contextMenu: ContextMenuState | null };
