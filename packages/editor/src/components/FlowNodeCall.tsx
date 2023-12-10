import { useMouseDrag } from 'dragzone';
import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetSelection, selectEditor } from '../slices/editorSlice';
import { flowsMoveSelection, useSelectSingleFlowNode } from '../slices/flowsSlice';
import { EDITOR_ITEM_ID_ATTR, EDITOR_SELECTABLE_ITEM_CLASS, SelectionStatus, Vec2 } from '../types';
import { assert } from '../utils';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import { FlowNodeCallDiv, FlowNodeNameWrapper, FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import { formatFlowLabel } from '../utils/flows';
import * as lang from 'noodle-language';
import FlowJoint from './FlowJoint';
import { FlowNodeProps, RowComponentProps } from './FlowEditorContent';

const FlowNodeCall = ({ panelId, flowId, nodeId }: FlowNodeProps) => {
    const dispatch = useAppDispatch();
    const node = useAppSelector(useSelectSingleFlowNode(flowId, nodeId));
    if (!node) return null;
    assert(node.kind === 'call');

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { selection } = useAppSelector(selectEditor);
    let selectionStatus: SelectionStatus = 'nothing';
    if (flowId === selection?.flowId && selection.nodes.includes(nodeId)) {
        selectionStatus = 'selected';
    }

    // const debouncedContext = useDebouncedValue(context, 300);
    // useEffect(() => {
    //     if (wrapperRef.current == null) return;
    //     const div = wrapperRef.current;
    //     const nodeRect = wrapperRef.current.getBoundingClientRect();
    //     const updates = Array
    //         .from(div.querySelectorAll(`.${FLOW_JOINT_TARGET_CLASS}`))
    //         .map(joint => {
    //             const jointRect = joint.getBoundingClientRect();
    //             const relativeClientPosition = {
    //                 x: jointRect.x + 0.5 * jointRect.width - nodeRect.x,
    //                 y: jointRect.y + 0.5 * jointRect.height - nodeRect.y,
    //             };
    //             const jointKeyAttr = joint.attributes.getNamedItem('data-joint-key');
    //             if (jointKeyAttr == null) {
    //                 return;
    //             }
    //             return {
    //                 relativeClientPosition,
    //                 jointKey: jointKeyAttr.value as JointLocationDigest,
    //             };
    //         })
    //         .filter((x): x is NonNullable<typeof x> => x != null);
    //     dispatch(flowEditorSetRelativeClientJointPositions({
    //         panelId, updates,
    //     }));
    // }, [debouncedContext]);
    const dragRef = useRef<{
        startCursor: Vec2;
        lastCursor: Vec2;
        startPosition: Vec2;
        stackToken: string;
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
            dragRef.current = {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                startPosition: { ...node.position },
                stackToken: uuidv4(),
            };
            e.stopPropagation();
            ensureSelection();
        },
        move: e => {
            if (!dragRef.current || !selection) return;

            const zoom = 1; // TODO: get zoom from css somehow

            const screenDelta = {
                x: e.clientX - dragRef.current.lastCursor.x,
                y: e.clientY - dragRef.current.lastCursor.y,
            };
            const worldMove = vectorScreenToWorld(zoom, screenDelta);
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

    const dataProps = { [EDITOR_ITEM_ID_ATTR]: nodeId };

    return (
        <FlowNodeCallDiv
            ref={wrapperRef}
            $position={node.position}
            $selectionStatus={selectionStatus}
            className={EDITOR_SELECTABLE_ITEM_CLASS}
            {...handlers}
            {...dataProps}
            onClick={e => e.stopPropagation()}
            onContextMenu={() => ensureSelection()} // context will be triggered further down in tree
        >
            <FlowNodeNameWrapper>
                <FlowNodeRowNameP $align='left' $bold={true}>
                    {`${node.functionId} - ${formatFlowLabel(node.id)}`}
                </FlowNodeRowNameP>
            </FlowNodeNameWrapper>
            <FlowOutputRow flowId={flowId} nodeId={nodeId} panelId={panelId} row={node.output} />
            {
                Object.values(node.argumentMap).map(arg => 
                    <FlowArgumentRowSwitch key={arg.id} flowId={flowId} nodeId={nodeId} panelId={panelId} row={arg} />
                )
            }
            {catcher}
        </FlowNodeCallDiv>
    );
};

export default FlowNodeCall;

const FlowOutputRow = (props: RowComponentProps<lang.OutputRowState>) => {
    const { panelId, flowId, nodeId, row } = props;
    return (
        // <FlowNodeRowErrorWrapper {...props}>
        <FlowNodeRowDiv>
            <FlowJoint
                panelId={panelId}
                flowId={flowId}
                location={{ kind: 'output', nodeId }} />
            <FlowNodeRowNameP $align='right'>
                {formatFlowLabel('output')}
            </FlowNodeRowNameP>
        </FlowNodeRowDiv>
        // </FlowNodeRowErrorWrapper>
    );
};

const FlowArgumentRowSwitch = (props: RowComponentProps<lang.ArgumentRowState>) => {
    switch (props.row.exprType || 'simple') {
        case 'simple':
            return <FlowArgumentRowSimple {...props} />;
        case 'initializer':
            return <FlowArgumentRowInitializer {...props} />;
        case 'record':
            return <FlowArgumentRowRecord {...props} />;
    }
    assert(0);
};
const FlowArgumentRowSimple = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const { panelId, flowId, nodeId, row } = props;
    return (
        // <FlowNodeRowErrorWrapper {...props}>
        <FlowNodeRowDiv>
            <FlowJoint
                panelId={panelId}
                flowId={flowId}
                location={{ kind: 'argument', nodeId, argumentId: row.id }} />
            <FlowNodeRowNameP $align='left'>
                {formatFlowLabel(row.id)}
            </FlowNodeRowNameP>
        </FlowNodeRowDiv>
        // </FlowNodeRowErrorWrapper>
    );
};
const FlowArgumentRowInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const { panelId, flowId, nodeId, row } = props;
    return (
        // <FlowNodeRowErrorWrapper {...props}>
        <FlowNodeRowDiv>
            initializer
        </FlowNodeRowDiv>
        // </FlowNodeRowErrorWrapper>
    );
};
const FlowArgumentRowRecord = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const { panelId, flowId, nodeId, row } = props;
    return (
        // <FlowNodeRowErrorWrapper {...props}>
        <FlowNodeRowDiv>
            record
        </FlowNodeRowDiv>
        // </FlowNodeRowErrorWrapper>
    );
};
