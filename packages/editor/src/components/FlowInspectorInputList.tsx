import React, { PropsWithChildren } from 'react';
import { useSelectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowInspectorPanelsSelectItem, useSelectFlowInspectorPanel } from '../slices/panelFlowInspectorSlice';
import FormSortableList from './FormSortableList';
import { flowsAddListItem, flowsRemoveListItem, flowsReorderList, flowsUpdateInput, useSelectSingleFlow } from '../slices/flowsSlice';
import { documentRenameInput } from '../slices/documentSlice';
import { listItemRegex } from '../utils/flows';

interface FlowInspectorPortListProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorInputList = ({ panelId, flowId }: PropsWithChildren<FlowInspectorPortListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectFlowInspectorPanel(panelId));
    const flow = useAppSelector(useSelectSingleFlow(flowId));

    if (!flow) return null;

    const selected = panelState?.selectedItem?.type === 'inputs' ?
        panelState.selectedItem.id : '';
        
    const inputNames = new Set(flow.inputs.map(input => input.id));

    const select = (id: string) => {
        dispatch(flowInspectorPanelsSelectItem({
            panelId,
            type: 'inputs',
            id,
        }))
    }

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
            onRename={(oldName, newName) => {
                dispatch(documentRenameInput({
                    flowId,
                    oldName,
                    newName,
                    undo: { desc: `Renamed input '${oldName}' to '${newName}'.` },
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
                if (inputNames.has(newName) && newName !== oldName) {
                    return { message: `There is already an input named '${newName}'. Please use a different name.` };
                }
            }}
            addMessage='Add Input'
            onAdd={itemId => {
                dispatch(flowsAddListItem({
                    flowId,
                    itemId,
                    prop: 'inputs',
                    undo: { desc: `Added input port to active flow.` },
                }));
            }}
            onSelect={select}
        />
    );
}

export default FlowInspectorInputList;