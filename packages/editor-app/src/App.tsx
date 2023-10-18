import { Editor, EditorConfig } from '@noodles/editor';
import React, { useEffect, useState } from 'react';
import { CloudStorageChannel } from './storage';

const projectIdParam = new URL(window.location.toString())
    .searchParams
    .get('projectId');

const config: EditorConfig = {
    // defaultStorageChannel: 'cloud',
    storageChannels: {
        'cloud': new CloudStorageChannel(projectIdParam),
    }
}

const App = () => (
    <Editor config={config} />
);

export default App;