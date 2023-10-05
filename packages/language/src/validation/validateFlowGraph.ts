import { FlowEnvironment, FlowGraph, FlowNode, FlowSignature, FunctionTypeSpecifier, TemplatedTypeSpecifier, TypeSpecifier } from "../types";
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

    // edge information and adjacency list
    // const missingNodes = new Set<string>();
    const nodeEntries = Object.entries(flow.nodes);
    const numberedAdjacency = new Array(nodeEntries.length)
        .fill([]).map(_ => [] as number[]);
    const uncoloredEdges: ReturnType<typeof makeUncoloredEdge>[] = [];
    for (let inputNodeIndex = 0; inputNodeIndex < nodeEntries.length; inputNodeIndex++) {
        const [inputNodeId, inputNode] = nodeEntries[inputNodeIndex];
        const inputNodeDepIndices = new Set<number>();

        for (const [inputRowId, inputRow] of Object.entries(inputNode.rowStates)) {
            const { connections } = inputRow!;
            for (const [ inputAccessor, connection ] of Object.entries(connections)) {
                const { 
                    nodeId: outputNodeId, 
                    accessor: outputAccessor 
                } = connection;
                // check if present
                const depIndex = nodeEntries
                    .findIndex(entry => entry[0] === outputNodeId);
                if (depIndex < 0) {
                    // missingNodes.add(outputNodeId);
                    continue;
                }
                // adjacency
                inputNodeDepIndices.add(depIndex);
                // edge list
                const edgeId = `${outputNodeId}.${outputAccessor || '@'}_${inputNodeId}.${inputRowId}.${inputAccessor}`;
                uncoloredEdges.push(
                    makeUncoloredEdge(
                        edgeId,
                        outputNodeId,
                        outputAccessor,
                        inputNodeId,
                        inputRowId,
                        inputAccessor,
                    )
                );
            }
        }
        for (const depIndex of inputNodeDepIndices) {
            numberedAdjacency[depIndex].push(inputNodeIndex);
        }
    }

    const topSortResult = sortTopologically(numberedAdjacency);
    const namedTopSort = topSortResult.topologicalSorting
        .map(i => nodeEntries[i][0]);

    const usedNodeIds = new Set<string>();
    // output and outputs dependencies
    let outputIndex = -1;
    for (let i = 0; i < nodeEntries.length; i++) {
        const node = nodeEntries[i][1];
        if (node.signature === 'output') {
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
    let inferredOutputTypesFlat: (TypeSpecifier | string)[] = [];

    for (const nodeId of namedTopSort) {
        const node = flow.nodes[nodeId];
        const isUsed = usedNodeIds.has(nodeId);
        
        const inferredOutputTypes = memoObjectByFlatEntries(...inferredOutputTypesFlat);
        const nodeResult = validateNode(node, flowEnvironment, inferredOutputTypes, isUsed);

        result.nodeContexts[nodeId] = nodeResult;
        if (isUsed) {
            result.criticalSubProblems += nodeResult.criticalSubProblems + nodeResult.problems.length;
        }
        if (nodeResult.inferredType?.output) {
            inferredOutputTypesFlat.push(nodeId, nodeResult.inferredType.output);
        }
    }

    deepFreeze(result);
    return result;
}, undefined, {
    tag: 'validateFlowGraph',
    // debugHitMiss: true,
});


export const getFlowSignature = (flow: FlowGraph) => {
    return _getFlowSignature(flow.id, flow.attributes, flow.generics, flow.inputs, flow.output);
}
const _getFlowSignature = mem((
    id:         FlowGraph['id'], 
    attributes: FlowGraph['attributes'], 
    generics:   FlowGraph['generics'], 
    inputs:     FlowGraph['inputs'], 
    output:    FlowGraph['output'], 
) => {
    const flowSignature: FlowSignature = {
        id,
        attributes: { 
            category: 'Flows',
            ...attributes,
        },
        description: null,
        generics,
        inputs,
        output,
    };
    return flowSignature;
});

const makeUncoloredEdge = mem((
    id: string,
    outputNode: string,
    outputAccessor: string | undefined,
    inputNode: string,
    inputRow: string,
    inputAccessor: string,
) => ({
    id,
    source: {
        direction: 'output',
        nodeId: outputNode,
        accessor: outputAccessor,
    },
    target: {
        direction: 'input',
        nodeId: inputNode,
        rowId: inputRow,
        accessor: inputAccessor,
    },
}) satisfies Partial<FlowEdge>);

const finalizeEdge = mem(
    (edge: ReturnType<typeof makeUncoloredEdge>, color: EdgeColor): FlowEdge => ({
        ...edge, color,
    })
);