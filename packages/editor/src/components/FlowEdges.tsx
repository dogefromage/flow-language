import * as lang from 'noodle-language';
import { useMemo } from 'react';
import styled from 'styled-components';
import { Box2, Vector2 } from 'threejs-math';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { useSelectContextFlow } from '../slices/contextSlice';
import { flowsRemoveConnection, useSelectSingleFlow } from '../slices/flowsSlice';
import { useSelectFlowEditorPanel } from '../slices/panelFlowEditorSlice';
import { EditorActionDraggingLinkState, FlowEditorPanelState, JointLocation, JointLocationDigest, createConnectionReference, getJointDir, getJointLocationFromReference } from '../types';
import { getJointLocationDigest } from '../utils/flows';
import { FUNCTION_NODE_MIN_WIDTH } from './FlowNodeFunction';
import { FlowNodeRowProblemMessage } from './FlowNodeToolTips';
import ToolTip, { useToolTip } from './ToolTip';

const NEW_LINK_KEY = `NEW_LINK`;

interface SVGProps {
    box: Box2;
}

const FlowEdgesSVG = styled.svg.attrs<SVGProps>(({ box }) => {
    const { min, max } = box;
    const { x, y } = min;
    const w = max.x - x;
    const h = max.y - y;
    return {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: `0 0 ${w} ${h}`,
        style: {
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`,
        }
    };
}) <SVGProps>`
    position: absolute;
    /* outline: solid 1px red; */

    pointer-events: none;
`;

const FlowEdgeG = styled.g<{ $status: lang.ReferenceStatus, $syntax: lang.ReferenceSyntacticType }>`
    .path-catcher {
        fill: none;
        stroke: transparent;
        /* stroke: #ff000033; */
        stroke-width: 10px;
        cursor: pointer;
        pointer-events: visiblePainted;
    }

    .path-display {
        fill: none;
        stroke-width: 3px;

        stroke: ${({ $status, theme }) => theme.colors.flowEditor.referenceStatus[$status]};

        ${({ $syntax }) => $syntax === 'type-only' && `stroke-dasharray: 6px 4px;`}

        transition: stroke-width 50ms, stroke 150ms;
    }

    .path-catcher:hover:not([data-key="${NEW_LINK_KEY}"]) + .path-display {
        stroke-width: 5px;
    }
`

interface Props {
    panelId: string;
    flowId: string;
}

const FlowEdges = ({ panelId, flowId }: Props) => {
    const dispatch = useAppDispatch();
    const flow = useAppSelector(useSelectSingleFlow(flowId));
    const context = useAppSelector(useSelectContextFlow(flowId));
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));

    // const edgeCache = useMemo(() => new WeakMap<lang.FlowNode, ImplicitEdge>(), [flowId]);
    const implicitEdges = useMemo(() => findImplicitEdges(flow, /* edgeCache */), [flow, /* edgeCache */]);

    const removeEdge = (edgeKey: string) => {
        const edge = implicitEdges.find(e => e.key === edgeKey);
        if (!edge) return;
        dispatch(flowsRemoveConnection({
            flowId,
            input: edge.target,
            syntax: edge.syntacticType,
            undo: { desc: 'Removed an edge from current flow.' },
        }))
    }

    if (!implicitEdges || !flow || !panelState) {
        return null;
    }

    // console.log(implicitEdges);

    const { handleQuadruples, svgBox } = generateVectorData(implicitEdges, flow, panelState);

    if (handleQuadruples.length === 0) return null;

    return (
        <FlowEdgesSVG box={svgBox}>
            {handleQuadruples.map(({ key, points, edge }) => {

                const referenceTag = edge?.source &&
                    lang.referenceDigest(createConnectionReference(edge?.source, 0)) + 
                    ';' + edge?.target.nodeId;
                const refContext = context?.references[referenceTag!];

                return (
                    <FlowEdgeGroup key={key} id={key} points={points} edge={edge} 
                        refContext={refContext} panelStateState={panelState.state}
                        onRemove={() => removeEdge(key)} />
                );
            })}
        </FlowEdgesSVG>
    );
}

export default FlowEdges;

interface FlowEdgeGroupProps {
    id: string;
    points: Vector2[];
    edge: ImplicitEdge | undefined;
    refContext: lang.ReferenceContext | undefined;
    panelStateState: FlowEditorPanelState['state'];
    onRemove: () => void;
}
const FlowEdgeGroup = ({ id, points, edge, refContext, onRemove, panelStateState }: FlowEdgeGroupProps) => {
    const [A, B, C, D] = points.map(p => `${p.x},${p.y}`);
    const d = `M${A} C${B} ${C} ${D}`;

    let status: lang.ReferenceStatus = /* edge?.status || */ 'normal';
    let syntax: lang.ReferenceSyntacticType = edge?.syntacticType || 'value-and-type';
    if (id == NEW_LINK_KEY) {
        syntax = (panelStateState as EditorActionDraggingLinkState)
            .draggingContext?.syntax || syntax;
    }

    if (refContext?.problems.length) {
        status = 'cyclic';
    }

    const { handlers, catcher } = useToolTip(createEdgeToolTipContent(refContext));

    return (
        <FlowEdgeG
            id={id}
            $status={status}
            $syntax={syntax}
            onClick={onRemove}
            onMouseDown={e => e.stopPropagation()}
            {...handlers}
        >
            <path className='path-catcher' d={d} />
            <path className='path-display' d={d} />
            {catcher}
        </FlowEdgeG>
    );
}


interface ImplicitEdge {
    key: string;
    source: JointLocation;
    sourceDigest: JointLocationDigest;
    target: JointLocation;
    targetDigest: JointLocationDigest;
    syntacticType: lang.ReferenceSyntacticType;
}

function findImplicitEdges(flow: lang.FlowGraph | undefined, /* edgeCache: WeakMap<lang.FlowNode, ImplicitEdge> */) {
    if (!flow) return [];

    const edges: ImplicitEdge[] = [];

    function createEdge(source: JointLocation, target: JointLocation, syntacticType: lang.ReferenceSyntacticType) {
        const sourceDigest = getJointLocationDigest(source);
        const targetDigest = getJointLocationDigest(target);
        const key = `${sourceDigest};${targetDigest}`;
        edges.push({ key, source, target, sourceDigest, targetDigest, syntacticType });
    }

    function createEdgesFromPair(pair: lang.ConnectionReferencePair, target: JointLocation) {
        if (pair.valueRef != null) {
            createEdge(getJointLocationFromReference(pair.valueRef), target, 'value-and-type');
        }
        if (pair.typeRef != null) {
            createEdge(getJointLocationFromReference(pair.typeRef), target, 'type-only');
        }
    }

    for (const node of Object.values(flow.nodes)) {
        switch (node.kind) {
            case 'call':
                for (const arg of Object.values(node.argumentMap)) {
                    if (arg.exprType === 'structure') {
                        for (const [accessor, pair] of Object.entries(arg.references)) {
                            const target: JointLocation = {
                                kind: 'argument',
                                nodeId: node.id,
                                argumentId: arg.id,
                                accessor,
                            };
                            createEdgesFromPair(pair, target);
                        }
                    } else if (arg.exprType === 'initializer' && arg.references[0] != null) {
                        const target: JointLocation = {
                            kind: 'argument',
                            nodeId: node.id,
                            argumentId: arg.id,
                        };
                        createEdgesFromPair(arg.references[0], target);
                    }
                }
                break;
            case 'function':
                if (node.result != null) {
                    const target: JointLocation = {
                        kind: 'result',
                        nodeId: node.id,
                    }
                    createEdgesFromPair(node.result, target);
                }
                break;
        }
    }
    return edges;
}



function generateVectorData(edges: ImplicitEdge[], flow: lang.FlowGraph, panelState: FlowEditorPanelState) {

    const handleEndPoints: Array<{
        key: string;
        A: Vector2;
        D: Vector2;
        edge?: ImplicitEdge;
    }> = [];

    for (const edge of edges) {
        const A = getJointPosition(edge.source, edge.sourceDigest, panelState, flow);
        const D = getJointPosition(edge.target, edge.targetDigest, panelState, flow);
        if (A && D) {
            handleEndPoints.push({ key: edge.key, A, D, edge });
        }
    }

    // new edge link
    if (panelState.state.type === 'dragging-link') {
        const draggingJoint = panelState.state.draggingContext.fromJoint;
        const draggingJointDigest = getJointLocationDigest(draggingJoint);
        let A = getJointPosition(draggingJoint, draggingJointDigest, panelState, flow);
        const mouseWorld = panelState.state.cursorWorldPosition;
        if (A && mouseWorld) {
            let D = new Vector2(mouseWorld.x, mouseWorld.y);
            const fromDir = getJointDir(panelState.state.draggingContext.fromJoint);
            if (fromDir === 'input') {
                const temp = A;
                A = D;
                D = temp;
            }
            handleEndPoints.push({
                key: NEW_LINK_KEY,
                A, D
            });
        }
    }

    const handleQuadruples = handleEndPoints.map(endPoints => {
        const { key, A, D, edge } = endPoints;
        const dist = A.distanceTo(D);
        const threshold = 300;
        let offset = 0.5 * threshold * Math.atan(dist / threshold);
        // offset = 0; // no squiggly

        const B = new Vector2(+offset, 0).add(A);
        const C = new Vector2(-offset, 0).add(D);
        return {
            key,
            points: [A, B, C, D],
            edge,
        };
    });

    const setOfHandlePoints = handleQuadruples.reduce((set, currQuad) => {
        set.add(currQuad.points[0]);
        set.add(currQuad.points[1]);
        set.add(currQuad.points[2]);
        set.add(currQuad.points[3]);
        return set;
    }, new Set<Vector2>());

    const svgBox = new Box2();
    for (const p of setOfHandlePoints) {
        svgBox.expandByPoint(p.clone().floor());
    }
    svgBox.expandByScalar(10);
    for (const p of setOfHandlePoints) {
        p.sub(svgBox.min);
    }

    return {
        svgBox,
        handleQuadruples,
    }
}

function getJointPosition(jointLocation: JointLocation, digest: JointLocationDigest, panelState: FlowEditorPanelState, flow: lang.FlowGraph) {
    const offset = panelState.relativeJointPosition.get(digest);
    const node = flow.nodes[jointLocation.nodeId];
    if (!offset || !node) {
        return undefined;
    }

    let { x, y } = offset;
    x += node.position.x;
    y += node.position.y;

    if (node.kind === 'function' && jointLocation.kind === 'result') {
        const actualWidth = Math.max(node.width, FUNCTION_NODE_MIN_WIDTH);
        x += actualWidth;
    }

    return new Vector2(x, y);
}

const createEdgeToolTipContent = (refContext: lang.ReferenceContext | undefined) => {
    return () => {
        if (!refContext) return null;
        return (
            <ToolTip.SectionDiv>
                {refContext.problems.map(p =>
                    <FlowNodeRowProblemMessage problem={p}/>    
                )}
            </ToolTip.SectionDiv>
        )
    }
}