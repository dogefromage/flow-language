import { Reducer } from "@reduxjs/toolkit";
import React from 'react';
import { Command, PanelState } from ".";
import { RootState } from "../redux/rootReducer";
import * as lang from 'noodle-language';
import { assert } from "../utils";

export interface EditorConfig {
    // state
    customReducers: Record<string, Reducer>;
    panelReducers: Record<string, Reducer<Record<string, PanelState>>>
    debug: {
        reduxLogger: boolean;
    }
    commands: Record<string, Command>;
    toolbar: {
        inlineMenus: [string, React.FC][];
        widgetsCenter: React.FC[];
        widgetsRight: React.FC[];
    }
    managerComponents: React.FC[];
    language: {
        validator: lang.LanguageValidator;
    }
    defaultDocument: lang.FlowDocument;
}

export type EditorExtension = (config: EditorConfig) => void;

export const createExtensionSelector = <S extends any>(extensionId: string) => {
    return (state: RootState) => {
        const s = state as any;
        assert(s.extensions, 'Could not find extensions slice.');
        return s.extensions[extensionId] as S;
    }
}