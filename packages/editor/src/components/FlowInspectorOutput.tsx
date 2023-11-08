import { PropsWithChildren, useMemo } from 'react';
import { useSelectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { documentRenameOutput } from '../slices/documentSlice';
import { useSelectSingleFlow } from '../slices/flowsSlice';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';
import { ViewTypes } from '../types';
import FormSortableList from './FormSortableList';
import { listItemRegex } from '../utils/flows';

interface FlowInspectorOutputProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorOutput = ({ panelId, flowId }: PropsWithChildren<FlowInspectorOutputProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectPanelState(ViewTypes.FlowInspector, panelId));
    const flow = useAppSelector(useSelectSingleFlow(flowId));

    if (!flow) return null;

    const selectedId = panelState?.selectedItem?.type === 'output' ?
        panelState?.selectedItem?.id : '';

    const mutableOrder = useMemo(() => [structuredClone(flow.output)], [flow]);

    const select = (id: string) => {
        dispatch(flowInspectorPanelsSelectItem({
            panelId,
            type: 'output',
            id,
        }))
    }

    return (
        <FormSortableList
            order={mutableOrder}
            selected={selectedId}
            disableAdd
            onRename={(_, newName) => {
                dispatch(documentRenameOutput({
                    flowId,
                    newName,
                    undo: { desc: `Renamed output to '${newName}'.` },
                }));
                select(newName);
            }}
            onValidateNewName={(newName, oldName) => {
                if (newName.length == 0) {
                    return { message: 'Please provide a name.' };
                }
                if (!listItemRegex.test(newName)) {
                    return { message: 'Please provide a valid name. A name should only contain letters, digits, underscores and should not start with a number.' };
                }
            }}
            onSelect={select}
        />
    );
}

export default FlowInspectorOutput;