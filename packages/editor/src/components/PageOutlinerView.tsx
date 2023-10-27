import { PropsWithChildren } from 'react';
import { createPageOutlinerPanelState } from '../slices/panelPageOutlinerSlice';
import { ViewProps, ViewTypes } from '../types';
import { useBindPanelState } from '../utils/panelManager';
import PageOutlinerList from './PageOutlinerList';
import PanelBody from './PanelBody';
import { PanelHeaderDiv, PanelHeadingH } from '../styles/panels';

const PageOutlinerView = (viewProps: PropsWithChildren<ViewProps>) => {
    const { panelId } = viewProps;

    useBindPanelState(
        panelId,
        createPageOutlinerPanelState,
        ViewTypes.PageOutliner,
    );

    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Outliner</PanelHeadingH>
            </PanelHeaderDiv>
            <PageOutlinerList panelId={panelId} />
        </PanelBody>
    );
}

export default PageOutlinerView;