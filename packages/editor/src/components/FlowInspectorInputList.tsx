import React, { PropsWithChildren } from 'react';
import { selectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';
import { ViewTypes } from '../types';
import { FormSortableList } from './FormSortableList';
import { flowsAddListItem, flowsRemoveListItem, flowsReorderList, flowsUpdateInput, selectSingleFlow } from '../slices/flowsSlice';

interface FlowInspectorPortListProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorInputList = ({ panelId, flowId }: PropsWithChildren<FlowInspectorPortListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowInspector, panelId));
    const flow = useAppSelector(selectSingleFlow(flowId));

    if (!flow) return null;

    const selected = panelState?.selectedItem?.type === 'inputs' ?
        panelState.selectedItem.id : '';

    return (
        <FormSortableList
            order={flow?.inputs}
            selected={selected}
            onOrder={newState => {
                const newOrder = newState.map(row => row.id) as string[];
                dispatch(flowsReorderList({
                    flowId,
                    newOrder,
                    prop: 'inputs',
                    undo: { desc: `Reordered input ports of active flow.` },
                }));
            }}
            onRemove={portId => {
                dispatch(flowsRemoveListItem({
                    flowId,
                    portId,
                    prop: 'inputs',
                    undo: { desc: `Removed input port "${portId}" from active flow.` },
                }))
            }}
            onRename={(portId, label) => {
                dispatch(flowsUpdateInput({
                    flowId,
                    portId,
                    newState: { label },
                    undo: { desc: `Renamed input port to '${label}'.` },
                }));
            }}
            onAdd={() => {
                dispatch(flowsAddListItem({
                    flowId,
                    prop: 'inputs',
                    undo: { desc: `Added input port to active flow.` },
                }));
            }}
            onSelect={rowId => {
                dispatch(flowInspectorPanelsSelectItem({
                    panelId,
                    type: 'inputs',
                    id: rowId,
                }));
            }}
        />
    );
}

export default FlowInspectorInputList;