import { createEditor, content } from '@noodles/editor';
import { userExtension } from './extensions/userExtension';
import { storageExtension } from './extensions/storageExtension';
import { createLanguageValidator } from '@noodles/language';

export function getConfiguratedEditor() {
    const config = content.getDefaultEditorConfig();

    // config.debug.reduxLogger = true;

    // config.storage = new AppEditorStorage();

    // config.language.validator = createLanguageValidator({ modules: [] });

    userExtension(config);
    storageExtension(config);

    return createEditor(config);
}
