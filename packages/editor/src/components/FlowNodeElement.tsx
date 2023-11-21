import { useMouseDrag } from 'dragzone';
import * as lang from 'noodle-language';
import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetActiveFlow, editorSetSelection, selectEditor } from '../slices/editorSlice';
import { flowsMoveSelection, useSelectSingleFlow } from '../slices/flowsSlice';
import { flowEditorSetRelativeClientJointPositions } from '../slices/panelFlowEditorSlice';
import { FlowNodeDiv } from '../styles/flowStyles';
import { EDITOR_ITEM_ID_ATTR, EDITOR_SELECTABLE_ITEM_CLASS, EDITOR_SELECTABLE_ITEM_TYPE_ATTR, FlowEditorPanelState, JointLocationKey, SelectionStatus, Vec2, getActiveEditorCamera } from '../types';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { FLOW_JOINT_TARGET_CLASS } from './FlowJoint';
import FlowNodeContent from './FlowNodeContent';
import { FlowNodeMissingContent } from './FlowNodeMissingContent';

interface Props {
    panelId: string;
    flowId: string;
    context: lang.FlowNodeContext;
    getPanelState: () => FlowEditorPanelState;
    env: lang.FlowEnvironment;
}

const FlowNodeElement = ({ panelId, flowId, context, getPanelState, env }: Props) => {
    const dispatch = useAppDispatch();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const nodeId = context.ref.id;

    const { selection } = useAppSelector(selectEditor);
    let selectionStatus: SelectionStatus = 'nothing';
    if (flowId === selection?.flowId &&
        selection?.items.find(x => x.type === 'node' && x.id === nodeId)) {
        selectionStatus = 'selected';
    }

    const referencedFlow = useAppSelector(useSelectSingleFlow(context.proto?.id!)) as lang.FlowGraph | undefined;

    const debouncedContext = useDebouncedValue(context, 300);
    useEffect(() => {
        if (wrapperRef.current == null) return;
        const div = wrapperRef.current;
        const nodeRect = wrapperRef.current.getBoundingClientRect();

        const updates = Array
            .from(div.querySelectorAll(`.${FLOW_JOINT_TARGET_CLASS}`))
            .map(joint => {
                const jointRect = joint.getBoundingClientRect();
                const relativeClientPosition = {
                    x: jointRect.x + 0.5 * jointRect.width - nodeRect.x,
                    y: jointRect.y + 0.5 * jointRect.height - nodeRect.y,
                };
                const jointKeyAttr = joint.attributes.getNamedItem('data-joint-key');
                if (jointKeyAttr == null) {
                    return;
                }
                return {
                    relativeClientPosition,
                    jointKey: jointKeyAttr.value as JointLocationKey,
                };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
        dispatch(flowEditorSetRelativeClientJointPositions({
            panelId, updates,
        }));
    }, [debouncedContext]);

    const dragRef = useRef<{
        startCursor: Vec2;
        lastCursor: Vec2;
        startPosition: Vec2;
        stackToken: string;
    }>();

    const ensureSelection = () => {
        if (selectionStatus !== 'selected') {
            dispatch(editorSetSelection({
                selection: { flowId, items: [{ type: 'node', id: nodeId }] },
            }));
        }
    }

    const { handlers, catcher } = useMouseDrag({
        mouseButton: 0,
        start: e => {
            dragRef.current =
            {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                startPosition: { ...context.ref.position },
                stackToken: 'drag_node:' + uuidv4(),
            };
            e.stopPropagation();
            ensureSelection();
        },
        move: e => {
            const camera = getActiveEditorCamera(getPanelState());

            if (!dragRef.current || !camera || !selection) return;

            const screenDelta = {
                x: e.clientX - dragRef.current.lastCursor.x,
                y: e.clientY - dragRef.current.lastCursor.y,
            };
            const worldMove = vectorScreenToWorld(camera, screenDelta);
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

    const dataProps = {
        [EDITOR_ITEM_ID_ATTR]: nodeId,
        [EDITOR_SELECTABLE_ITEM_TYPE_ATTR]: 'node',
    };

    return (
        <FlowNodeDiv
            $position={context.ref.position}
            $selectionStatus={selectionStatus}
            {...handlers}
            className={EDITOR_SELECTABLE_ITEM_CLASS}
            {...dataProps}
            onClick={e => e.stopPropagation()}
            onContextMenu={() => ensureSelection()} // context will be triggered further down in tree
            ref={wrapperRef}
            onDoubleClick={e => {
                if (!referencedFlow) {
                    return;
                }
                dispatch(editorSetActiveFlow({
                    flowId: referencedFlow.id,
                }));
                e.stopPropagation();
            }}
        >
            {
                context.proto ? (
                    <FlowNodeContent
                        panelId={panelId}
                        flowId={flowId}
                        context={context}
                        signature={context.proto}
                        env={env}
                    />
                ) : (
                    <FlowNodeMissingContent signaturePath={context.ref.protoPath} />
                )
            }
            {catcher}
        </FlowNodeDiv >
    );
}

export default React.memo(FlowNodeElement);