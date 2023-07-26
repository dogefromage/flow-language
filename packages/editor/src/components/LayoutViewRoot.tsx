import React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import FlowEditorView from './FlowEditorView';
import FlowInspectorView from './FlowInspectorView';
import PageOutlinerView from './PageOutlinerView';

const LayoutViewRoot = () => {
    return (
        <ReflexContainer orientation='vertical'>
            <ReflexElement minSize={160} size={350}>
                <PageOutlinerView panelId={'outliner'} />
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
                <ReflexContainer orientation='horizontal'>
                    <ReflexElement>
                        <FlowEditorView panelId={'editor'} />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement minSize={200} size={300}>
                        <FlowInspectorView panelId={'inspector'} />
                    </ReflexElement>
                </ReflexContainer>
            </ReflexElement>
        </ReflexContainer>
    );
}

export default LayoutViewRoot;