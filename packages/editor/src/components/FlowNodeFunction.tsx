import { useMouseDrag } from 'dragzone';
import { useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { v4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetSelection, selectEditor } from '../slices/editorSlice';
import { flowsMoveSelection, flowsResizeFunction, useSelectFlowNode } from '../slices/flowsSlice';
import { FLOW_NODE_MIN_WIDTH, FLOW_NODE_ROW_HEIGHT, FlowNodeNameWrapper, FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import { MaterialSymbol } from '../styles/icons';
import { EDITOR_ITEM_ID_ATTR, EDITOR_SELECTABLE_ITEM_CLASS, JointLocationDigest, SelectionStatus, Vec2 } from '../types';
import { assert } from '../utils';
import { formatFlowLabel, getZoomFromStyles } from '../utils/flows';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import { FlowNodeProps } from './FlowEditorContent';
import FlowJoint, { FLOW_JOINT_TARGET_CLASS } from './FlowJoint';
import { flowEditorSetRelativeClientJointPositions } from '../slices/panelFlowEditorSlice';

const FlowNodeFunction = ({ panelId, flowId, nodeId }: FlowNodeProps) => {
    const dispatch = useAppDispatch();
    const node = useAppSelector(useSelectFlowNode(flowId, nodeId));
    if (!node) return null;
    assert(node.kind === 'function');

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { selection } = useAppSelector(selectEditor);
    let selectionStatus: SelectionStatus = 'nothing';
    if (flowId === selection?.flowId && selection.nodes.includes(nodeId)) {
        selectionStatus = 'selected';
    }
    
    useEffect(() => {
        if (wrapperRef.current == null) return;
        const div = wrapperRef.current;
        const nodeRect = wrapperRef.current.getBoundingClientRect();
        const zoom = getZoomFromStyles(wrapperRef);
        const updates = Array
            .from(div.querySelectorAll(`.${FLOW_JOINT_TARGET_CLASS}`))
            .map(joint => {
                const jointKeyAttr = joint.attributes.getNamedItem('data-joint-key');
                if (jointKeyAttr == null) {
                    return;
                }
                const jointRect = joint.getBoundingClientRect();
                const relativeClientPosition = {
                    x: jointRect.x + 0.5 * jointRect.width - nodeRect.x,
                    y: jointRect.y + 0.5 * jointRect.height - nodeRect.y,
                };
                // remove width if result
                if (jointKeyAttr.value.includes('result')) {
                    const actualWidth = Math.max(node.width, FUNCTION_NODE_MIN_WIDTH);
                    // hack since reducer converts to back to world coordinates
                    relativeClientPosition.x -= actualWidth * zoom ;
                }
                return {
                    relativeClientPosition,
                    jointKey: jointKeyAttr.value as JointLocationDigest,
                };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
        dispatch(flowEditorSetRelativeClientJointPositions({
            panelId, updates,
        }));
    }, [node.parameters, node.result]);

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

    const { handlers, catcher } = useMouseDrag({
        mouseButton: 0,
        start: e => {
            const zoom = getZoomFromStyles(wrapperRef);
            dragRef.current = {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                startPosition: { ...node.position },
                stackToken: v4(),
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
    }, { cursor: 'grab' });

    const widthRef = useRef<{
        startCursorX: number;
        lastWidth: number;
        lastCursorX: number;
        stackToken: string;
        zoom: number;
    }>();
    const { handlers: widthHandlers, catcher: widthCatcher } = useMouseDrag({
        mouseButton: 0,
        start: e => {
            const zoom = getZoomFromStyles(wrapperRef);
            widthRef.current = {
                startCursorX: e.clientX,
                lastCursorX: e.clientX,
                lastWidth: node.width,
                stackToken: v4(),
                zoom,
            };
            e.stopPropagation();
        },
        move: e => {
            if (!widthRef.current) return;

            const screenDelta = e.clientX - widthRef.current.lastCursorX;
            const worldDelta = screenDelta / widthRef.current.zoom;
            const newSize = widthRef.current.lastWidth + worldDelta;

            dispatch(flowsResizeFunction({
                flowId,
                nodeId,
                width: newSize,
                undo: {
                    actionToken: widthRef.current!.stackToken,
                    desc: `Resized function in active flow.`
                },
            }));
        },
    }, { cursor: 'ew-resize' });


    const dataProps = { [EDITOR_ITEM_ID_ATTR]: nodeId };

    return (
        <FunctionBaseDiv
            ref={wrapperRef}
            $position={node.position}
            $width={node.width}
            $selectionStatus={selectionStatus}
            className={EDITOR_SELECTABLE_ITEM_CLASS}
            {...handlers}
            {...dataProps}
            onClick={e => e.stopPropagation()}
            onContextMenu={() => ensureSelection()} // context will be triggered further down in tree
        >
            <FlowNodeNameWrapper>
                <FlowNodeRowNameP $align='left'>
                    <i>fn</i>&nbsp;<b>{formatFlowLabel(node.id)}</b>
                </FlowNodeRowNameP>
            </FlowNodeNameWrapper>
            <FunctionResizeHandleDiv {...widthHandlers}>
                <MaterialSymbol $color='#bbb'>drag_indicator</MaterialSymbol>
            </FunctionResizeHandleDiv>
            <LeftFunctionArmDiv>
                {
                    Object.values(node.parameters).map(param =>
                        <FlowNodeRowDiv key={param.id}>
                            <FlowNodeRowNameP $align='center'>
                                {formatFlowLabel(param.id)}
                            </FlowNodeRowNameP>
                            <FlowJoint
                                panelId={panelId}
                                flowId={flowId}
                                location={{ kind: 'parameter', nodeId, parameterId: param.id }}
                            />
                        </FlowNodeRowDiv>
                    )
                }
            </LeftFunctionArmDiv>
            <RightFunctionArmDiv>
                {
                    <FlowNodeRowDiv>
                        <FlowNodeRowNameP $align='center'>
                            {formatFlowLabel('output')}
                        </FlowNodeRowNameP>
                        <FlowJoint
                            panelId={panelId}
                            flowId={flowId}
                            location={{ kind: 'result', nodeId }}
                        />
                    </FlowNodeRowDiv>
                }
            </RightFunctionArmDiv>
            {catcher}
            {widthCatcher}
        </FunctionBaseDiv >
    );
}

export default FlowNodeFunction;

export const FUNCTION_NODE_MIN_WIDTH = 2 * FLOW_NODE_MIN_WIDTH;

interface FunctionBaseDivProps {
    $position: Vec2;
    $selectionStatus: SelectionStatus;
    $width: number;
}

const FunctionBaseDiv = styled.div.attrs<FunctionBaseDivProps>(({ $position, $width }) => ({
    style: {
        transform: `translate(${$position.x}px, ${$position.y}px)`,
        width: `${$width}px`,
    },
})) <FunctionBaseDivProps>`
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    
    ${({ $selectionStatus, theme }) =>
        $selectionStatus !== 'nothing' && css`
            outline: solid calc(3px / min(var(--zoom), 1)) ${theme.colors.selectionStatus[$selectionStatus]};
    `}
    background-color: ${({ theme }) => theme.colors.flowEditor.nodeColor};

    min-width: ${FUNCTION_NODE_MIN_WIDTH}px;

    cursor: pointer;
`;

const FunctionArmDiv = styled.div`
    position: absolute;
    top: 100%;
    
    background-color: ${({ theme }) => theme.colors.flowEditor.nodeColor};
    cursor: pointer;
`;

const LeftFunctionArmDiv = styled(FunctionArmDiv)`
    left: 0;
`;
const RightFunctionArmDiv = styled(FunctionArmDiv)`
    right: 0;
`;

const FunctionResizeHandleDiv = styled.div`
    /* outline: solid 1px red; */
    width: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    height: ${FLOW_NODE_ROW_HEIGHT}px;
    top: 0;
    right: calc(4 * ${FLOW_NODE_ROW_HEIGHT}px);
    cursor: ew-resize;
`;