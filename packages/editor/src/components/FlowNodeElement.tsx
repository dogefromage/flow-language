import { useMouseDrag } from '@fluss/interactive';
import { FlowEnvironment, FlowNodeContext } from '@fluss/language';
import React, { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '../redux/stateHooks';
import { flowsMoveSelection } from '../slices/flowsSlice';
import { flowEditorPanelsPushFlowId, flowEditorSetSelection } from '../slices/panelFlowEditorSlice';
import { FlowNodeDiv } from '../styles/flowStyles';
import { FlowEditorPanelState, SelectionStatus, Vec2 } from '../types';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import FlowNodeContent from './FlowNodeContent';
import { FlowNodeMissingContent } from './FlowNodeMissingContent';

export const FLOW_NODE_DIV_CLASS = 'flow-node-div';

interface Props {
    panelId: string;
    flowId: string;
    context: FlowNodeContext;
    getPanelState: () => FlowEditorPanelState;
    selectionStatus: SelectionStatus;
    env: FlowEnvironment;
}

const FlowNodeElement = ({ panelId, flowId, context, getPanelState, selectionStatus, env }: Props) => {
    const dispatch = useAppDispatch();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const getClientNodePos = useCallback(() => {
        const rect = wrapperRef.current!.getBoundingClientRect();
        return { x: rect.x, y: rect.y } as Vec2;
    }, [wrapperRef]);

    const dragRef = useRef<{
        startCursor: Vec2;
        lastCursor: Vec2;
        startPosition: Vec2;
        stackToken: string;
    }>();

    const ensureSelection = () => {
        if (selectionStatus !== SelectionStatus.Selected) {
            dispatch(flowEditorSetSelection({
                panelId,
                selection: [context.ref.id],
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
            const { camera, selection } = getPanelState();

            if (!dragRef.current || !camera) return;

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
                    desc: `Moved selection in active geometry.`
                },
            }));
        },
    }, {
        cursor: 'grab',
    });

    // // DEBUG UPDATES
    // const [color, setColor] = useState('#ffffff');
    // useEffect(() => {
    //     // console.log(`ROW UPDATE ${row.id}`);
    //     setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
    // }, [context])

    return (
        <FlowNodeDiv
            $position={context.ref.position}
            $selectionStatus={selectionStatus}
            {...handlers}
            className={FLOW_NODE_DIV_CLASS}
            data-id={context.ref.id} // for DOM querying node ids
            onClick={e => {
                e.stopPropagation();
            }}
            onContextMenu={() => ensureSelection()} // context will be triggered further down in tree
            ref={wrapperRef}
            // debugOutlineColor={color}
            onDoubleClick={e => {
                const signatureId = context.templateSignature?.id;
                dispatch(flowEditorPanelsPushFlowId({
                    panelId,
                    flowId: signatureId!,
                }));
                e.stopPropagation();
            }}
        >
            {
                context.templateSignature ? (
                    <FlowNodeContent
                        panelId={panelId}
                        flowId={flowId}
                        context={context}
                        signature={context.templateSignature}
                        getClientNodePos={getClientNodePos}
                        env={env}
                    />
                ) : (
                    <FlowNodeMissingContent signature={context.ref.signature} />
                )
            }
            {catcher}
        </FlowNodeDiv >
    );
}

export default React.memo(FlowNodeElement);