import { selectDocument, useAppDispatch, useAppSelector } from "../redux/stateHooks";
import { storageEnhancerReplace } from "../redux/storageEnhancer";
import { deserializeProject, serializeProject } from "./serialization";

export function useLoadDocumentData() {
    const dispatch = useAppDispatch();

    return (documentJson: string) => {
        const document = deserializeProject(documentJson);
        if (!document) {
            return alert('Could not deserialize project');
        }
    
        dispatch(storageEnhancerReplace({
            document,
        }));
    }
}

export function useRetrieveDocumentData() {
    const projData = useAppSelector(selectDocument);

    return () => {
        const data = serializeProject(projData);
        if (!data) {
            return alert('could not serialize project');
        }
        return data;
    }
}