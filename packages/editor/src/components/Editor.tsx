import { DragzonePortalMount } from '@noodles/interactive';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { initStore } from '../redux/store';
import defaultTheme from '../styles/defaultTheme';
import GlobalStyle from '../styles/globalStyles';
import { EditorConfig } from '../types';
import ContextMenu from './ContextMenu';
import KeyboardCommandListener from './KeyboardCommandListener';
import LayoutRoot from './LayoutRoot';
import ManagerManager from './ManagerManager';

export function createEditor(config: EditorConfig) {

    const store = initStore(config);

    return () => {
        return (<>
            {/* icons */}
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            {/* fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap" rel="stylesheet" />
    
            <Provider store={store}>
                <GlobalStyle />
                <ThemeProvider theme={defaultTheme}>
                    <LayoutRoot />
                    <KeyboardCommandListener />
                    <ContextMenu />
                    <DragzonePortalMount />
                    <div id='menu-portal-mount' />
                    <div id="tool-tip-portal-mount" />
                </ThemeProvider>
                <ManagerManager />
            </Provider>
        </>);
    }
}
