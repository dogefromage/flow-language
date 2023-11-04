import { createEditor, content } from '@noodles/editor';
import { userExtension } from '../extensions/userExtension';
import { storageExtension } from '../extensions/storageExtension';
import { languageValidator } from './languageConfig';

export function getConfiguratedEditor() {
    const config = content.getDefaultEditorConfig();

    // config.debug.reduxLogger = true;

    config.language.validator = languageValidator;

    userExtension(config);
    storageExtension(config);

    return createEditor(config);
}
