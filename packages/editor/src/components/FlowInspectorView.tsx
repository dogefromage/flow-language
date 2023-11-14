import React from 'react';
import { ViewProps } from '../types';
import PanelBody from './PanelBody';
import FlowInspectorContent from './FlowInspectorContent';
import { useBindPanelState } from '../utils/panelManager';
import { createFlowInspectorPanelState } from '../slices/panelFlowInspectorSlice';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/panels';
import { FLOW_INSPECTOR_VIEW_TYPE } from '../types/flowInspectorView';

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