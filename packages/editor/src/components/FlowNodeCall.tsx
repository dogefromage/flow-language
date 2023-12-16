import { useMouseDrag } from 'dragzone';
import * as lang from 'noodle-language';
import { useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { editorSetSelection, selectEditor } from '../slices/editorSlice';
import { flowsMoveSelection, useSelectFlowNode } from '../slices/flowsSlice';
import { flowEditorSetRelativeClientJointPositions } from '../slices/panelFlowEditorSlice';
import { FlowNodeCallDiv, FlowNodeNameWrapper, FlowNodeRowDiv, FlowNodeRowNameP } from '../styles/flowStyles';
import { EDITOR_ITEM_ID_ATTR, EDITOR_SELECTABLE_ITEM_CLASS, JointLocationDigest, SelectionStatus, Vec2 } from '../types';
import { assert } from '../utils';
import { formatFlowLabel, getZoomFromStyles } from '../utils/flows';
import { vectorScreenToWorld } from '../utils/planarCameraMath';
import { FlowNodeProps, RowComponentProps } from './FlowEditorContent';
import FlowJoint, { FLOW_JOINT_TARGET_CLASS } from './FlowJoint';
import { ErrorUnderlineDiv } from './FlowNodeErrorWrapper';
import { ArgumentRowBooleanInitializer, ArgumentRowNumberInitializer, ArgumentRowStringInitializer } from './FlowNodeRowInitializers';
import { useSelectContextNode } from '../slices/contextSlice';
import ToolTip from './ToolTip';
import { FlowNodeHeaderToolTipContent } from './FlowNodeToolTips';

const FlowNodeCall = ({ panelId, flowId, nodeId }: FlowNodeProps) => {
    const dispatch = useAppDispatch();
    const node = useAppSelector(useSelectFlowNode(flowId, nodeId)) as lang.CallNode | undefined;
    const context = useAppSelector(useSelectContextNode(flowId, nodeId)) as lang.CallNodeContext | undefined;
    assert(!node || node.kind === 'call');

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { selection } = useAppSelector(selectEditor);
    let selectionStatus: SelectionStatus = 'nothing';
    if (flowId === selection?.flowId && selection.nodes.includes(nodeId)) {
        selectionStatus = 'selected';
    }

    useEffect(() => {
        if (!node || !wrapperRef.current) return;
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
                    jointKey: jointKeyAttr.value as JointLocationDigest,
                };
            })
            .filter((x): x is NonNullable<typeof x> => x != null);
        dispatch(flowEditorSetRelativeClientJointPositions({
            panelId, updates,
        }));
    }, [node?.argumentMap, node?.output]);

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
            if (!node) return;
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
    }, { cursor: 'grab' });

    const dataProps = { [EDITOR_ITEM_ID_ATTR]: nodeId };
    const dummyTy = lang.typeConstructors.tconst('number');

    const HeaderToolTip = useMemo(() => {
        return () => (
            flowId && node && context && 
            <FlowNodeHeaderToolTipContent 
                flowId={flowId} node={node} context={context} />
        );
    }, [ flowId, node, context ]);

    if (!node) return null;

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
            <ErrorUnderlineDiv $hasErrors={context != null && context.problems.length > 0}>
                <ToolTip.Anchor content={HeaderToolTip}>
                    <FlowNodeNameWrapper>
                        <FlowNodeRowNameP $align='left'>
                            <i>call</i>&nbsp;<b>{node.functionId.split('/').at(-1)}</b>
                        </FlowNodeRowNameP>
                    </FlowNodeNameWrapper>
                    <FlowOutputRow flowId={flowId} nodeId={nodeId} panelId={panelId} row={node.output} ty={dummyTy} />
                </ToolTip.Anchor>
            </ErrorUnderlineDiv>
            {
                Object.values(node.argumentMap).map(arg =>
                    <FlowArgumentRowSwitch key={arg.id} flowId={flowId}
                        nodeId={nodeId} panelId={panelId} row={arg} ty={dummyTy} />
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
    switch (props.row.exprType) {
        case 'initializer':
            return <FlowArgumentRowInitializer {...props} />;
        case 'structure':
            return <FlowArgumentRowStructure {...props} />;
    }
    assert(false);
};
const FlowArgumentRowInitializer = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const { panelId, flowId, nodeId, row, ty } = props;

    const TypeInitializer = getInitializerComponent(ty);
    const hasValueInput = row.references[0]?.valueRef != null;

    return (
        // <FlowNodeRowErrorWrapper {...props}>
        <FlowNodeRowDiv>
            <FlowJoint
                panelId={panelId}
                flowId={flowId}
                location={{ kind: 'argument', nodeId, argumentId: row.id }}
            /> {
                TypeInitializer && !hasValueInput && (
                    <TypeInitializer {...props}/> 
                ) || (
                    <FlowNodeRowNameP $align='left'>
                        {formatFlowLabel(row.id)}
                    </FlowNodeRowNameP>
                )
            }
        </FlowNodeRowDiv>
        // </FlowNodeRowErrorWrapper>
    );
};
const FlowArgumentRowStructure = (props: RowComponentProps<lang.ArgumentRowState>) => {
    const { panelId, flowId, nodeId, row } = props;
    return (
        // <FlowNodeRowErrorWrapper {...props}>
        <FlowNodeRowDiv>
            record
        </FlowNodeRowDiv>
        // </FlowNodeRowErrorWrapper>
    );
};

function getInitializerComponent(ty: lang.TExpr) {
    const constType = resolveConstantType(ty);
    switch (constType) {
        case 'number':
            return ArgumentRowNumberInitializer;
        case 'boolean':
            return ArgumentRowBooleanInitializer;
        case 'string':
            return ArgumentRowStringInitializer;
    }
}

function resolveConstantType(ty: lang.TExpr) {
    while (ty.kind === 'VAR' && ty.ref.kind === 'LINK') {
        ty = ty.ref.type;
    }
    if (ty.kind === 'CONST') {
        return ty.name;
    }
}

function createCallNodeMainToolTip(node: lang.CallNode, context: lang.CallNodeContext) {
    
}