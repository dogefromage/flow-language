import { CallNode, EnvScope, FlowGraph, FlowGraphContext, FunctionNode } from "../types";
import { TExpr, TRecord } from "../typesystem/typeExpr";

/**
 * reference <= <nodeId> [ ?<parameter> ] [ .<accessor> ]
 * 
 * Example:
 * Accesses destructured x value of vector obj which is parameter of distance:
 *   distance?vec.x
 */


export const validateFlow = (
    flow: FlowGraph,
    env: EnvScope,
): FlowGraphContext => {
    const result: FlowGraphContext = {
        problems: [],
        nodes: {},
        edges: {},
    };


    function createRecordFromMap(mapT: Record<string, TExpr>): TRecord {
        let row: TExpr = { kind: 'ROWEMPTY' };
        for (const [key, field] of Object.entries(mapT)) {
            row = { kind: 'ROWEXTEND', key, field, row };
        }
        return { kind: 'RECORD', row };
    }


    interface FunctionBlock {
        kind: 'function';
        element: FunctionNode;
        children: OrderedFlowNode[];
    }
    interface SingleElement {
        kind: 'single';
        element: CallNode;
    }

    type OrderedFlowNode = FunctionBlock | SingleElement;

    const orderedFlow: OrderedFlowNode[] = [];


    function validateOrdering(orderedFlow: ) {

    }

    // const nodeTypes = new Map<string, TExpr>();
    // let level = 0;
    // const flowOrdering: string[] = [];
    // for (const orderedId of flowOrdering) {
    //     if (orderedId.endsWith(':begin')) {
    //         const funId = orderedId.slice(0, -':begin'.length);
    //         const funNode = flow.nodes[funId] as FunctionNode;
    //         assert(funNode.kind === 'function');

    //         // construct function type and provide params
    //         const funEnvContent: EnvContent = {};
    //         const paramTypeMap: Record<string, TExpr> = {};
    //         for (const param of Object.keys(funNode.parameters)) {
    //             const newVar = newUnboundVar(level);
    //             paramTypeMap[param] = newVar;
    //             const paramIdentifier = `${funId}?${param}`;
    //             funEnvContent[paramIdentifier] = { kind: 'basic', type: newVar };
    //         }
    //         nodeTypes.set(funId, funType);

    //         // provide name of function for recursion
    //         const referentialType = newUnboundVar(level);
    //         funEnvContent[funId] = {
    //             kind: 'basic',
    //             type: referentialType,
    //         };
    //         env = pushContent(env, { content: funEnvContent });
    //         level++;
    //     }
    //     else if (orderedId.endsWith(':end')) {
    //         const funId = orderedId.slice(0, -':end'.length);
    //         const funNode = flow.nodes[funId] as FunctionNode;
    //         assert(funNode.kind === 'function');
    //         const funType: TArrow = {
    //             kind: 'ARROW',
    //             param: createRecordFromMap(paramTypeMap),
    //             ret: newUnboundVar(level),
    //         };
    //     }
    // }





    function functionBeginId(functionId: string) {
        return `${functionId}:begin`;
    }
    function functionEndId(functionId: string) {
        return `${functionId}:end`;
    }

    function getCallNodeValueDependencies(node: CallNode) {
        const callNodeDeps = new Set<string>();
        for (const arg of Object.values(node.argumentMap)) {
            for (const ref of Object.values(arg.references)) {
                if (ref.valueRef) {
                    if (ref.valueRef.kind === 'parameter') {
                        const refId = functionBeginId(ref.valueRef.nodeId);
                        callNodeDeps.add(refId);
                    } else {
                        callNodeDeps.add(ref.valueRef.nodeId);
                    }
                }
            }
        }
    }

    // edge information and adjacency list
    const adjacency = new Map<string, string[]>();

    for (const inputNode of Object.values(flow.nodes)) {
        const inputNodeDepIndices = new Set<string>();

        switch (inputNode.kind) {
            case 'call': {

            }
        }

        for (const [inputRowId, argRow] of Object.entries(inputNode.inputs)) {
            const { rowArguments: nodeArguments } = inputRow!;
            for (const [inputAccessor, nodeArg] of Object.entries(nodeArguments)) {

                const connections: [EdgeSyntacticType, FlowConnection][] = [];
                if (nodeArg.typeRef != null) {
                    connections.push(['type-only', nodeArg.typeRef]);
                }
                if (nodeArg.valueRef != null) {
                    connections.push(['value-and-type', nodeArg.valueRef]);
                }

                for (const [syntacticType, connection] of connections) {
                    const {
                        nodeId: outputNodeId,
                        accessor: outputAccessor
                    } = connection;
                    // check if present
                    const depIndex = nodeEntries
                        .findIndex(entry => entry[0] === outputNodeId);
                    if (depIndex < 0) {
                        continue;
                    }
                    // adjacency
                    inputNodeDepIndices.add(depIndex);
                    // edge list
                    const edgeId = `${outputNodeId}.${outputAccessor || '*'}_${inputNodeId}.${inputRowId}.${inputAccessor}`;
                    uncoloredEdges.push(makeUncoloredEdge(
                        edgeId,
                        outputNodeId, outputAccessor,
                        inputNodeId, inputRowId, inputAccessor,
                        syntacticType,
                    ));
                }
            }
        }

        for (const depIndex of inputNodeDepIndices) {
            numberedAdjacency[depIndex].push(inputNodeIndex);
        }
    }



    // // edge information and adjacency list
    // const nodeEntries = Object.entries(flow.nodes);
    // const numberedAdjacency = new Array(nodeEntries.length)
    //     .fill([]).map(_ => [] as number[]);
    // const uncoloredEdges: ReturnType<typeof makeUncoloredEdge>[] = [];
    // for (let inputNodeIndex = 0; inputNodeIndex < nodeEntries.length; inputNodeIndex++) {
    //     const [inputNodeId, inputNode] = nodeEntries[inputNodeIndex];
    //     const inputNodeDepIndices = new Set<number>();

    //     for (const [inputRowId, inputRow] of Object.entries(inputNode.inputs)) {
    //         const { rowArguments: nodeArguments } = inputRow!;
    //         for (const [inputAccessor, nodeArg] of Object.entries(nodeArguments)) {

    //             const connections: [EdgeSyntacticType, FlowConnection][] = [];
    //             if (nodeArg.typeRef != null) {
    //                 connections.push(['type-only', nodeArg.typeRef]);
    //             }
    //             if (nodeArg.valueRef != null) {
    //                 connections.push(['value-and-type', nodeArg.valueRef]);
    //             }

    //             for (const [syntacticType, connection] of connections) {
    //                 const {
    //                     nodeId: outputNodeId,
    //                     accessor: outputAccessor
    //                 } = connection;
    //                 // check if present
    //                 const depIndex = nodeEntries
    //                     .findIndex(entry => entry[0] === outputNodeId);
    //                 if (depIndex < 0) {
    //                     continue;
    //                 }
    //                 // adjacency
    //                 inputNodeDepIndices.add(depIndex);
    //                 // edge list
    //                 const edgeId = `${outputNodeId}.${outputAccessor || '*'}_${inputNodeId}.${inputRowId}.${inputAccessor}`;
    //                 uncoloredEdges.push(makeUncoloredEdge(
    //                     edgeId,
    //                     outputNodeId, outputAccessor,
    //                     inputNodeId, inputRowId, inputAccessor,
    //                     syntacticType,
    //                 ));
    //             }
    //         }
    //     }
    //     for (const depIndex of inputNodeDepIndices) {
    //         numberedAdjacency[depIndex].push(inputNodeIndex);
    //     }
    // }








    // const topSortResult = sortTopologically(numberedAdjacency);
    // const namedTopSort = topSortResult.topologicalSorting
    //     .map(i => nodeEntries[i][0]);

    // const usedNodeIds = new Set<string>();
    // // output and outputs dependencies
    // const outputIndices: number[] = [];
    // for (let i = 0; i < nodeEntries.length; i++) {
    //     const node = nodeEntries[i][1];
    //     if (pathTail(node.protoPath) === 'output') {
    //         outputIndices.push(i);
    //     }
    // }
    // if (outputIndices.length == 0) {
    //     result.problems.push({
    //         type: 'output-missing',
    //         message: 'Flow does not contain an output.',
    //     });
    // } else if (outputIndices.length > 1) {
    //     result.problems.push({
    //         type: 'output-missing',
    //         message: 'Flow contains multiple outputs.',
    //     });
    // } else {
    //     const outputIndex = outputIndices[0];
    //     // mark nodes redundant
    //     const numberedOutputDeps = findDependencies(numberedAdjacency, outputIndex);
    //     for (const numberedDep of numberedOutputDeps) {
    //         usedNodeIds.add(nodeEntries[numberedDep][0]);
    //     }
    //     result.sortedUsedNodes = namedTopSort.filter(nodeId => usedNodeIds.has(nodeId));
    // }

    // // mark cycles
    // type GraphEdgeKey = `${string}:${string}`;
    // const cyclicGraphEdges = new Set<GraphEdgeKey>();
    // if (topSortResult.cycles.length) {
    //     const namedCycles = topSortResult.cycles
    //         .map(cycle => cycle.map(i => nodeEntries[i][0]));
    //     // collect all edges (u,v) which are somewhere in a cycle
    //     for (const cycle of namedCycles) {
    //         result.problems.push({
    //             type: 'cyclic-nodes',
    //             cycle,
    //             message: `${cycle.length} nodes form a cycle. This is not allowed.`
    //         });

    //         for (let i = 0; i < cycle.length; i++) {
    //             let j = (i + 1) % cycle.length;
    //             const key: GraphEdgeKey = `${cycle[i]}:${cycle[j]}`;
    //             cyclicGraphEdges.add(key);
    //         }
    //     }
    // }

    // // color edges
    // const coloredEdges = uncoloredEdges.map(almostEdge => {
    //     let edgeColor: EdgeStatus = 'normal';
    //     const targetNode = almostEdge.target.nodeId;
    //     // redundant
    //     if (!usedNodeIds.has(targetNode)) {
    //         edgeColor = 'redundant';
    //     }
    //     // cyclic
    //     const graphEdgeKey: GraphEdgeKey = `${almostEdge.source.nodeId}:${almostEdge.target.nodeId}`;
    //     if (cyclicGraphEdges.has(graphEdgeKey)) {
    //         edgeColor = 'cyclic';
    //     }
    //     return finalizeEdge(almostEdge, edgeColor);
    // });

    // const memoizedEdgeObj = memoObjectByFlatEntries(
    //     // flatten into sequence with pairwise id and value for memoization
    //     ...coloredEdges
    //         .sort((a, b) => a.id.localeCompare(b.id))
    //         .map(edge => [edge.id, edge])
    //         .flat()
    // );
    // result.edges = memoizedEdgeObj;

    // // filling type table bottom-up using topsort
    // let inferredOutputTypesFlat: (TemplatedTypeSpecifier | string)[] = [];

    // for (const nodeId of namedTopSort) {
    //     const node = flow.nodes[nodeId];
    //     const isUsed = usedNodeIds.has(nodeId);

    //     const inferredOutputTypes = memoObjectByFlatEntries(...inferredOutputTypesFlat);
    //     const nodeResult = validateNode(node, flowEnvironment, inferredOutputTypes, isUsed);

    //     result.nodeContexts[nodeId] = nodeResult;
    //     if (isUsed) {
    //         result.criticalSubProblems += nodeResult.criticalSubProblems + nodeResult.problems.length;
    //     }
    //     if (nodeResult.inferredType != null) {
    //         const templatedOutput = memoizeTemplatedType(
    //             createReducedTemplateType(
    //                 nodeResult.inferredType.generics,
    //                 nodeResult.inferredType.specifier.output,
    //             )
    //         );
    //         inferredOutputTypesFlat.push(nodeId, templatedOutput);
    //     }
    // }

    return result;
};


