import React from 'react';
import { useSelectPanelState } from '../redux/panelStateEnhancer';
import { useAppSelector } from '../redux/stateHooks';
import { selectFlowContext } from '../slices/contextSlice';
import { FlowEditorPanelState, ViewTypes } from '../types';
import FlowEdges from './FlowEdges';
import FlowNodeElement from './FlowNodeElement';
import FlowRegion from './FlowRegion';

interface Props {
    panelId: string;
    flowId: string;
    getPanelState: () => FlowEditorPanelState;
}

const FlowEditorContent = ({ flowId, panelId, getPanelState }: Props) => {
    const context = useAppSelector(selectFlowContext(flowId));
    const panelState = useAppSelector(useSelectPanelState(ViewTypes.FlowEditor, panelId));

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