import React, { PropsWithChildren } from 'react';
import { selectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';
import { ViewTypes } from '../types';
import { FormSortableList } from './FormSortableList';
import { flowsAddListItem, flowsRemoveListItem, flowsReorderList, flowsUpdateInput, selectSingleFlow } from '../slices/flowsSlice';

interface FlowInspectorGenericListProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorGenericList = ({ panelId, flowId }: PropsWithChildren<FlowInspectorGenericListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowInspector, panelId));
    const flow = useAppSelector(selectSingleFlow(flowId));

    if (!flow) return null;

    const selected = panelState?.selectedItem?.type === 'generics' ?
        panelState.selectedItem.id : '';

    return (
        <FormSortableList
            order={flow?.generics}
            selected={selected}
            onOrder={newState => {
                const newOrder = newState.map(row => row.id) as string[];
                dispatch(flowsReorderList({
                    flowId,
                    newOrder,
                    prop: 'generics',
                    undo: { desc: `Reordered generic tags of active flow.` },
                }));
            }}
            onRemove={portId => {
                dispatch(flowsRemoveListItem({
                    flowId,
                    portId,
                    prop: 'generics',
                    undo: { desc: `Removed generic tag "${portId}" from active flow.` },
                }))
            }}
            // onRename={(portId, label) => {
            //     dispatch(flowsUpdateInput({
            //         flowId,
            //         portId,
            //         newState: { label },
            //         undo: { desc: `Renamed input port to '${label}'.` },
            //     }));
            // }}
            onAdd={() => {
                dispatch(flowsAddListItem({
                    flowId,
                    prop: 'generics',
                    undo: { desc: `Added generic tag to active flow.` },
                }));
            }}
            onSelect={rowId => {
                dispatch(flowInspectorPanelsSelectItem({
                    panelId,
                    type: 'generics',
                    id: rowId,
                }));
            }}
        />
    );
}

export default FlowInspectorGenericList;