import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { EditorStorage, ProjectFileLocation, ProjectStorageSliceState, ProjectStorageStatus } from "../types/storage";
import { RootState } from "../redux/rootReducer";

const initialState: ProjectStorageSliceState = {
    status: { type: 'okay' },
    storage: null,
    location: null,
};

export const projectStorageSlice = createSlice({
    name: 'projectStorage',
    initialState,
    reducers: {
        setLocation: (s, a: PayloadAction<{ location: ProjectFileLocation | null }>) => {
            s.location = a.payload.location;
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
    setLocation: projectStorageSetLocation,
    setStorage: projectStorageSetStorage,
    setStatus: projectStorageSetStatus,
} = projectStorageSlice.actions;

export const selectProjectStorage = (state: RootState) => state.projectStorage;

const projectStorageReducer = projectStorageSlice.reducer;

export default projectStorageReducer;