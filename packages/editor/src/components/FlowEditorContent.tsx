import React from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { selectFlows, useSelectSingleFlow, useSelectSingleFlowNode } from '../slices/flowsSlice';
import { useSelectFlowEditorPanel } from '../slices/panelFlowEditorSlice';
import { assert } from '../utils';
import FlowEdges from './FlowEdges';
import FlowNodeComment from './FlowNodeComment';
import FlowNodeCall from './FlowNodeCall';
import FlowNodeFunction from './FlowNodeFunction';
import { selectDocument } from '../slices/documentSlice';

interface FlowEditorContentProps {
    panelId: string;
    flowId: string;
}

const FlowEditorContent = ({ flowId, panelId }: FlowEditorContentProps) => {
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));
    const flowGraph = useAppSelector(useSelectSingleFlow(flowId));

    if (!flowGraph || !panelState) {
        return null;
    }

    return (
        <>
            {
                Object.keys(flowGraph.nodes).map((nodeId) => 
                    <FlowNodeSwitch key={nodeId} panelId={panelId} flowId={flowId} nodeId={nodeId} />
                )
            }
            <FlowEdges panelId={panelId} flowId={flowId} />
        </>
    );
}

export default React.memo(FlowEditorContent);



export interface FlowNodeProps {
    panelId: string;
    flowId: string;
    nodeId: string;
}
const FlowNodeSwitch = ({ panelId, flowId, nodeId }: FlowNodeProps) => {
    const node = useAppSelector(useSelectSingleFlowNode(flowId, nodeId));
    if (!node) return null;
    
    switch (node.kind) {
        case 'call':
            return <FlowNodeCall panelId={panelId} flowId={flowId} nodeId={nodeId} />;
        case 'comment':
            return <FlowNodeComment panelId={panelId} flowId={flowId} nodeId={nodeId} />;
        case 'function':
            return <FlowNodeFunction panelId={panelId} flowId={flowId} nodeId={nodeId} />;
        default:
            assert(0);
    }
}

export type RowComponentProps<R> = {
    panelId: string;
    flowId: string;
    nodeId: string;
    row: R;
}

