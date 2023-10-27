import React, { PropsWithChildren } from 'react';
import { useSelectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';
import { ViewTypes, listItemRegex } from '../types';
import FormSortableList from './FormSortableList';
import { flowsAddListItem, flowsRemoveListItem, flowsReorderList, flowsUpdateInput, useSelectSingleFlow } from '../slices/flowsSlice';

interface FlowInspectorPortListProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorInputList = ({ panelId, flowId }: PropsWithChildren<FlowInspectorPortListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectPanelState(ViewTypes.FlowInspector, panelId));
    const flow = useAppSelector(useSelectSingleFlow(flowId));

    if (!flow) return null;

    const selected = panelState?.selectedItem?.type === 'inputs' ?
        panelState.selectedItem.id : '';
        
    const inputNames = new Set(flow.inputs.map(input => input.id));

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
            // onRename={(portId, label) => {
            //     dispatch(flowsUpdateInput({
            //         flowId,
            //         portId,
            //         newState: { label },
            //         undo: { desc: `Renamed input port to '${label}'.` },
            //     }));
            // }}

            addMessage='Add Input'
            onValidateNewName={name => {
                if (name.length == 0) {
                    return { message: 'Please provide a name.' };
                }
                if (!listItemRegex.test(name)) {
                    return { message: 'Please provide a valid name. A name should only contain letters, digits, underscores and should not start with a number.' };
                }
                if (inputNames.has(name)) {
                    return { message: `There is already a generic named '${name}'. Please use a different name.` };
                }
            }}
            onAdd={itemId => {
                dispatch(flowsAddListItem({
                    flowId,
                    itemId,
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