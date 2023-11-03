import { EditorExtension, Menus, createExtensionSelector, documentReplace, except, makeGlobalCommand, selectDocument, useAppDispatch, useAppSelector } from "@noodles/editor";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { useEffect } from "react";
import ProjectSelectionDropdown from "../components/ProjectSelectionDropdown";
import { getSessionStrict, selectProjectById, selectUsersProjects, updateProjectTitleDescriptionData } from "../queries";
import { MinimalProject, ProjectFile, ProjectFileLocation, StorageSliceState } from "../types/storage";
import { takeSingle } from "../utils";
import { documentStateToFileData, fileDataToDocumentState } from "../utils/serialization";
import { supabase } from "../supabase";
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

const storageLoadFile = createAsyncThunk(
    'storage/loadFile',
    async (args: { location: ProjectFileLocation }) => {
        const { location } = args;
        const session = await getSessionStrict();

        const projectByIdRes = await selectProjectById(location.projectId);
        if (projectByIdRes.error) {
            except(`Could not fetch project (location=${JSON.stringify(location)}).`);
        }

        const project = projectByIdRes.data;

        const creator = takeSingle(project.creator);
        const writePermission = session.user.id === creator.id;

        const file: ProjectFile = {
            location: getCloudProjectLocation(project),
            data: {
                title: project.title!,
                description: project.description!,
                documentJson: project.project_data,
            },
            writePermission,
        };
        return { file };
    }
);

const storageSaveActiveFile = createAsyncThunk(
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
        if (res.error) {
            console.error(res.error);
            except('Unable to save active project.');
        }

        // pass file on without changing
        return { file };
    }
)

const storageLoadUsersProjects = createAsyncThunk<{ userProjects: MinimalProject[] | null }>(
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
    reducers: {},
    extraReducers(builder) {

        builder.addCase(storageLoadFile.pending, s => {
            s.activeFile.status = 'pending';
        });
        builder.addCase(storageLoadFile.rejected, s => {
            s.activeFile.status = 'failed';
        });
        builder.addCase(storageLoadFile.fulfilled, (s, a) => {
            s.activeFile.status = 'idle';
            s.activeFile.data = a.payload.file;
        });


        builder.addCase(storageSaveActiveFile.pending, (s, a) => {
            s.activeFile.status = 'pending';
        });
        builder.addCase(storageSaveActiveFile.rejected, s => {
            s.activeFile.status = 'failed';
        });
        builder.addCase(storageSaveActiveFile.fulfilled, (s, a) => {
            s.activeFile.status = 'idle';
            s.activeFile.data = a.payload.file;
        });


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

const extensionId = 'storage';
const saveCommand = `${extensionId}.save`;

export const selectStorage = createExtensionSelector<StorageSliceState>(extensionId);

export const storageExtension: EditorExtension = config => {
    // add user state
    config.stateReducers[extensionId] = storageSlice.reducer;

    config.commands[saveCommand] = makeGlobalCommand(
        saveCommand,
        'Save Project',
        ({ appState }) => {
            const storage = selectStorage(appState);
            if (storage.activeFile.status != 'idle') {
                console.log('cannot save bc not idle');
                return;
            }
            const activeFile = storage.activeFile.data;
            if (activeFile == null) {
                except('Implement saving newly created file!');
            }

            const document = selectDocument(appState);
            const projectData = documentStateToFileData(document);

            const file: ProjectFile = {
                ...activeFile,
                data: projectData,
            };
            return storageSaveActiveFile({ file });
        },
        [{ ctrlKey: true, key: 's' }],
    );

    // {
    //     id: 'global.export_document',
    //     name: "Export Document",
    //     scope: 'global',
    //     actionCreator: ({ appState }) => {
    //         const doc = selectDocument(appState);
    //         const jsonProject = serializeProject(doc);
    //         const fileName = 'document.noodles';
    //         if (jsonProject) {
    //             download(jsonProject, 'application/json', fileName);
    //         } else {
    //             console.error(`No Project found.`);
    //         }
    //     }
    // },


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
    }, [ userId ]); // change in authentication should reload file

    useEffect(() => {
        if (storage.activeFile.data != null) {
            const documentState = fileDataToDocumentState(storage.activeFile.data.data);
            dispatch(documentReplace({ document: documentState }));
        }
    }, [storage.activeFile.data]);

    return null;
}