import React from 'react';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/common';
import { ViewProps } from '../types';
import PanelBody from './PanelBody';
import FlowInspectorContent from './FlowInspectorContent';

const FlowInspectorView = (viewProps: ViewProps) => {

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Inspector</PanelHeadingH>
            </PanelHeaderDiv>
            <FlowInspectorContent />
        </PanelBody>
    );
}

export default FlowInspectorView;