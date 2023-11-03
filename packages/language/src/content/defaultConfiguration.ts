import { LanguageConfiguration } from "../types/configuration";
import { standardModule } from "./standardModule";

export const defaultConfiguration: LanguageConfiguration = {
    modules: [
        standardModule,
    ]
}