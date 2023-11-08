import { FlowDocument, FlowDocumentContext, LanguageValidator } from "../types";
import { LanguageConfiguration } from "../types/configuration";
import { validateDocument } from "./validateDocument";

export function createLanguageValidator(config: LanguageConfiguration): LanguageValidator {
    return (document: FlowDocument) => 
        validateDocument(document, config);
}


