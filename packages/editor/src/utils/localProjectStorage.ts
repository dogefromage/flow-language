import { jsonReplacer, jsonReviver } from "./serialization";

export function getAndDeserializeLocalProject() {
    const stored = getLocalProjectJson();
    if (stored != null) {
        try {
            return JSON.parse(stored, jsonReviver);
        } catch (e) {
            console.error(e);
        }
    }
}

export function serializeAndStoreProjectLocally(data: any) {
    try {
        const stateJSON = JSON.stringify(data, jsonReplacer);
        storeLocalProjectJson(stateJSON);
    } catch (e) {
        console.error(e);
    }
}

const PROJECT_KEY = 'project';
function getLocalProjectJson() {
    return localStorage.getItem(PROJECT_KEY);
}
function storeLocalProjectJson(json: string | null) {
    if (json) {
        localStorage.setItem(PROJECT_KEY, json);
    } else {
        localStorage.removeItem(PROJECT_KEY);
    }
}