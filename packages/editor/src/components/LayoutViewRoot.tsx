import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { FLOW_EDITOR_VIEW_TYPE, FLOW_OUTLINER_VIEW_TYPE } from '../types';
import { CONSOLE_VIEW_TYPE } from '../types/consoleView';
import { FLOW_INSPECTOR_VIEW_TYPE } from '../types/flowInspectorView';
import ConsoleView from './ConsoleView';
import FlowEditorView from './FlowEditorView';
import FlowInspectorView from './FlowInspectorView';
import FlowOutlinerView from './FlowOutlinerView';

const LayoutViewRoot = () => {
    return (
        <ReflexContainer orientation='vertical' style={{
            overflow: 'hidden',
        }}>
            <ReflexElement minSize={200} flex={1}>
                <FlowOutlinerView panelId={'outliner'} viewType={FLOW_OUTLINER_VIEW_TYPE}/>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement flex={5}>
                <ReflexContainer orientation='horizontal'>
                    <ReflexElement>
                        <FlowEditorView panelId={'editor'} viewType={FLOW_EDITOR_VIEW_TYPE} />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement minSize={200} size={250}>
                        <ConsoleView panelId={'console'} viewType={CONSOLE_VIEW_TYPE}/>
                    </ReflexElement>
                </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement minSize={250}  flex={2}>
                <FlowInspectorView panelId={'inspector'} viewType={FLOW_INSPECTOR_VIEW_TYPE} />
            </ReflexElement>
        </ReflexContainer>
    );
}

export default LayoutViewRoot;