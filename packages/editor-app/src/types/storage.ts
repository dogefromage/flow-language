import { LoadingStatus } from "./utils";

export interface ProjectFileLocation {
    channel: string; // eg. disk, cloud
    projectId: string;
}
export interface ProjectFileData {
    title: string;
    description: string;
    documentJson: string;
}
export interface ProjectFile {
    location: ProjectFileLocation;
    data: ProjectFileData;
    writePermission: boolean;
}

export type MinimalProject = {
    id: any;
    title: any;
    description: any;
    creator: {
        id: any;
        username: any;
    }[];
}

export interface StorageSliceState {
    activeFile: {
        data: ProjectFile | null;
        status: LoadingStatus;
    }
    usersProjects: {
        data: MinimalProject[] | null;
        status: LoadingStatus;
    }
}
