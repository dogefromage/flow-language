import { PayloadAction, PrepareAction, createAction } from "@reduxjs/toolkit";

export interface UndoRecord {
    desc: String;
    actionToken?: string;
    doNotRecord?: boolean;
}

export const MAX_LENGTH = 100;

export interface UndoHistory<T> {
    past: T[];
    present: T;
    future: T[];
    lastRecord?: UndoRecord;
}

type UndoPayload = { undo: UndoRecord };

export type UndoAction<P extends {} = {}> = PayloadAction<P & UndoPayload>;

export function createUndoAction<P extends object, T extends string = string>(type: T) {
    return createAction<P & UndoPayload, T>(type)
}