import { EditorExtension, Menus, consolePushLine, content, createConsoleError, createExtensionSelector, documentReplace, editorSetActiveFlow, except, makeGlobalCommand, selectDocument, useAppDispatch, useAppSelector } from "@noodles/editor";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import ProjectSelectionDropdown from "../components/ProjectSelectionDropdown";
import { createProject, selectProjectById, selectUsersProjects, updateProjectTitleDescriptionData } from "../queries";
import { supabase } from "../config/supabase";
import { DetailedProject, MinimalProject, ProjectFile, ProjectFileData, ProjectFileLocation, StorageSliceState } from "../types/storage";
import { takeSingle } from "../utils/utils";
import { documentStateToFileData, fileDataToDocumentState } from "../utils/serialization";
import { selectUser } from "./userExtension";

const initialState: StorageSliceState = {
    activeFile: {
        data: null,
        status: 'idle',
    },
    usersProjects: {
        data: null,
        status: 'idle',
    },
};

export function getCloudProjectLocation(project: {
    id: string,
    creator: { id: string, username: string }[],
}): ProjectFileLocation {
    const creator = takeSingle(project.creator);
    const username = creator.username || '[Deleted]';
    return {
        channel: `cloud@${username}`,
        projectId: project.id,
    }
}

function buildFile(data: DetailedProject, userId: string) {
    const creator = takeSingle(data.creator);
    const writePermission = userId === creator.id;
    const file: ProjectFile = {
        location: getCloudProjectLocation(data),
        data: {
            title: data.title!,
            description: data.description!,
            documentJson: data.project_data,
        },
        writePermission,
    };
    return file;
}

export const storageLoadFile = createAsyncThunk(
    'storage/loadFile',
    async (args: { location: ProjectFileLocation }) => {
        const { location } = args;
        const session = await supabase.auth.getSession();

        const projectByIdRes = await selectProjectById(location.projectId);
        if (projectByIdRes.error) {
            except(`Could not fetch project (location=${JSON.stringify(location)}).`);
        }

        const file = buildFile(projectByIdRes.data, session.data.session?.user.id || '');
        return { file };
    }
);

export const storageCreateFile = createAsyncThunk(
    'storage/createFile',
    async (args: { data: ProjectFileData }) => {
        const { data } = args;
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
            except('You must be logged in to save a project.');
        }
        const userId = session.data.session.user.id;

        const res = await createProject({
            title: data.title,
            description: data.description,
            project_data: data.documentJson,
            creator: userId,
        });
        if (res.data == null) {
            except(`Could not save project.`);
        }
        const file = buildFile(res.data, session.data.session?.user.id || '');
        return { file };
    }
)

export const storageSaveActiveFile = createAsyncThunk(
    'storage/saveActiveFile',
    async (args: { file: ProjectFile }) => {
        const { file } = args;

        const projectId = file.location.projectId;

        type UpdateProps = Parameters<typeof updateProjectTitleDescriptionData>[1];
        const props: UpdateProps = {
            title: file.data.title,
            description: file.data.description,
            project_data: file.data.documentJson,
        };

        const res = await updateProjectTitleDescriptionData(projectId, props);
        if (res.count == 0) {
            except('Unable to save active project.');
        }

        // pass file on without changing
        return { file };
    }
)

export const storageLoadUsersProjects = createAsyncThunk<{ userProjects: MinimalProject[] | null }>(
    'storage/loadUsersProjects',
    async () => {
        const sessRes = await supabase.auth.getSession();
        const session = sessRes.data.session;
        if (!session) {
            return { userProjects: null };
        }
        const userProjectsRes = await selectUsersProjects(session.user.id);
        if (userProjectsRes.error) {
            except('Could not select user projects.');
        }
        return { userProjects: userProjectsRes.data };
    },
);

const storageSlice = createSlice({
    name: 'storage',
    initialState,
    reducers: {
        dropActiveFile: s => {
            s.activeFile = {
                status: 'idle',
                data: null,
            };
        },
    },
    extraReducers(builder) {

        for (const fileThunk of [
            storageLoadFile,
            storageSaveActiveFile,
            storageCreateFile,
        ]) {
            builder.addCase(fileThunk.pending, s => {
                s.activeFile.status = 'pending';
            });
            builder.addCase(fileThunk.rejected, s => {
                s.activeFile.status = 'failed';
            });
            builder.addCase(fileThunk.fulfilled, (s, a) => {
                s.activeFile.status = 'idle';
                s.activeFile.data = a.payload.file;
            });
        }

        builder.addCase(storageLoadUsersProjects.pending, s => {
            s.usersProjects.status = 'pending';
        });
        builder.addCase(storageLoadUsersProjects.rejected, s => {
            s.usersProjects.status = 'failed';
        });
        builder.addCase(storageLoadUsersProjects.fulfilled, (s, a) => {
            s.usersProjects = {
                status: 'idle',
                data: a.payload.userProjects,
            }
        });
    },
});

