import { PropsWithChildren } from 'react';
import { createFlowOutlinerPanelState } from '../slices/panelFlowOutlinerSlice';
import { FLOW_OUTLINER_VIEW_TYPE, ViewProps } from '../types';
import { useBindPanelState } from '../utils/panelManager';
import FlowOutlinerList from './FlowOutlinerList';
import PanelBody from './PanelBody';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/panels';

const FlowOutlinerView = (viewProps: PropsWithChildren<ViewProps>) => {
    const { panelId } = viewProps;

    useBindPanelState(
        panelId,
        createFlowOutlinerPanelState,
        FLOW_OUTLINER_VIEW_TYPE,
    );

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Outliner</PanelHeadingH>
            </PanelHeaderDiv>
            <FlowOutlinerList panelId={panelId} />
        </PanelBody>
    );
}

export default FlowOutlinerView;