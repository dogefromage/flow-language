import React from 'react';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/common';
import { ViewProps, ViewTypes } from '../types';
import PanelBody from './PanelBody';
import FlowInspectorContent from './FlowInspectorContent';
import { useBindPanelState } from '../utils/panelManager';
import { createFlowInspectorPanelState } from '../slices/panelFlowInspectorSlice';

const FlowInspectorView = (viewProps: ViewProps) => {
    useBindPanelState(
        viewProps.panelId,
        createFlowInspectorPanelState,
        ViewTypes.FlowInspector,
    );

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Inspector</PanelHeadingH>
            </PanelHeaderDiv>
            {/* <FlowInspectorContent panelId={viewProps.panelId} /> */}
        </PanelBody>
    );
}

export default FlowInspectorView;