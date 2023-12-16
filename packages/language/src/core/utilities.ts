import { FlowDocument, LanguageValidator } from "../types";
import { LanguageConfiguration } from "../types/configuration";
import { validateDocument } from "./validation";

export function createLanguageValidator(config: LanguageConfiguration): LanguageValidator {
    return (document: FlowDocument) => 
        validateDocument(document, config);
}
