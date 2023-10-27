import Emittery from "emittery";

export interface ProjectFileLocation {
    channel: string; // eg. disk, cloud
    projectId: string;
}
export interface ProjectFileData {
    name: string;
    readonly: boolean;
    documentJson: string;
}
export interface ProjectFile {
    location: ProjectFileLocation;
    data: ProjectFileData;
}

export type EditorStorageResponse<D> = {
    data: D;
    error?: { message: string };
}

export abstract class EditorStorage extends Emittery<{
    reset: never;
}> {
    abstract loadInitial():
        Promise<EditorStorageResponse<{ file: ProjectFile | null }>>;

    /**
     *  Returns data at file path if existent (eg. for opening last opened project), can return error message
     */
    abstract load(path: ProjectFileLocation):
        Promise<EditorStorageResponse<{ file: ProjectFile | null }>>;

    /**
     *  returns new file path if successful otherwise null and error msg
     */
    abstract saveNewLocation(data: ProjectFileData): 
        Promise<EditorStorageResponse<{ file: ProjectFile | null }>>;

    /**
     *  saves, can return error message
     */
    abstract save(path: ProjectFileLocation, data: ProjectFileData): 
        Promise<EditorStorageResponse<{ success: boolean }>>;
}

export type ProjectStorageStatus = 
    | { type: 'okay',    icon?: string, msg?: string }
    | { type: 'loading', icon?: string, msg?: string }
    | { type: 'error',   icon?: string, msg?: string }

export interface ProjectStorageSliceState {
    storage: EditorStorage | null;
    activeFile: ProjectFile | null;
    status: ProjectStorageStatus;
}