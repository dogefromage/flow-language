import { pushContent } from "./environment";
import { createAnyType, createMapType, createReducedTemplateType, memoizeTemplatedType } from "../typeSystem";
import { FlowEnvironment, FlowGraph, FlowSignature, InputRowSignature, TemplatedTypeSpecifier, pathTail } from "../types";
import { EdgeColor, FlowEdge, FlowGraphContext } from "../types/context";
import { FlowModule } from "../types/module";
import { assertDef, deepFreeze } from "../utils";
import { findDependencies, sortTopologically } from "../utils/algorithms";
import { memoObjectByFlatEntries } from "../utils/functional";
import { mem } from '../utils/mem';
import { validateNode } from "./validateNode";

export const validateFlowGraph = mem((
    flow: FlowGraph,
    baseEnvironment: FlowEnvironment,
    availableModules: FlowModule[],
): FlowGraphContext => {

    const flowEnvironment = pushFlowEnvironmentContent(baseEnvironment, flow.id,
        flow.generics, flow.inputs, flow.output, flow.imports, availableModules);

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
            for (const [inputAccessor, connection] of Object.entries(connections)) {
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
        if (pathTail(node.signature) === 'output') {
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
            .map(edge => [edge.id, edge])
            .flat()
    );
    result.edges = memoizedEdgeObj;

    // filling type table bottom-up using topsort
    let inferredOutputTypesFlat: (TemplatedTypeSpecifier | string)[] = [];

    for (const nodeId of namedTopSort) {
        const node = flow.nodes[nodeId];
        const isUsed = usedNodeIds.has(nodeId);

        const inferredOutputTypes = memoObjectByFlatEntries(...inferredOutputTypesFlat);
        const nodeResult = validateNode(node, flowEnvironment, inferredOutputTypes, isUsed);

        result.nodeContexts[nodeId] = nodeResult;
        if (isUsed) {
            result.criticalSubProblems += nodeResult.criticalSubProblems + nodeResult.problems.length;
        }
        if (nodeResult.inferredType != null) {
            const templatedOutput = memoizeTemplatedType(
                createReducedTemplateType(
                    nodeResult.inferredType.generics,
                    nodeResult.inferredType.specifier.output,
                )
            );
            inferredOutputTypesFlat.push(nodeId, templatedOutput);
        }
    }

    deepFreeze(result);
    return result;
}, undefined, {
    tag: 'validateFlowGraph',
    generateInfo: ([flow]) => `flowId=${flow.id}`,
});


export const getFlowSignature = (flow: FlowGraph) => {
    return _getFlowSignature(flow.id, flow.attributes, flow.generics, flow.inputs, flow.output);
}
const _getFlowSignature = mem((
    id: FlowGraph['id'],
    attributes: FlowGraph['attributes'],
    generics: FlowGraph['generics'],
    inputs: FlowGraph['inputs'],
    output: FlowGraph['output'],
) => {
    const flowSignature: FlowSignature = {
        id,
        attributes: {
            category: 'Flows',
            ...attributes,
        },
        generics,
        inputs,
        output,
    };
    return flowSignature;
}, undefined, { tag: '_getFlowSignature' });

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
}) satisfies Partial<FlowEdge>, undefined, { tag: 'makeUncoloredEdge' });

const finalizeEdge = mem(
    (edge: ReturnType<typeof makeUncoloredEdge>, color: EdgeColor): FlowEdge => ({
        ...edge, color,
    }),
    undefined,
    { tag: 'finalizeEdge' },
);

const pushFlowEnvironmentContent = mem(
    pushFlowEnvironmentContentInitial,
    undefined,
    { tag: 'pushFlowEnvironmentContent' },
);
function pushFlowEnvironmentContentInitial(
    env: FlowEnvironment,
    flowId: string,
    generics: FlowGraph['generics'],
    flowInputs: FlowGraph['inputs'],
    flowOutput: FlowGraph['output'],
    imports: FlowGraph['imports'],
    availableModules: FlowModule[],
): FlowEnvironment {
    const input: FlowSignature = {
        id: 'input',
        attributes: { 
            category: 'In/Out',
            description: 'The Input provides the arguments passed into the flow. It can also be placed multiple times.',
        },
        generics,
        inputs: [],
        output: {
            id: 'inputs',
            specifier: createMapType(
                Object.fromEntries(
                    flowInputs.map(input => [input.id, input.specifier])
                )
            ),
            rowType: 'output-destructured',
        },
    }

    const outputInputs: InputRowSignature[] = [];
    if (flowOutput != null) {
        outputInputs.push({
            id: flowOutput.id,
            specifier: flowOutput.specifier,
            rowType: 'input-simple',
        });
    }
    const output: FlowSignature = {
        id: 'output',
        attributes: { 
            category: 'In/Out',
            description: 'Only one Output should ever be placed in a flow. Values which enter the Output will be returned by a node which is an instance of this flow.'
        },
        generics,
        inputs: outputInputs,
        output: {
            id: 'output',
            rowType: 'output-hidden',
            specifier: createAnyType(),
        },
    }

    // add env internal content
    env = pushContent(env, {
        name: `document::${flowId}`,
        content: {
            signatures: [input, output],
            types: {},
        },
    });

    // modules
    for (const currImport of imports) {
        const importedModule = assertDef(availableModules
            .find(m => m.name == currImport), "add problem here");
        env = pushContent(env, {
            name: `module::${importedModule.name}`,
            content: importedModule.declarations,
        });
    }
    return env;
}
