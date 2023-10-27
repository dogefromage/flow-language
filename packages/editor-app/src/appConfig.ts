import { createEditor, content } from '@noodles/editor';
import { userExtension } from './extensions/userExtension';

export function getConfiguratedEditor() {
    const config = content.getDefaultEditorConfig();

    userExtension(config);

    return createEditor(config);
}

