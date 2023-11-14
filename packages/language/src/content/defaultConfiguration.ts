import { LanguageConfiguration } from "../types";
import { standardModule } from "./standardModule";

export const defaultConfiguration: LanguageConfiguration = {
    modules: [
        standardModule,
    ]
}