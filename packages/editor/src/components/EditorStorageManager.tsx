import { PropsWithChildren, useEffect } from 'react';
import { useAppDispatch } from '../redux/stateHooks';
import { projectStorageSetLocation, projectStorageSetStatus, projectStorageSetStorage } from '../slices/projectStorageSlice';
import { EditorStorage } from '../types/storage';
import { useLoadDocumentData } from '../utils/project';

interface EditorStorageManagerProps {
    storage?: EditorStorage;
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

        const res = await s.loadInitial();

        if (as.aborted) {
            return dispatch(abortedStatusAction);
        }

        if (res.error != null) {
            dispatch(projectStorageSetStatus({
                status: { type: 'error', msg: `Error while loading initial: ${res.error.message}` },
            }));
            return;
        }

        if (res.data == null) {
            dispatch(projectStorageSetStatus({
                status: { type: 'okay', msg: 'Loaded default project.' },
            }));
            return;
        }

        // TODO: ask user about unsaved work

        const { location, data } = res.data;
        dispatch(projectStorageSetLocation({ location }));
        loadDocumentData(data.documentJson);
        
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

        return () => { 
            ac.abort();
        }
    }, [storage]);

    return null;
}

export default EditorStorageManager;