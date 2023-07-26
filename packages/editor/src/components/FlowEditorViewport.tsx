import React from 'react';
import styled from 'styled-components';
import { ViewTypes } from '../types';
import FlowEditorTransform from './FlowEditorTransform';
import FlowNodeCatalog from './FlowNodeCatalog';
import { selectPanelState } from '../redux/panelStateEnhancer';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import useDispatchCommand from '../utils/useDispatchCommand';
import useContextMenu from '../utils/useContextMenu';

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
    const dispatch = useAppDispatch();
    const panelState = useAppSelector(selectPanelState(ViewTypes.FlowEditor, panelId));
    const currFlowId = panelState?.flowStack[0];
    const dispatchCommand = useDispatchCommand();

    const contextMenu = useContextMenu(
        panelId,
        'Geometry Nodes',
        [
            'flowEditor.addNodeAtPosition',
            'flowEditor.deleteSelected',
            // 'geometryEditor.resetSelected',
            'flowEditor.createGroup'
        ]
    );

    return (
        <EditorWrapper
            onDoubleClick={e => {
                dispatchCommand(
                    'flowEditor.addNodeAtPosition',
                    { clientCursor: { x: e.clientX, y: e.clientY } },
                    'view',
                );
            }}
            onContextMenu={contextMenu}
        >
            {
                currFlowId &&
                <FlowEditorTransform
                    panelId={panelId}
                    flowId={currFlowId}
                />
            }
            <FlowNodeCatalog
                panelId={panelId}
            />
        </EditorWrapper>
    );
}

export default FlowEditorViewport;