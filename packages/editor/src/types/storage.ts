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
export interface ProjectFilePair {
    location: ProjectFileLocation;
    data: ProjectFileData;
}

export type EditorStorageResponse<D = boolean> = {
    data?: D;
    error?: { message: string };
}

export abstract class EditorStorage extends Emittery<{
    // open: ProjectFilePair;
}> {
    abstract loadInitial():
        Promise<EditorStorageResponse<ProjectFilePair | null>>;

    /**
     *  Returns data at file path if existent (eg. for opening last opened project), can return error message
     */
    abstract load(path: ProjectFileLocation):
        Promise<EditorStorageResponse<ProjectFilePair | null>>;

    /**
     *  returns new file path if successful otherwise null and error msg
     */
    abstract saveNewLocation(data: ProjectFileData): 
        Promise<EditorStorageResponse<ProjectFilePair | null>>;

    /**
     *  saves, can return error message
     */
    abstract save(path: ProjectFileLocation, data: ProjectFileData): 
        Promise<EditorStorageResponse>;
}

export type ProjectStorageStatus = 
    | { type: 'okay',    icon?: string, msg?: string }
    | { type: 'loading', icon?: string, msg?: string }
    | { type: 'error',   icon?: string, msg?: string }

export interface ProjectStorageSliceState {
    status: ProjectStorageStatus;
    storage: EditorStorage | null;
    location: ProjectFileLocation | null;
}
