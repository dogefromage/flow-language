import { useAppSelector } from "@noodles/editor";
import FormSelectOption from "@noodles/editor/lib/components/FormSelectOption";
import { PropsWithChildren, useMemo } from "react";
import styled from "styled-components";
import { selectStorage } from "../extensions/storageExtension";
import { ProjectFileLocation, ProjectFile } from "../types/storage";
import ProjectStorageStatusIcon from "./ProjectStorageStatusIcon";

const ProjectSelectionDiv = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;

    /* .status {
        height: 24px;
    } */
`;

interface ProjectSelectionDropdownProps {}

const ProjectSelectionDropdown = ({}: PropsWithChildren<ProjectSelectionDropdownProps>) => {
    const projectStorage = useAppSelector(selectStorage);

    const locationKey = projectStorage.activeFile.data ?
        getLocationKey(projectStorage.activeFile.data.location) : 'blank';

    const { options, names } = useMemo(() => {
        if (locationKey === 'blank') {
            return {
                options: ['blank'],
                names: { 'blank': 'Blank Project (unsaved)' },
            };
        }
        const options = [locationKey];
        const names = { [locationKey]: formatProjectFileName(projectStorage.activeFile.data) };
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
            <ProjectStorageStatusIcon />
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
    const baseName = `[${file.location.channel}] ${file.data.title}`;
    if (file.data.readonly) {
        return baseName + ' (readonly)';
    }
    return baseName;
}