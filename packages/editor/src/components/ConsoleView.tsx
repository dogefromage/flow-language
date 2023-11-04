import { PanelHeaderDiv, PanelHeadingH } from '../styles/panels';
import { ViewProps } from '../types';
import ConsoleLines from './ConsoleLines';
import PanelBody from './PanelBody';

const ConsoleView = (viewProps: ViewProps) => {
    
    return (
        <PanelBody viewProps={viewProps}>
            <PanelHeaderDiv>
                <PanelHeadingH>Console</PanelHeadingH>
            </PanelHeaderDiv>
            <ConsoleLines />
        </PanelBody>
    );
}

export default ConsoleView;