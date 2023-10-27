import React, { PropsWithChildren } from 'react';
import { useSelectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';
import { ViewTypes, listItemRegex } from '../types';
import { FormSortableList } from './FormSortableList';
import { flowsAddListItem, flowsRemoveListItem, flowsReorderList, flowsUpdateInput, useSelectSingleFlow } from '../slices/flowsSlice';

interface FlowInspectorGenericListProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorGenericList = ({ panelId, flowId }: PropsWithChildren<FlowInspectorGenericListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectPanelState(ViewTypes.FlowInspector, panelId));
    const flow = useAppSelector(useSelectSingleFlow(flowId));

    if (!flow) return null;

    const selected = panelState?.selectedItem?.type === 'generics' ?
        panelState.selectedItem.id : '';

    const genericNames = new Set(flow.generics.map(g => g.id));

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
            addMessage='Add Generic'
            onValidateNewName={name => {
                if (name.length == 0) {
                    return { message: 'Please provide a name.' };
                }
                if (!listItemRegex.test(name)) {
                    return { message: 'Please provide a valid name. A name should only contain letters, digits, underscores and should not start with a number.' };
                }
                if (genericNames.has(name)) {
                    return { message: `There is already a generic named '${name}'. Please use a different name.` };
                }
            }}
            onAdd={name => {
                dispatch(flowsAddListItem({
                    flowId,
                    itemId: name,
                    prop: 'generics',
                    undo: { desc: `Added generic constraint to active flow.` },
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