import { createEditor, content } from '@noodles/editor';
import { userExtension } from './extensions/userExtension';
import { AppEditorStorage } from './appStorage';

export function getConfiguratedEditor() {
    const config = content.getDefaultEditorConfig();

    config.storage = new AppEditorStorage();

    userExtension(config);

    return createEditor(config);
}

