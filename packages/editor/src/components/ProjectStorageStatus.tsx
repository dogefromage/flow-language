import { PropsWithChildren } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectProjectStorage } from '../slices/projectStorageSlice';
import ToolTip from './ToolTip';
import { MaterialSymbol } from '../styles/icons';

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

    const StorageStatusTooltip = () => (
        <ToolTip.SectionDiv>
            <p>{ msg }</p>
        </ToolTip.SectionDiv>
    )

    return (
        <div className="status">
            <ToolTip.Anchor tooltip={StorageStatusTooltip}>
                <MaterialSymbol $cursor='pointer' $spin={icon == 'sync'}>{icon}</MaterialSymbol>
            </ToolTip.Anchor>
        </div>
    );
}

export default ProjectStorageStatus;