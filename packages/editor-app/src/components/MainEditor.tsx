import { Editor, EditorConfig } from '@noodles/editor';
import { AppEditorStorage } from '../appStorage';

const appStorage = new AppEditorStorage();

const config: EditorConfig = {
    storage: appStorage,
}

const MainEditor = () => {
    return (
        <Editor config={config} />
    );
}

export default MainEditor;