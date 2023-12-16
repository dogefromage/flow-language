import styled from 'styled-components';
import { flowEditorAddAppNodeAtPositionCommand, flowEditorAddCommandAtPositionCommand, flowEditorFitCameraCommand, flowEditorPasteCommand, flowEditorAddFunctionAtPositionCommand } from '../content/commands/flowEditorViewCommands';
import { editCopySelectedCommand, editCutSelectedCommand, editDeleteSelectedCommand } from '../content/commands/globalEditorCommands';
import { useAppSelector } from '../redux/stateHooks';
import { useSelectFlowEditorPanel } from '../slices/panelFlowEditorSlice';
import useContextMenu from '../utils/useContextMenu';
import useDispatchCommand from '../utils/useDispatchCommand';
import { CONTEXT_MENU_DIVIDER } from './ContextMenu';
import FlowEditorLegend from './FlowEditorLegend';
import FlowEditorTransform from './FlowEditorTransform';
import FlowNodeCatalog from './FlowNodeCatalog';
import { useEffect } from 'react';

const EditorWrapper = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
    user-select: none;
`;

interface Props {
    panelId: string;
}

const FlowEditorViewport = ({ panelId }: Props) => {
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));
    const flowId = panelState?.flowStack[0];
    const dispatchCommand = useDispatchCommand();

    useEffect(() => {
        if (panelState?.cameras && flowId &&
            panelState.cameras[flowId] == null) {
            // initialize camera
            dispatchCommand(flowEditorFitCameraCommand, {
                targetPanelId: panelId,
            });
        }
    }, [flowId]);

    const contextMenu = useContextMenu(
        panelId,
        'Flow Viewport',
        [
            flowEditorAddAppNodeAtPositionCommand,
            flowEditorAddFunctionAtPositionCommand,
            flowEditorAddCommandAtPositionCommand,
            editDeleteSelectedCommand,
            CONTEXT_MENU_DIVIDER,
            editCopySelectedCommand,
            editCutSelectedCommand,
            flowEditorPasteCommand,
            CONTEXT_MENU_DIVIDER,
            flowEditorFitCameraCommand,
        ]
    );

    return (
        <EditorWrapper
            onContextMenu={contextMenu}
            onDoubleClick={e => {
                dispatchCommand(
                    flowEditorAddAppNodeAtPositionCommand,
                    { clientCursor: { x: e.clientX, y: e.clientY } }
                );
            }}
        >
            {
                flowId && <>
                    <FlowEditorTransform
                        panelId={panelId}
                        flowId={flowId}
                    />
                    <FlowEditorLegend flowId={flowId} />
                </>
            }
            <FlowNodeCatalog
                panelId={panelId}
            />
        </EditorWrapper>
    );
}

export default FlowEditorViewport;