import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../redux/store";
import { ContextMenuSliceState, ContextMenuState } from "../types";

const initialState: ContextMenuSliceState = { contextMenu: null };

export const contextMenuSlice = createSlice({
    name: 'contextMenu',
    initialState,
    reducers: {
        open: (s, a: PayloadAction<{ contextMenu: ContextMenuState }>) => {
            s.contextMenu = a.payload.contextMenu;
        },
        close: s => {
            s.contextMenu = null;
        }
    }
});

export const {
    open: contextMenuOpen,
    close: contextMenuClose,
} = contextMenuSlice.actions;

export const selectContextMenu = (state: RootState) => state.contextMenu;

const contextMenuReducer = contextMenuSlice.reducer;

export default contextMenuReducer;