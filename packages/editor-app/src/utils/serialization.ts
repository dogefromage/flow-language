import { EditorDocumentState, except } from "@noodles/editor";
import { ProjectFileData } from "../types/storage";

export function documentStateToFileData(document: EditorDocumentState) {
    try {
        const documentJson = JSON.stringify(document);

        const data: ProjectFileData = {
            title: document.header.title,
            description: document.header.description,
            documentJson,
        }
        return data;
    }
    catch (e) {
        console.error(e);
        except('An error occured during serialization of document state.');
    }
}

export function fileDataToDocumentState(fileData: ProjectFileData) {
    try {
        const doc: EditorDocumentState = JSON.parse(fileData.documentJson);
        doc.header = {
            title: fileData.title || 'Unnamed project',
            description: fileData.description || '',
        };
        return doc;
    }
    catch (e) {
        console.error(e);
        except('An error occured during parsing of project data.');
    }
}
