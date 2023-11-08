import React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import FlowEditorView from './FlowEditorView';
import FlowInspectorView from './FlowInspectorView';
import PageOutlinerView from './PageOutlinerView';
import ConsoleView from './ConsoleView';

const LayoutViewRoot = () => {
    return (
        <ReflexContainer orientation='vertical' style={{
            overflow: 'hidden',
        }}>
            <ReflexElement minSize={200} flex={1}>
                <PageOutlinerView panelId={'outliner'} />
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement flex={5}>
                <ReflexContainer orientation='horizontal'>
                    <ReflexElement>
                        <FlowEditorView panelId={'editor'} />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement minSize={200} size={250}>
                        <ConsoleView panelId={'console'} />
                    </ReflexElement>
                </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement minSize={250}  flex={2}>
                <FlowInspectorView panelId={'inspector'} />
            </ReflexElement>
        </ReflexContainer>
    );
}

export default LayoutViewRoot;