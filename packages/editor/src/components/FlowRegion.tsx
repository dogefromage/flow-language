import { useMouseDrag } from '@noodles/interactive';
import * as lang from '@noodles/language';
import { PropsWithChildren, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { flowsMoveSelection, flowsResizeRegion } from '../slices/flowsSlice';
import { flowEditorSetSelection, useFlowEditorSelection } from '../slices/panelFlowEditorSlice';
import { FlowRegionDiv } from '../styles/flowStyles';
import { EDITOR_ITEM_ID_ATTR, EDITOR_SELECTABLE_ITEM_CLASS, EDITOR_SELECTABLE_ITEM_TYPE_ATTR, FlowEditorPanelState, SelectionStatus, Size2, Vec2 } from '../types';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import { MaterialSymbol } from '../styles/icons';
import FlowRegionText from './FlowRegionText';

interface FlowRegionProps {
    panelId: string;
    flowId: string;
    getPanelState: () => FlowEditorPanelState;
    region: lang.FlowRegion;
}

const FlowRegion = ({ panelId, flowId, region, getPanelState }: PropsWithChildren<FlowRegionProps>) => {
    const dispatch = useAppDispatch();

    const selection = useAppSelector(useFlowEditorSelection(panelId));
    let selectionStatus: SelectionStatus = 'nothing';
    if (selection?.items.find(
        x => x.type === 'region' && x.id === region.id)) {
        selectionStatus = 'selected';
    }


    const dragRef = useRef<{
        startCursor: Vec2;
        lastCursor: Vec2;
        startPosition: Vec2;
        stackToken: string;
    }>();

    const ensureSelection = () => {
        if (selectionStatus !== 'selected') {
            dispatch(flowEditorSetSelection({
                panelId,
                selection: { items: [{ type: 'region', id: region.id }] },
            }));
        }
    }

    const { handlers: moveHandlers, catcher: moveCatcher } = useMouseDrag({
        mouseButton: 0,
        start: (e, cancel) => {
            if (document.activeElement instanceof HTMLTextAreaElement) {
                cancel();
            }

            dragRef.current = {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                startPosition: { ...region.position },
                stackToken: 'drag_region:' + uuidv4(),
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
    }>();

    const { handlers: sizeHandlers, catcher: sizeCatcher } = useMouseDrag({
        mouseButton: 0,
        start: e => {
            sizeRef.current = {
                startCursor: { x: e.clientX, y: e.clientY },
                lastCursor: { x: e.clientX, y: e.clientY },
                lastSize: { ...region.size },
                stackToken: 'resize_region:' + uuidv4(),
            };
            e.stopPropagation();
        },
        move: e => {
            const { camera, selection } = getPanelState();
            if (!sizeRef.current || !camera) return;

            const screenDelta = {
                x: e.clientX - sizeRef.current.lastCursor.x,
                y: e.clientY - sizeRef.current.lastCursor.y,
            };
            const worldDelta = vectorScreenToWorld(camera, screenDelta);
            const newSize: Size2 = {
                w: sizeRef.current.lastSize.w + worldDelta.x,
                h: sizeRef.current.lastSize.h + worldDelta.y,
            };

            dispatch(flowsResizeRegion({
                flowId,
                regionId: region.id,
                size: newSize,
                undo: {
                    actionToken: sizeRef.current!.stackToken,
                    desc: `Resized region in active flow.`
                },
            }));
        },
    }, { cursor: 'nwse-resize' });

    const dataProps = {
        [EDITOR_ITEM_ID_ATTR]: region.id,
        [EDITOR_SELECTABLE_ITEM_TYPE_ATTR]: 'region',
    };
    const color = region.attributes.color || 'white';

    return (
        <FlowRegionDiv $position={region.position} 
            $size={region.size}
            $selectionStatus={selectionStatus}
            $color={color} className={EDITOR_SELECTABLE_ITEM_CLASS}
            {...moveHandlers} {...dataProps}>
            <FlowRegionText flowId={flowId} region={region} />
            {moveCatcher}
            {sizeCatcher}
            <MaterialSymbol className='resize-icon'
                $color={color} $size={28} $cursor='nwse-resize'
                {...sizeHandlers}
                >texture</MaterialSymbol>
        </FlowRegionDiv>
    );
}

export default FlowRegion;