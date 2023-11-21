import * as lang from 'noodle-language';
import styled from 'styled-components';
import { Box2, Vector2 } from 'threejs-math';
import { useAppDispatch, useAppSelector } from '../redux/stateHooks';
import { useSelectFlowContext } from '../slices/contextSlice';
import { flowsRemoveConnection, useSelectSingleFlow } from '../slices/flowsSlice';
import { useSelectFlowEditorPanel } from '../slices/panelFlowEditorSlice';
import { EditorActionDraggingLinkState, FlowEditorPanelState } from '../types';
import { getJointLocationKey } from '../utils/flows';

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

const FlowEdgeGroup = styled.g<{ $status: lang.EdgeStatus, $syntax: lang.EdgeSyntacticType, key: string }>`
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

        stroke: ${({ $status, theme }) => theme.colors.flowEditor.edgeColors[$status]};

        ${({ $syntax }) => $syntax === 'type-only' && `stroke-dasharray: 6px 4px;` }

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
    const context = useAppSelector(useSelectFlowContext(flowId));
    const panelState = useAppSelector(useSelectFlowEditorPanel(panelId));

    const removeEdge = (edgeId: string) => {
        if (!context) return;
        const edge = context.edges[edgeId];
        if (!edge) return;
        dispatch(flowsRemoveConnection({
            flowId,
            input: edge.target,
            syntax: edge.syntacticType,
            undo: { desc: 'Removed an edge from current flow.' },
        }))
    }

    if (!context || !flow || !panelState) {
        return null;
    }

    const { handleQuadruples, svgBox } = generateVectorData(context.edges, flow, panelState);

    if (handleQuadruples.length === 0) return null;

    return (
        <FlowEdgesSVG box={svgBox}>
            {
                handleQuadruples.map(({ key, points, edge }) => {
                    const [A, B, C, D] = points.map(p => `${p.x},${p.y}`);
                    const d = `M${A} C${B} ${C} ${D}`;

                    let status = edge?.status || 'normal';
                    let syntax = edge?.syntacticType || 'value-and-type';

                    if (key == NEW_LINK_KEY) {
                        syntax = (panelState.state as EditorActionDraggingLinkState)
                            .draggingContext?.syntax || syntax;
                    }

                    return (
                        <FlowEdgeGroup
                            key={key}
                            id={key}
                            $status={status}
                            $syntax={syntax}
                            onClick={() => removeEdge(key)}
                            onMouseDown={e => e.stopPropagation()}
                        >
                            <path className='path-catcher' d={d} />
                            <path className='path-display' d={d} />
                        </FlowEdgeGroup>
                    );
                })
            }
        </FlowEdgesSVG>
    );
}

export default FlowEdges;

function generateVectorData(edges: Record<string, lang.FlowEdge>, flow: lang.FlowGraph, panelState: FlowEditorPanelState) {

    const handleEndPoints: Array<{
        key: string;
        A: Vector2;
        D: Vector2;
        edge?: lang.FlowEdge;
    }> = [];

    for (const [edgeId, edge] of Object.entries(edges)) {
        const A = getJointPosition(edge.source, panelState, flow);
        const D = getJointPosition(edge.target, panelState, flow);
        if (A && D) {
            handleEndPoints.push({
                key: edgeId, A, D, edge,
            });
        }
    }

    // new edge link
    if (panelState.state.type === 'dragging-link') {
        let A = getJointPosition(panelState.state.draggingContext.fromJoint, panelState, flow);
        const mouseWorld = panelState.state.cursorWorldPosition;
        if (A && mouseWorld) {
            let D = new Vector2(mouseWorld.x, mouseWorld.y);
            if (panelState.state.draggingContext.fromJoint.direction === 'input') {
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

function getJointPosition(jointLocation: lang.JointLocation, panelState: FlowEditorPanelState, flow: lang.FlowGraph) {
    const key = getJointLocationKey(jointLocation);
    const offset = panelState.relativeJointPosition.get(key);
    const node = flow.nodes[jointLocation.nodeId];
    if (!offset || !node) {
        return undefined;
    }
    return new Vector2(
        node.position.x + offset.x,
        node.position.y + offset.y,
    );
}