export const {
    dropActiveFile: storageDropActiveFile,
} = storageSlice.actions;

const extensionId = 'storage';
const saveCommand = `${extensionId}.save`;
const exportCommand = `${extensionId}.export`;
const blankProjectCommand = `${extensionId}.createBlankProject`;

export const selectStorage = createExtensionSelector<StorageSliceState>(extensionId);

export const storageExtension: EditorExtension = config => {
    // add user state
    config.stateReducers[extensionId] = storageSlice.reducer;

    config.commands[saveCommand] = makeGlobalCommand(
        saveCommand,
        'Save Project',
        ({ appState }) => {
            const storage = selectStorage(appState);
            if (storage.activeFile.status == 'pending') {
                return;
            }

            const document = selectDocument(appState);
            const projectData = documentStateToFileData(document);

            const activeFile = storage.activeFile.data;
            if (activeFile == null) {
                return storageCreateFile({ data: projectData });
            }

            const file: ProjectFile = {
                ...activeFile,
                data: projectData,
            };
            return storageSaveActiveFile({ file });
        },
        [{ ctrlKey: true, key: 's' }],
    );

    config.commands[exportCommand] = makeGlobalCommand(
        exportCommand,
        'Export Document',
        ({ appState }) => {
            alert('implement');
            // const doc = selectDocument(appState);
            // const fileData = documentStateToFileData(doc);

            // const fileName = 'document.noodles';
            // if (jsonProject) {
            //     download(jsonProject, 'application/json', fileName);
            // } else {
            //     console.error(`No Project found.`);
            // }
        }
    );

    config.commands[blankProjectCommand] = makeGlobalCommand(
        blankProjectCommand,
        'Create Blank Project',
        ({}) => {
            return [
                storageDropActiveFile(),
                documentReplace({ document: content.defaultDocument }),
            ]
        }
    )

    config.managerComponents.push(InitialLoader);
    config.toolbar.widgetsCenter.push(ProjectSelectionDropdown);
    config.toolbar.inlineMenus.push(['Document', StorageCommandsMenu]);
}

const StorageCommandsMenu = () => {
    const dispatch = useAppDispatch();
    const { usersProjects } = useAppSelector(selectStorage);

    useEffect(() => {
        if (usersProjects.data == null) {
            dispatch(storageLoadUsersProjects());
        }
    }, []);

    function loadProject(project: MinimalProject) {
        const location = getCloudProjectLocation(project);
        dispatch(storageLoadFile({ location }));
    }

    return (<>
        <Menus.Command commandId={blankProjectCommand} />
        <Menus.Expand name="Load User Project"> {
            usersProjects.status === 'pending' ? (
                <Menus.Text text='Loading...' />
            ) :
                usersProjects.status === 'failed' ? (
                    <Menus.Text text='Could not load projects.' />
                ) : (
                    usersProjects.data?.length ? (
                        usersProjects.data.map(project =>
                            <Menus.Button key={project.id} name={project.title}
                                onPush={() => loadProject(project)} />
                        )
                    ) : (
                        <Menus.Text text='No projects found.' />
                    )
                )
        }
        </Menus.Expand>
        <Menus.Command commandId={saveCommand} />
        <Menus.Command commandId={exportCommand} />
    </>);
}

const InitialLoader = () => {
    const dispatch = useAppDispatch();
    const storage = useAppSelector(selectStorage);
    const { user } = useAppSelector(selectUser);
    const userId = user.data?.id;

    useEffect(() => {
        const projectIdFromUrl = new URL(window.location.toString())
            .searchParams
            .get('projectId');
        if (!projectIdFromUrl) {
            return;
        }
        const location = { channel: 'cloud', projectId: projectIdFromUrl };
        dispatch(storageLoadFile({ location }));
    }, [userId]); // change in authentication should reload file

    useEffect(() => {
        if (storage.activeFile.data != null) {
            try {
                const documentState = fileDataToDocumentState(storage.activeFile.data.data);
                dispatch(documentReplace({ document: documentState }));
            } catch (e: any) {
                console.error(e);
                dispatch(createConsoleError(Error(`Failed to deserialize project.`)));
            }
        }
    }, [storage.activeFile.data]);

    return null;
}