// const makeUncoloredEdge = mem((
//     id: string,
//     outputNode: string,
//     outputAccessor: string | undefined,
//     inputNode: string,
//     inputRow: string,
//     inputAccessor: string,
//     syntacticType: EdgeSyntacticType,
// ) => ({
//     id,
//     source: {
//         direction: 'output',
//         nodeId: outputNode,
//         accessor: outputAccessor,
//     },
//     target: {
//         direction: 'input',
//         nodeId: inputNode,
//         rowId: inputRow,
//         accessor: inputAccessor,
//     },
//     syntacticType,
// }) satisfies Partial<EdgeContext>, undefined, { tag: 'makeUncoloredEdge' });

// const finalizeEdge = mem(
//     (edge: ReturnType<typeof makeUncoloredEdge>, color: EdgeStatus): EdgeContext => ({
//         ...edge, status: color,
//     }),
//     undefined,
//     { tag: 'finalizeEdge' },
// );

// const pushFlowEnvironmentContent = mem(
//     pushFlowEnvironmentContentInitial,
//     undefined,
//     { tag: 'pushFlowEnvironmentContent' },
// );
// function pushFlowEnvironmentContentInitial(
//     env: FlowEnvironment,
//     flowId: string,
//     generics: FlowGraph['generics'],
//     flowInputs: FlowGraph['inputs'],
//     flowOutput: FlowGraph['output'],
//     imports: FlowGraph['imports'],
//     availableModules: FlowModule[],
// ): FlowEnvironment {
//     const input: FlowSignature = {
//         id: 'input',
//         attributes: {
//             category: 'In/Out',
//             description: 'The Input provides the arguments passed into the flow. It can also be placed multiple times.',
//         },
//         generics,
//         inputs: [],
//         output: {
//             id: 'inputs',
//             specifier: createMapType(
//                 Object.fromEntries(
//                     flowInputs.map(input => [input.id, input.specifier])
//                 )
//             ),
//             rowType: 'output',
//             defaultDestructure: true,
//         },
//     }

