import { DragzonePortalMount } from '@fluss/interactive';
import { Store } from '@reduxjs/toolkit';
import React, { PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { initStore } from '../redux/store';
import defaultTheme from '../styles/defaultTheme';
import GlobalStyle from '../styles/globalStyles';
import ContextMenu from './ContextMenu';
import KeyboardCommandListener from './KeyboardCommandListener';
import LayoutRoot from './LayoutRoot';
import { MenuPortalMount } from './MenuPortalMount';
import Validator from './Validator';
import DocumentStreamer from './DocumentStreamer';

interface EditorProps {

}

const Editor = ({}: PropsWithChildren<EditorProps>) => {
    const [ store ] = useState<Store>(initStore);

    return (
        <Provider store={store}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            <Validator />
            <GlobalStyle />
            <ThemeProvider theme={defaultTheme}>
                <LayoutRoot />
                {/* USER INTERACTION */}
                <KeyboardCommandListener />
                <ContextMenu />
                {/* PORTAL MOUNTS */}
                <MenuPortalMount />
                <DragzonePortalMount />
                {/* DATA */}
                {/* <DocumentStreamer /> */}
            </ThemeProvider>
        </Provider>
    );
}

export default Editor;