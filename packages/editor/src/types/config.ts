import { Reducer } from "@reduxjs/toolkit";
import React from 'react';
import { Command, EditorStorage } from ".";
import { RootState } from "../redux/rootReducer";
import { assertDef } from "@noodles/language";

export interface EditorConfig {
    debug?: {
        reduxLogger?: boolean;
    }
    stateReducers: Record<string, Reducer>;
    commands: Record<string, Command>;
    toolbarInlineMenuComponents: React.FC[];
    toolbarWidgetComponents: React.FC[];
    managerComponents: React.FC[];
    storage: EditorStorage | null;
}

export type EditorExtension = (config: EditorConfig) => void;

export const createExtensionSelector = <S extends any>(extensionId: string) => {
    return (state: RootState) => {
        const s = state as any;
        assertDef(s.extensions, 'Could not find extensions slice.');
        return s.extensions[extensionId] as S;
    }
}