//     const outputInputs: InputRowSignature[] = [];
//     if (flowOutput != null) {
//         // let rowType: 'input-simple' | 'input-variable' = 'input-simple';
//         // if (flowOutput.rowType === 'output-destructured') {
//         //     rowType = 'input-variable';
//         // }
//         outputInputs.push({
//             id: flowOutput.id,
//             specifier: flowOutput.specifier,
//             rowType: 'input-variable', // test
//             // rowType,
//             defaultValue: null,
//         });
//     }
//     const output: FlowSignature = {
//         id: 'output',
//         attributes: {
//             category: 'In/Out',
//             description: 'Symbolizes the output value of this flow. Only one output should ever be placed at once.',
//         },
//         generics,
//         inputs: outputInputs,
//         output: {
//             id: 'output',
//             rowType: 'output',
//             specifier: createAnyType(),
//             hidden: true,
//         },
//     }

//     // add env internal content
//     env = pushContent(env, {
//         name: `document::${flowId}`,
//         content: {
//             signatures: [input, output],
//             types: {},
//         },
//     });

//     // modules
//     for (const currImport of imports) {
//         const importedModule = assertDef(availableModules
//             .find(m => m.name == currImport), "add problem here");
//         env = pushContent(env, {
//             name: `module::${importedModule.name}`,
//             content: importedModule.declarations,
//         });
//     }
//     return env;
// }
