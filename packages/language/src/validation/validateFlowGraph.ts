import { FlowEnvironment, FlowGraph, FlowNode, FlowSignature, FlowSignatureId, MapTypeSpecifier, getInternalId } from "../types";
import { EdgeColor, FlowEdge, FlowGraphContext } from "../types/context";
import { deepFreeze } from "../utils";
import { findDependencies, sortTopologically } from "../utils/algorithms";
import { mem, memoObjectByFlatEntries } from "../utils/functional";
import { validateNode } from "./validateNode";

export const validateFlowGraph = mem((
    flow: FlowGraph,
    flowEnvironment: FlowEnvironment,
): FlowGraphContext => {

    const result: FlowGraphContext = {
        ref: flow,
        problems: [],
        criticalSubProblems: 0,
        nodeContexts: {},
        flowSignature: getFlowSignature(flow),
        flowEnvironment,
        edges: {},
        sortedUsedNodes: [],
    };

    const missingNodes = new Set<string>();
    // edge information and adjacency list
    const nodeEntries = Object.entries(flow.nodes);
    const numberedAdjacency = new Array(nodeEntries.length)
        .fill([]).map(_ => [] as number[]);
    const uncoloredEdges: ReturnType<typeof makeUncoloredEdge>[] = [];
    for (let inputNodeIndex = 0; inputNodeIndex < nodeEntries.length; inputNodeIndex++) {
        const [inputNodeId, inputNode] = nodeEntries[inputNodeIndex];
        const inputNodeDepIndices = new Set<number>();

        for (const [inputRowId, inputRow] of Object.entries(inputNode.rowStates)) {
            const { connections } = inputRow!;
            for (let inputIndex = 0; inputIndex < connections.length; inputIndex++) {
                const { nodeId: outputNodeId, outputId } = connections[inputIndex];
                // check if present
                const depIndex = nodeEntries
                    .findIndex(entry => entry[0] === outputNodeId);
                if (depIndex < 0) {
                    missingNodes.add(outputNodeId);
                    continue;
                }
                // adjacency
                inputNodeDepIndices.add(depIndex);
                // edge list
                const edgeId = `${outputNodeId}.${outputId}_${inputNodeId}.${inputRowId}.${inputIndex}`;
                uncoloredEdges.push(
                    makeUncoloredEdge(
                        edgeId,
                        outputNodeId,
                        outputId,
                        inputNodeId,
                        inputRowId,
                        inputIndex,
                    )
                );
            }
        }
        for (const depIndex of inputNodeDepIndices) {
            numberedAdjacency[depIndex].push(inputNodeIndex);
        }
    }

    for (const missingId of missingNodes) {
        result.problems.push({
            type: 'missing-node',
            nodeId: missingId,
            message: `A node with id '${missingId}' is referenced but missing.`,
        });
    }

    const topSortResult = sortTopologically(numberedAdjacency);
    const namedTopSort = topSortResult.topologicalSorting
        .map(i => nodeEntries[i][0]);

    const usedNodeIds = new Set<string>();
    // output and outputs dependencies
    let outputIndex = -1;
    for (let i = 0; i < nodeEntries.length; i++) {
        const node = nodeEntries[i][1];
        if (node.signature === getInternalId('output')) {
            outputIndex = i;
            break;
        }
    }
    if (outputIndex < 0) {
        result.problems.push({
            type: 'output-missing',
            message: 'Flow does not contain an output.',
        });
    } else {
        // mark nodes redundant
        const numberedOutputDeps = findDependencies(numberedAdjacency, outputIndex);
        for (const numberedDep of numberedOutputDeps) {
            usedNodeIds.add(nodeEntries[numberedDep][0]);
        }
        result.sortedUsedNodes = namedTopSort.filter(nodeId => usedNodeIds.has(nodeId));
    }

    // mark cycles
    type GraphEdgeKey = `${string}:${string}`;
    const cyclicGraphEdges = new Set<GraphEdgeKey>();
    if (topSortResult.cycles.length) {
        const namedCycles = topSortResult.cycles
            .map(cycle => cycle.map(i => nodeEntries[i][0]));
        // collect all edges (u,v) which are somewhere in a cycle
        for (const cycle of namedCycles) {
            result.problems.push({
                type: 'cyclic-nodes',
                cycle,
                message: `${cycle.length} nodes form a cycle. This is not allowed.`
            });

            for (let i = 0; i < cycle.length; i++) {
                let j = (i + 1) % cycle.length;
                const key: GraphEdgeKey = `${cycle[i]}:${cycle[j]}`;
                cyclicGraphEdges.add(key);
            }
        }
    }

    // color edges
    const coloredEdges = uncoloredEdges.map(almostEdge => {
        let edgeColor: EdgeColor = 'normal';
        const targetNode = almostEdge.target.nodeId;
        // redundant
        if (!usedNodeIds.has(targetNode)) {
            edgeColor = 'redundant';
        }
        // cyclic
        const graphEdgeKey: GraphEdgeKey = `${almostEdge.source.nodeId}:${almostEdge.target.nodeId}`;
        if (cyclicGraphEdges.has(graphEdgeKey)) {
            edgeColor = 'cyclic';
        }
        return finalizeEdge(almostEdge, edgeColor);
    });

    const memoizedEdgeObj = memoObjectByFlatEntries(
        // flatten into sequence with pairwise id and value for memoization
        ...coloredEdges
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(edge => [ edge.id, edge ])
            .flat()
    );
    result.edges = memoizedEdgeObj;

    // filling type table bottom-up using topsort
    let nodeOutputTypesFlat: (string | MapTypeSpecifier)[] = [];

    for (const nodeId of namedTopSort) {
        const node = flow.nodes[nodeId];
        const isUsed = usedNodeIds.has(nodeId);
        
        const nodeOutputTypes = memoObjectByFlatEntries(...nodeOutputTypesFlat);
        const nodeResult = validateNode(node, flowEnvironment, nodeOutputTypes, isUsed);

        result.nodeContexts[nodeId] = nodeResult;
        if (isUsed) {
            result.criticalSubProblems += nodeResult.criticalSubProblems + nodeResult.problems.length;
        }
        if (nodeResult.specifier?.output) {
            nodeOutputTypesFlat.push(nodeId, nodeResult.specifier.output);
        }
    }

    deepFreeze(result);
    return result;
}, undefined, {
    tag: 'validateFlowGraph',
    // debugHitMiss: true,
});


