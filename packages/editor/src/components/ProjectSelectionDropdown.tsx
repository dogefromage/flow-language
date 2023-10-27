import { PropsWithChildren, useMemo } from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectProjectStorage } from '../slices/projectStorageSlice';
import { ProjectFileLocation, ProjectFile } from '../types';
import FormSelectOption from './FormSelectOption';
import ProjectStorageStatus from './ProjectStorageStatus';
import styled from 'styled-components';

const ProjectSelectionDiv = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;

    .status {
        height: 24px;
    }
`;

interface ProjectSelectionDropdownProps {}

const ProjectSelectionDropdown = ({}: PropsWithChildren<ProjectSelectionDropdownProps>) => {
    const projectStorage = useAppSelector(selectProjectStorage);

    const locationKey = projectStorage.activeFile ?
        getLocationKey(projectStorage.activeFile.location) : 'blank';

    const { options, names } = useMemo(() => {
        if (locationKey === 'blank') {
            return {
                options: ['blank'],
                names: { 'blank': 'Blank Project (unsaved)' },
            };
        }
        const options = [locationKey];
        const names = { [locationKey]: formatProjectFileName(projectStorage.activeFile) };
        return {
            options,
            names,
        };
    }, [locationKey, projectStorage]);

    return (
        <ProjectSelectionDiv>
            <FormSelectOption
                centerValue
                value={locationKey}
                options={options}
                mapName={names}
            />
            <ProjectStorageStatus />
        </ProjectSelectionDiv>
    );
}

export default ProjectSelectionDropdown;

function getLocationKey(location: ProjectFileLocation) {
    return location.channel + ":" + location.projectId;
}

function formatProjectFileName(file: ProjectFile | null) {
    if (file == null) {
        return `Unsaved Project`;
    }
    const baseName = `[${file.location.channel}] ${file.data.name}`;
    if (file.data.readonly) {
        return baseName + ' (readonly)';
    }
    return baseName;
}