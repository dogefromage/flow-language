import { PropsWithChildren, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { projectStorageSetActiveFile, projectStorageSetStatus, projectStorageSetStorage, selectProjectStorage } from '../slices/projectStorageSlice';
import { EditorStorage } from '../types/storage';
import { useLoadDocumentData } from '../utils/project';

interface EditorStorageManagerProps {
    storage: EditorStorage | null;
}

const abortedStatusAction = projectStorageSetStatus({
    status: { type: 'error', msg: 'Action was aborted.' },
});

const EditorStorageManager = ({ storage }: PropsWithChildren<EditorStorageManagerProps>) => {
    const dispatch = useAppDispatch();
    const loadDocumentData = useLoadDocumentData();

    async function initStorage(s: EditorStorage, as: AbortSignal) {
        dispatch(projectStorageSetStatus({
            status: { type: 'loading', msg: 'Loading initial data...' },
        }));

        const { data, error } = await s.loadInitial();

        if (as.aborted) {
            return dispatch(abortedStatusAction);
        }

        if (error != null) {
            dispatch(projectStorageSetStatus({
                status: { type: 'error', msg: `Error while loading initial: ${error.message}` },
            }));
            return;
        }

        if (data.file == null) {
            dispatch(projectStorageSetStatus({
                status: { type: 'okay', msg: 'Loaded default project.' },
            }));
            return;
        }

        // TODO: ask user about unsaved work

        dispatch(projectStorageSetActiveFile({ file: data.file }));
        loadDocumentData(data.file.data.documentJson);

        dispatch(projectStorageSetStatus({
            status: { type: 'okay', msg: 'Loaded project.' },
        }));
    }

    useEffect(() => {
        // update internal reference
        dispatch(projectStorageSetStorage({
            storage: storage || null,
        }));
        if (!storage) return;

        const ac = new AbortController();
        initStorage(storage, ac.signal);

        const resetStorage = () => {
            initStorage(storage, ac.signal);
        }

        storage.on('reset', resetStorage);

        return () => {
            ac.abort();
            storage.off('reset', resetStorage);
        }
    }, [storage]);

    return null;
}

export default EditorStorageManager;