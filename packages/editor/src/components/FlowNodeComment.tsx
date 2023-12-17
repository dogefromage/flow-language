import { useMouseDrag } from 'dragzone';
import React, { PropsWithChildren, useRef, useState } from 'react';
import { v4 as uuidv4, v4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetSelection, selectEditor } from '../slices/editorSlice';
import { flowsMoveSelection, flowsResizeComment, flowsSetSelectionAttribute, useSelectFlowNode } from '../slices/flowsSlice';
import { EDITOR_ITEM_ID_ATTR, EDITOR_SELECTABLE_ITEM_CLASS, SelectionStatus, Size2, Vec2 } from '../types';
import { assert } from '../utils';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import { FLOW_COMMENT_DEFAULT_COLOR_HEX, FlowNodeCommentDiv } from '../styles/flowStyles';
import { MaterialSymbol } from '../styles/icons';
import * as lang from 'noodle-language';
import styled from 'styled-components';
import { getZoomFromStyles } from '../utils/flows';

interface FlowNodeRegionProps {
    panelId: string;
    flowId: string;
    nodeId: string;
}

const FlowNodeComment = ({ panelId, flowId, nodeId }: PropsWithChildren<FlowNodeRegionProps>) => {
    const dispatch = useAppDispatch();
    const node = useAppSelector(useSelectFlowNode(flowId, nodeId));
    const wrapperRef = useRef<HTMLDivElement>(null);
    if (!node) return null;
    assert(node.kind === 'comment');

    const { selection } = useAppSelector(selectEditor);
    let selectionStatus: SelectionStatus = 'nothing';
    if (flowId === selection?.flowId && selection.nodes.includes(nodeId)) {
        selectionStatus = 'selected';
    }

    const dragRef = useRef<{
        startCursor: Vec2;
        lastCursor: Vec2;
        startPosition: Vec2;
        stackToken: string;
        zoom: number;
    }>();

    const ensureSelection = () => {
        if (selectionStatus !== 'selected') {
            dispatch(editorSetSelection({
                selection: { flowId, nodes: [nodeId] },
            }));
        }
    };

    const { handlers: moveHandlers, catcher: moveCatcher } = useMouseDrag({
        mouseButton: 0,
        start: (e, cancel) => {
            if (document.activeElement instanceof HTMLTextAreaElement) {
                cancel();
            }

            const zoom = getZoomFromStyles(wrapperRef);
            dragRef.current = {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                startPosition: { ...node.position },
                stackToken: uuidv4(),
                zoom,
            };
            e.stopPropagation();
            ensureSelection();
        },
        move: e => {
            if (!dragRef.current || !selection) return;

            const screenDelta = {
                x: e.clientX - dragRef.current.lastCursor.x,
                y: e.clientY - dragRef.current.lastCursor.y,
            };
            const worldMove = vectorScreenToWorld(dragRef.current.zoom, screenDelta);
            dragRef.current.lastCursor = { x: e.clientX, y: e.clientY };

            dispatch(flowsMoveSelection({
                flowId,
                selection,
                delta: worldMove,
                undo: {
                    actionToken: dragRef.current!.stackToken,
                    desc: `Moved selection in active flow.`
                },
            }));
        },
    }, { cursor: 'grab', deadzone: 5 });

    const sizeRef = useRef<{
        startCursor: Vec2;
        lastSize: Size2;
        lastCursor: Vec2;
        stackToken: string;
        zoom: number;
    }>();

    const { handlers: sizeHandlers, catcher: sizeCatcher } = useMouseDrag({
        mouseButton: 0,
        start: e => {
            const zoom = getZoomFromStyles(wrapperRef);
            sizeRef.current = {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                lastSize: { ...node.size },
                stackToken: uuidv4(),
                zoom,
            };
            e.stopPropagation();
        },
        move: e => {
            if (!sizeRef.current) return;

            const screenDelta = {
                x: e.clientX - sizeRef.current.lastCursor.x,
                y: e.clientY - sizeRef.current.lastCursor.y,
            };
            const worldDelta = vectorScreenToWorld(sizeRef.current.zoom, screenDelta);
            const newSize: Size2 = {
                w: sizeRef.current.lastSize.w + worldDelta.x,
                h: sizeRef.current.lastSize.h + worldDelta.y,
            };

            dispatch(flowsResizeComment({
                flowId,
                nodeId: nodeId,
                size: newSize,
                undo: {
                    actionToken: sizeRef.current!.stackToken,
                    desc: `Resized comment in active flow.`
                },
            }));
        },
    }, { cursor: 'nwse-resize' });

    const dataProps = { [EDITOR_ITEM_ID_ATTR]: nodeId };
    const color = node.attributes.color || FLOW_COMMENT_DEFAULT_COLOR_HEX;

    return (
        <FlowNodeCommentDiv $position={node.position}
            ref={wrapperRef}
            $size={node.size}
            $selectionStatus={selectionStatus}
            $color={color} className={EDITOR_SELECTABLE_ITEM_CLASS}
            {...moveHandlers} {...dataProps}>
            <FlowCommentText flowId={flowId} comment={node} />
            {moveCatcher}
            {sizeCatcher}
            <MaterialSymbol className='resize-icon'
                $color={color} $size={28} $cursor='nwse-resize'
                {...sizeHandlers}
            >texture</MaterialSymbol>
        </FlowNodeCommentDiv>
    );
};

export default FlowNodeComment;

interface FlowCommentTextProps {
    flowId: string;
    comment: lang.CommentNode;
}

const FlowCommentText = ({ flowId, comment }: PropsWithChildren<FlowCommentTextProps>) => {
    const dispatch = useAppDispatch();
    const [writeAction, setWriteAction] = useState<string | undefined>();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const onChange = (e: React.ChangeEvent) => {
        const newValue = (e.currentTarget as HTMLTextAreaElement).value;
        dispatch(flowsSetSelectionAttribute({
            flowId,
            selection: [ comment.id ],
            key: 'text',
            value: newValue,
            undo: {
                desc: 'Updated comment text.',
                actionToken: writeAction,
            },
        }));
    }

    const onStartWriting = (e: React.MouseEvent) => {
        setWriteAction(v4());
        setTimeout(() => {
            textAreaRef.current?.focus();
            textAreaRef.current?.select();
        }, 100);
    }

    return (
        writeAction ? (
            <RegionTextArea value={comment.attributes.text} onChange={onChange}
                ref={textAreaRef}
                onBlur={() => setWriteAction(undefined)}
                onDoubleClick={e => e.stopPropagation()} 
                onWheel={e => e.stopPropagation()}    
            />
        ) : (
            <RegionTextPara onClick={onStartWriting}>
                {comment.attributes.text || ''}
            </RegionTextPara>
        )
    );
}

const RegionTextArea = styled.textarea`
    width: 100%;
    height: 100%;
    font-family: inherit;
    font-size: 16px;
    background-color: transparent;
    border: none;
    outline: none;
    resize: none;
`;

const RegionTextPara = styled.p`
    height: 100%;
    overflow: hidden;
    white-space: break-spaces;
`;