import { useDraggable, useDroppable } from 'dragzone';
import React, { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowEditorSetStateDraggingLink, flowEditorSetStateNeutral, useSelectFlowEditorPanelActionState } from '../slices/panelFlowEditorSlice';
import { FlowJointDiv } from '../styles/flowStyles';
import { FlowJointStyling, JointLocation, getJointDir } from '../types';
import { getJointLocationDigest } from '../utils/flows';
import { flowsAddConnection } from '../slices/flowsSlice';

interface Props {
    panelId: string;
    flowId: string;
    location: JointLocation;
}

export const DRAG_JOIN_DND_TAG = `drag-join`;
export const FLOW_JOINT_TARGET_CLASS = `joint-target`;

const FlowJoint = ({ panelId, flowId, location }: Props) => {
    const dispatch = useAppDispatch();
    const actionState = useAppSelector(useSelectFlowEditorPanelActionState(panelId));

    const drag = useDraggable({
        tag: DRAG_JOIN_DND_TAG,
        start: e => {
            e.dataTransfer.setDragImage(new Image(), 0, 0);
            dispatch(flowEditorSetStateDraggingLink({
                panelId,
                draggingContext: {
                    fromJoint: location,
                    syntax: e.ctrlKey ? 'type-only' : 'value-and-type',
                    // dataType: ,
                    // env: env,
                }
            }));
        },
    });

    const isDroppableTarget = (
        actionState?.type === 'dragging-link' &&
        // actionState.draggingContext.fromJoint.nodeId !== location.nodeId &&
        getJointDir(actionState.draggingContext.fromJoint) !== getJointDir(location)
    );

    const droppableHandler = (e: React.DragEvent) => {
        if (isDroppableTarget) {
            e.preventDefault();
        }
    }
    const drop = useDroppable({
        tag: DRAG_JOIN_DND_TAG,
        enter: droppableHandler,
        over: droppableHandler,
        leave: droppableHandler,
        drop: e => {
            if (!isDroppableTarget) return;
            dispatch(flowsAddConnection({
                flowId,
                locations: [location, actionState.draggingContext.fromJoint],
                undo: { desc: `Connected two nodes in flow.` },
                syntax: actionState.draggingContext.syntax,
            }));
            dispatch(flowEditorSetStateNeutral({
                panelId,
            }));
            e.stopPropagation();
        },
    });

    const innerRef = useRef<HTMLDivElement>(null);
    // const jointStyle: FlowJointStyling = getJointStyling(type, env, additional)
    const jointStyle: FlowJointStyling = { 
        background: '#446bb3', 
        border: null, 
        borderStyle: 'solid',
        shape: 'round',
    };

    return (
        <FlowJointDiv
            $direction={getJointDir(location)}
            $jointStyle={jointStyle}
            {...drag.handlers}
            {...drop.handlers}
            onMouseDown={e => e.stopPropagation()}
            $isHovering={drop.isHovering}
        >
            <div
                className={FLOW_JOINT_TARGET_CLASS}
                ref={innerRef}
                data-joint-key={getJointLocationDigest(location)}
            />
        </FlowJointDiv>
    );
}

export default FlowJoint;
