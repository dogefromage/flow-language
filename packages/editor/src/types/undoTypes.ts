import { PayloadAction } from "@reduxjs/toolkit";

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

export type UndoAction<P extends {} = {}> = PayloadAction<P & {
    undo: UndoRecord;
}>;