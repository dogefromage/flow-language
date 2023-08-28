import * as lang from '@fluss/language';
import React, { PropsWithChildren } from 'react';
import { selectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowsAddPort, flowsRemovePort, flowsReorderPorts, flowsUpdatePort } from '../slices/flowsSlice';
import { flowInspectorPanelsSelectRow } from '../slices/panelFlowInspectorSlice';
import { ViewTypes } from '../types';
import { AllRowSignatures, FlowPortLists, RowSignatureBlueprint } from '../types/flowInspectorView';
import { FormSortableList } from './FormSortableList';

interface FlowInspectorPortListProps {
    panelId: string;
    flowId: string;
    ports: AllRowSignatures[];
    portType: FlowPortLists;
}

const singularName = { 
    inputs:  'input', 
    outputs: 'output',
};
const defaultBlueprint: Record<FlowPortLists, RowSignatureBlueprint> = {
    inputs:  { rowType: 'input-simple', specifier: lang.createAnyType() },
    outputs: { rowType: 'output-simple',       specifier: lang.createAnyType() },
}

const FlowInspectorPortList = ({ panelId, flowId, ports, portType }: PropsWithChildren<FlowInspectorPortListProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowInspector, panelId));

    return (
        <FormSortableList
            order={ports}
            selected={panelState?.selectedListItems[portType]}
            onOrder={newState => {
                const newOrder = newState.map(row => row.id) as string[];
                dispatch(flowsReorderPorts({
                    flowId,
                    portType,
                    newOrder,
                    undo: { desc: `Reordered ${singularName[portType]} ports of active flow.` },
                }));
            }}
            onRemove={portId => {
                dispatch(flowsRemovePort({
                    flowId,
                    portType,
                    portId,
                    undo: { desc: `Removed ${singularName[portType]} port "${portId}" from active flow.` },
                }))
            }}
            onRename={(portId, label) => {
                dispatch(flowsUpdatePort({
                    flowId,
                    portId,
                    portType,
                    newState: { label },
                    undo: { desc: `Renamed ${singularName[portType]} port to '${label}'.` },
                }));
            }}
            onAdd={() => {
                dispatch(flowsAddPort({
                    flowId,
                    portType,
                    blueprint: defaultBlueprint[portType],
                    undo: { desc: `Added ${singularName[portType]} port to active flow.` },
                }));
            }}
            onSelect={rowId => {
                dispatch(flowInspectorPanelsSelectRow({
                    panelId,
                    listType: portType,
                    rowId,
                }))
            }}
        />
    );
}

export default FlowInspectorPortList;