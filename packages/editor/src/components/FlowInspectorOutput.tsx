import { PropsWithChildren, useMemo } from 'react';
import { useSelectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowsUpdateOutput, useSelectSingleFlow } from '../slices/flowsSlice';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';
import { ViewTypes, listItemRegex } from '../types';
import FormSortableList from './FormSortableList';

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

    const mutableOrder = useMemo(() => [structuredClone(flow.output)], [flow])

    return (
        <FormSortableList
            order={mutableOrder}
            selected={selectedId}
            disableAdd
            onRename={(portId, newId) => {
                dispatch(flowsUpdateOutput({
                    flowId,
                    newState: { id: newId },
                    undo: { desc: `Renamed output port to '${newId}'.` },
                }));
            }}
            onValidateNewName={newId => {
                if (newId.length == 0) {
                    return { message: 'Please provide a name.' };
                }
                if (!listItemRegex.test(newId)) {
                    return { message: 'Please provide a valid name. A name should only contain letters, digits, underscores and should not start with a number.' };
                }
            }}
            onSelect={id => {
                dispatch(flowInspectorPanelsSelectItem({
                    panelId,
                    type: 'output',
                    id,
                }))
            }}
        />
    );
}

export default FlowInspectorOutput;