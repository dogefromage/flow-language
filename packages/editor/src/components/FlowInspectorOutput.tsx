import React, { PropsWithChildren, useMemo } from 'react';
import { selectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowsUpdateInput, flowsUpdateOutput, selectSingleFlow } from '../slices/flowsSlice';
import { ViewTypes } from '../types';
import { FormSortableList } from './FormSortableList';
import { flowInspectorPanelsSelectItem } from '../slices/panelFlowInspectorSlice';

interface FlowInspectorOutputProps {
    panelId: string;
    flowId: string;
}

const FlowInspectorOutput = ({ panelId, flowId }: PropsWithChildren<FlowInspectorOutputProps>) => {
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowInspector, panelId));
    const flow = useAppSelector(selectSingleFlow(flowId));

    if (!flow) return null;

    const selectedId = panelState?.selectedItem?.type === 'output' ?
        panelState?.selectedItem?.id : '';

    const mutableOrder = useMemo(() => [ structuredClone(flow.output) ], [ flow ])

    return (
        <FormSortableList
            order={mutableOrder}
            selected={selectedId}
            disableAdd
            onRename={(portId, label) => {
                dispatch(flowsUpdateOutput({
                    flowId,
                    newState: { label },
                    undo: { desc: `Renamed output port to '${label}'.` },
                }));
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