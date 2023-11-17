import React from 'react';
import { useAppSelector } from '../redux/stateHooks';
import { useSelectFlowContext } from '../slices/contextSlice';
import { useSelectFlowEditorPanel } from '../slices/panelFlowEditorSlice';
import { FlowEditorPanelState } from '../types';
import FlowEdges from './FlowEdges';
import FlowNodeElement from './FlowNodeElement';
import FlowRegion from './FlowRegion';

interface Props {
    panelId: string;
    flowId: string;
    getPanelState: () => FlowEditorPanelState;
}

const FlowEditorContent = ({ flowId, panelId, getPanelState }: Props) => {
    const context = useAppSelector(useSelectFlowContext(flowId));
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));

    if (!context || !panelState) {
        return null;
    }

    return (
        <>
            {
                // regions
                Object.values(context.ref.regions).map(region =>
                    <FlowRegion
                        key={region.id}
                        flowId={flowId}
                        panelId={panelId}
                        region={region}
                        getPanelState={getPanelState}
                    />
                )
            }
            <FlowEdges panelId={panelId} flowId={flowId} />
            {
                // nodes
                Object.values(context.nodeContexts).map(nodeContext =>
                    <FlowNodeElement
                        key={nodeContext.ref.id}
                        flowId={flowId}
                        panelId={panelId}
                        context={nodeContext}
                        env={context.flowEnvironment}
                        getPanelState={getPanelState}
                    />
                )
            }
        </>
    );
}

export default React.memo(FlowEditorContent);