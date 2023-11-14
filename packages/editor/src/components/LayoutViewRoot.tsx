import React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import FlowEditorView from './FlowEditorView';
import FlowInspectorView from './FlowInspectorView';
import PageOutlinerView from './PageOutlinerView';
import ConsoleView from './ConsoleView';
import { ViewTypes } from '../types';

const LayoutViewRoot = () => {
    return (
        <ReflexContainer orientation='vertical' style={{
            overflow: 'hidden',
        }}>
            <ReflexElement minSize={200} flex={1}>
                <PageOutlinerView panelId={'outliner'} viewType={ViewTypes.PageOutliner}/>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement flex={5}>
                <ReflexContainer orientation='horizontal'>
                    <ReflexElement>
                        <FlowEditorView panelId={'editor'} viewType={ViewTypes.FlowEditor} />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement minSize={200} size={250}>
                        <ConsoleView panelId={'console'} viewType={ViewTypes.Console}/>
                    </ReflexElement>
                </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement minSize={250}  flex={2}>
                <FlowInspectorView panelId={'inspector'} viewType={ViewTypes.FlowInspector} />
            </ReflexElement>
        </ReflexContainer>
    );
}

export default LayoutViewRoot;