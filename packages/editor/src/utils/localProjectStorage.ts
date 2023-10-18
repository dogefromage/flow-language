import { deserializeProject, serializeProject } from "./serialization";

const PROJECT_KEY = 'project';

export function getAndDeserializeLocalProject() {
    const stored = localStorage.getItem(PROJECT_KEY);
    return deserializeProject(stored)
}

export function serializeAndStoreProjectLocally(project: any) {
    const projectJson = serializeProject(project);
    if (projectJson != null) {
        localStorage.setItem(PROJECT_KEY, projectJson);
    }
}