import { createFlowInspectorPanelState } from '../slices/panelFlowInspectorSlice';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/panels';
import { FLOW_INSPECTOR_VIEW_TYPE, ViewProps } from '../types';
import { useBindPanelState } from '../utils/panelManager';
import FlowInspectorContent from './FlowInspectorContent';
import PanelBody from './PanelBody';

const FlowInspectorView = (viewProps: ViewProps) => {
    useBindPanelState(
        viewProps.panelId,
        createFlowInspectorPanelState,
        FLOW_INSPECTOR_VIEW_TYPE,
    );

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Inspector</PanelHeadingH>
            </PanelHeaderDiv>
            <FlowInspectorContent panelId={viewProps.panelId} />
        </PanelBody>
    );
}

export default FlowInspectorView;