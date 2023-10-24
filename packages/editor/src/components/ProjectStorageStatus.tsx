import { PropsWithChildren } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectProjectStorage } from '../slices/projectStorageSlice';
import MaterialSymbol from '../styles/MaterialSymbol';
import { ToolTipAnchor, ToolTipContentComponent, ToolTipSectionDiv } from './ToolTip';

interface ProjectStorageStatusProps {

}

const defaultIcons = {
    'error': 'error',
    'loading': 'sync',
    'okay': 'check',
}
const defaultMessages = {
    'error': 'Unknown error.',
    'loading': 'Loading...',
    'okay': 'Everything is okay.',
}

const ProjectStorageStatus = ({}: PropsWithChildren<ProjectStorageStatusProps>) => {
    const projectStorage = useAppSelector(selectProjectStorage);
    let { type, icon, msg } = projectStorage.status;
    icon ||= defaultIcons[type];
    msg ||= defaultMessages[type];

    const StorageStatusTooltip: ToolTipContentComponent = () => (
        <ToolTipSectionDiv>
            <p>{ msg }</p>
        </ToolTipSectionDiv>
    )

    return (
        <div className="status">
            <ToolTipAnchor tooltip={StorageStatusTooltip}>
                <MaterialSymbol $cursor='pointer' $spin={icon == 'sync'}>{icon}</MaterialSymbol>
            </ToolTipAnchor>
        </div>
    );
}

export default ProjectStorageStatus;