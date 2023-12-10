import { Vec2 } from "./utils";

export interface MenuStackNode {
    elementId: string;
    leftAnchor: Vec2;
    parentWidth: number;
}

export interface MenuState {
    id: string;
    nodeStack: MenuStackNode[];
    focusedPath: number[];
    isClosed: boolean;
    state: Map<string, any>;
}

export type MenusSliceState = Record<string, MenuState>;