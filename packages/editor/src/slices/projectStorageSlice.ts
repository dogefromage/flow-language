import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../redux/rootReducer";
import { EditorStorage, ProjectFile, ProjectStorageSliceState, ProjectStorageStatus } from "../types/storage";

const initialState: ProjectStorageSliceState = {
    status: { type: 'okay' },
    storage: null,
    activeFile: null,
};

export const projectStorageSlice = createSlice({
    name: 'projectStorage',
    initialState,
    reducers: {
        setActiveFile: (s, a: PayloadAction<{ file: ProjectFile | null }>) => {
            s.activeFile = a.payload.file;
        },
        setStorage: (s, a: PayloadAction<{ storage: EditorStorage | null }>) => {
            s.storage = a.payload.storage;
        },
        setStatus: (s, a: PayloadAction<{ status: ProjectStorageStatus }>) => {
            s.status = a.payload.status;
        },
    }
});

export const {
    setActiveFile: projectStorageSetActiveFile,
    setStorage: projectStorageSetStorage,
    setStatus: projectStorageSetStatus,
} = projectStorageSlice.actions;

export const selectProjectStorage = (state: RootState) => state.projectStorage;

const projectStorageReducer = projectStorageSlice.reducer;

export default projectStorageReducer;