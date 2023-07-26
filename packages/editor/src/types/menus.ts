import React from "react";
import { Vec2 } from "./utils";

export type MenuElementTypes = 'expand' | 'command' | 'button' | 'search' | 'title' | 'color';

export type BaseMenuElement<T extends MenuElementTypes> = {
    type: T;
    key: string;
    name: string;
    tabIndex?: number;
}

export interface ExpandMenuElement extends BaseMenuElement<'expand'> {
    sublist: FloatingMenuShape;
}

export interface CommandMenuElement extends BaseMenuElement<'command'> {
    command: string;
}

export interface ButtonMenuElement extends BaseMenuElement<'button'> {
    onClick: (e: React.MouseEvent) => void;
}

export interface SearchMenuElement extends BaseMenuElement<'search'> {
    placeholder: string;
    autofocus: boolean;
}

export interface TitleMenuElement extends BaseMenuElement<'title'> {
    color?: string;
}

export interface ColorMenuElement extends BaseMenuElement<'color'> {}

export type MenuElement =
    | ExpandMenuElement
    | CommandMenuElement
    | ButtonMenuElement
    | SearchMenuElement
    | TitleMenuElement
    | ColorMenuElement

export interface InlineMenuShape {
    type: 'inline';
    list: ExpandMenuElement[];
}

export interface FloatingMenuShape {
    type: 'floating';
    list: MenuElement[];
}

export type MenuShape = InlineMenuShape | FloatingMenuShape

export interface MenuStackNode {
    key: string;
    leftAnchor: Vec2;
    parentWidth: number;
}

export type MenuTypes = 'toolbar' | 'context' | 'misc';

export interface MenuState {
    id: string;
    type: MenuTypes;
    nodeStack: MenuStackNode[];
    isClosed: boolean;
    state: Map<string, any>;
}

export type MenusSliceState = Record<string, MenuState>;