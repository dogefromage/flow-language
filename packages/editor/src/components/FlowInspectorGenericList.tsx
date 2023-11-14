import { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { documentRenameGeneric } from '../slices/documentSlice';
import { flowsAddListItem, flowsRemoveListItem, flowsReorderList, useSelectSingleFlow } from '../slices/flowsSlice';
import { flowInspectorPanelsSelectItem, useSelectFlowInspectorPanel } from '../slices/panelFlowInspectorSlice';
import { listItemRegex } from '../utils/flows';
import FormSortableList from './FormSortableList';

interface FlowInspectorGenericListProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorGenericList = ({ panelId, flowId }: PropsWithChildren<FlowInspectorGenericListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(useSelectFlowInspectorPanel(panelId));
    const flow = useAppSelector(useSelectSingleFlow(flowId));

    if (!flow) return null;

    const selected = panelState?.selectedItem?.type === 'generics' ?
        panelState.selectedItem.id : '';

    const genericNames = new Set(flow.generics.map(g => g.id));

    const select = (id: string) => {
        dispatch(flowInspectorPanelsSelectItem({
            panelId,
            type: 'generics',
            id,
        }))
    }

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
                    undo: { desc: `Removed generic tag '${portId}' from active flow.` },
                }))
            }}
            onRename={(oldName, newName) => {
                dispatch(documentRenameGeneric({
                    flowId,
                    oldName,
                    newName,
                    undo: { desc: `Renamed generic '${oldName}' to '${newName}'.` },
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
                if (genericNames.has(newName) && newName !== oldName) {
                    return { message: `There is already a generic named '${newName}'. Please use a different name.` };
                }
            }}
            addMessage='Add Generic'
            onAdd={name => {
                dispatch(flowsAddListItem({
                    flowId,
                    itemId: name,
                    prop: 'generics',
                    undo: { desc: `Added generic constraint to active flow.` },
                }));
            }}
            onSelect={select}
        />
    );
}

export default FlowInspectorGenericList;