import { MaterialSymbol, useAppSelector } from '@noodles/editor';
import { PropsWithChildren } from 'react';
import { selectStorage } from '../extensions/storageExtension';

interface ProjectStorageStatusProps {}

const ProjectStorageStatusIcon = ({ }: PropsWithChildren<ProjectStorageStatusProps>) => {
    const projectStorage = useAppSelector(selectStorage);

    if (projectStorage.activeFile.status === 'pending') {
        return <MaterialSymbol $spin>sync</MaterialSymbol>
    }

    return null;
}

export default ProjectStorageStatusIcon;