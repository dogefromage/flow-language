import React, { PropsWithChildren } from 'react';
import PanelBody from './PanelBody';
import { ViewProps } from '../types';
import { PanelHeading } from '../styles/common';

const FlowInspectorView = (viewProps: ViewProps) => {

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeading>Inspector</PanelHeading>
        </PanelBody>
    );
}

export default FlowInspectorView;