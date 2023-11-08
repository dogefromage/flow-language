import { except } from "@noodles/editor";
import { ProjectFileData } from "../types/storage";
import * as lang from "@noodles/language";

export function documentStateToFileData(document: lang.FlowDocument) {
    try {
        const documentJson = JSON.stringify(document);

        const data: ProjectFileData = {
            title: document.title,
            description: document.description,
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
        const doc: lang.FlowDocument = JSON.parse(fileData.documentJson);
        doc.title = fileData.title || 'Unnamed project';
        doc.description = fileData.description || '';
        return doc;
    }
    catch (e) {
        console.error(e);
        except('An error occured during parsing of project data.');
    }
}