export const getFlowSignature = (flow: FlowGraph) => {
    return _getFlowSignature(flow.id, flow.attributes, flow.name, flow.generics, flow.inputs, flow.outputs);
}
const _getFlowSignature = mem((
    id:         FlowGraph['id'], 
    attributes: FlowGraph['attributes'], 
    name:       FlowGraph['name'], 
    generics:   FlowGraph['generics'], 
    inputs:     FlowGraph['inputs'], 
    outputs:    FlowGraph['outputs'], 
) => {
    const flowSignature: FlowSignature = {
        id,
        attributes: { 
            category: 'Flows',
            ...attributes,
        },
        description: null,
        name,
        generics,
        inputs,
        outputs,
    };
    return flowSignature;
});

export const collectFlowDependencies = mem((flow: FlowGraph) => {
    const signatures = new Set<FlowSignatureId>();
    for (const node of Object.values(flow.nodes) as FlowNode[]) {
        const isAutoGenerated = node.signature.startsWith('@@');
        if (!isAutoGenerated) {
            signatures.add(node.signature);
        }
    }
    return Array.from(signatures);
});

const makeUncoloredEdge = mem((
    id: string,
    sourceNode: string,
    sourceRow: string,
    inputNode: string,
    inputRow: string,
    inputJoint: number,
) => ({
    id,
    source: {
        direction: 'output',
        nodeId: sourceNode,
        rowId: sourceRow,
    },
    target: {
        direction: 'input',
        nodeId: inputNode,
        rowId: inputRow,
        jointIndex: inputJoint,
    },
}) satisfies Partial<FlowEdge>);

const finalizeEdge = mem(
    (edge: ReturnType<typeof makeUncoloredEdge>, color: EdgeColor): FlowEdge => ({
        ...edge, color,
    })
);