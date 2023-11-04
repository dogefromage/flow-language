import * as lang from '@noodles/language';

export const languageConfig: lang.LanguageConfiguration = lang.content.defaultConfiguration;

export const languageValidator = lang.createLanguageValidator(languageConfig);