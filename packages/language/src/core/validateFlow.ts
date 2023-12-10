import { ArgumentRowState, CallNode, ConnectionReference, ConnectionReferencePair, Environment, FlowGraph, FlowGraphContext, FunctionNode, LocalScope, NamespacePath, decodeOutputRef, decodeParameterRef } from "../types";
import { generalizeType, unifyTypes } from "../typesystem/core";
import { InferenceError, TArrow, TExpr, newUnboundVar, typeExpressions } from "../typesystem/typeExpr";
import { assert } from "../utils";
import { getInstantiatedEnvType, pushScope } from "./environment";
import { OrderedGraph } from "./graph";

const { trecord } = typeExpressions;

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

function functionStart(functionId: string): string {
    return `${functionId}:in`;
}
function functionEnd(functionId: string): string {
    return `${functionId}:out`;
}
function functionId(key: string) {
    return key.split(':')[0];
}

function orderFlowGraph(flow: FlowGraph): OrderedFlowNode[] {

    const verticesOfG: string[] = [];
    const allFunctions: string[] = [];
    for (const element of Object.values(flow.nodes)) {
        switch (element.kind) {
            case 'call':
                verticesOfG.push(element.id);
                break;
            case 'function':
                verticesOfG.push(functionStart(element.id));
                verticesOfG.push(functionEnd(element.id));
                allFunctions.push(element.id);
                break;
            case 'comment':
                break;
            default:
                assert(0); // unknown
        }
    }

    /**
     * G represents temporal dependencies inside graph.
     * if a -> b then a must occur before b.
     */
    // reversed graph of G
    const reversedG = new OrderedGraph(verticesOfG);

    function getDependency(ref: ConnectionReference) {
        const param = decodeParameterRef(ref) || decodeOutputRef(ref);
        assert(param != null, 'Invalid reference');
        if (param.kind === 'parameter') {
            return functionStart(param.nodeId);
        } else {
            return param.nodeId;
        }
    }

    for (const element of Object.values(flow.nodes)) {
        switch (element.kind) {
            case 'call': {
                const callNode = element;
                const deps: string[] = []; // duplicates dont matter since graph class checks
                for (const arg of Object.values(callNode.argumentMap)) {
                    for (const connection of Object.values(arg.references)) {
                        if (connection.valueRef != null) {
                            deps.push(getDependency(connection.valueRef));
                        }
                    }
                }
                reversedG.addEdgesFrom(callNode.id, ...deps);
                break;
            }
            case 'function': {
                const functionNode = element;
                const deps: string[] = [
                    functionStart(functionNode.id), // function end must come before function start
                ];
                if (functionNode.result.valueRef != null) {
                    deps.push(getDependency(functionNode.result.valueRef));
                }
                reversedG.addEdgesFrom(functionEnd(functionNode.id), ...deps);
                break;
            }
            case 'comment':
                break;
            default:
                assert(0); // unknown
        }
    }

    const G = reversedG.reverse();
    
    /**
     * H contains all functions.
     * An edge from f to g represents that g must be contained 
     * in f for the program to work correctly.
     */
    const H = new OrderedGraph(allFunctions);

    /**
     * Edge (f,g) must be in H iff f:in ---> g:out is a path in G.
     */
    G.calculateReachability();
    for (const f of allFunctions) {
        for (const g of allFunctions) {
            if (f !== g && G.isReachable(functionStart(f), functionEnd(g))) {
                H.addEdgesFrom(f, g);
            }
        }
    }

    /**
     * H must be a tree for the program to be valid.
     * If a function f inside H has multiple parents, 
     * one must be decided.
     */

    // for now just error if multiple parents
    H.calculateDegrees();
    for (const f of allFunctions) {
        if (H.getInDegree(f) > 1) {
            throw new Error(`Parenting function of '${f}' must be decided.`);
        }
    }

    /**
     * For every edge (f,g) in H, the following relation must hold:
     * 
     *  f:in < g:in
     *                g:out < f:out
     * 
     * This can be added to G
     */
    for (const [ f, g ] of H.edges()) {
        G.addEdgesFrom(functionStart(f), functionStart(g));
        G.addEdgesFrom(functionEnd(g), functionEnd(f));
    }

    /**
     * The final ordering is the topological sort of G.
     */
    const topSort = G.sortTopologically();

    // build final order
    const orderedFlow: OrderedFlowNode[] = [];
    const stack: FunctionBlock[] = [];

    for (const itemId of topSort) {
        if (itemId.endsWith(':in')) {
            const funId = functionId(itemId);
            const functionNode = flow.nodes[funId] as FunctionNode;
            assert(functionNode?.kind === 'function');
            const functionBlock: FunctionBlock = {
                kind: 'function',
                element: functionNode,
                children: [],
            };
            orderedFlow.push(functionBlock);
            const top = stack.at(-1);
            if (top != null) {
                top.children.push(functionBlock);
            }
            stack.push(functionBlock);
        }
        else if (itemId.endsWith(':out')) {
            const funId = functionId(itemId);
            const top = stack.pop();
            if (top == null ||top.element.id !== funId) {
                throw new Error(`Invalid ordering of function bounds.`);
            }
        }
        else {
            const node = flow.nodes[itemId] as CallNode;
            assert(node);
            const top = stack.at(-1);
            const orderedNode: OrderedFlowNode = { kind: 'single', element: node };
            if (top != null) {
                top.children.push(orderedNode);
            } else {
                orderedFlow.push(orderedNode);
            }
        }
    }
    return orderedFlow;
}

function resolveReference(env: Environment, level: number, refPair: ConnectionReferencePair): TExpr {
    const ref = refPair.typeRef || refPair.valueRef;
    if (!ref) {
        throw new InferenceError(`Expected an input.`);
    }

    const location = decodeParameterRef(ref) || decodeOutputRef(ref);
    if (location === null) {
        throw new Error(`Invalid reference '${ref}'.`);
    }

    const [ identifier, accessor ] = ref.split('.');

    const envT = getInstantiatedEnvType(env, level, identifier as NamespacePath);

    if (accessor == null) {
        return envT;
    }

    // select field using unification
    const accessedField = newUnboundVar(level);
    const recType: TExpr = {
        kind: 'RECORD', 
        row: {
            kind: 'ROWEXTEND',
            key: accessor,
            field: accessedField,
            row: newUnboundVar(level),
        }
    };
    unifyTypes(envT, recType);
    return accessedField;
}

function resolveArgumentRow(env: Environment, level: number, argRow: ArgumentRowState): TExpr {
    switch (argRow.exprType || 'simple') {
        case 'simple': {
            return resolveReference(env, level, argRow.references[0] || {});
        }
        case 'initializer': {
            const value = argRow.value;
            if (value == null) {
                throw new InferenceError(`Expected an initializer value.`);
            }
            return { kind: 'CONST', name: typeof value };
        }
        case 'record': {
            const fieldMap: Record<string, TExpr> = {};
            for (const [key, ref] of Object.entries(argRow.references)) {
                fieldMap[key] = resolveReference(env, level, ref);
            }
            return trecord(fieldMap);
        }
    }
    assert(0);
}

function matchFunctionType(ty: TExpr): TArrow {
    if (ty.kind === 'ARROW') {
        return ty;
    }
    if (ty.kind === 'VAR') {
        if (ty.ref.kind === 'LINK') {
            return matchFunctionType(ty.ref.type);
        }
        else if (ty.ref.kind === 'UNBOUND') {
            const level = ty.ref.level;
            const arrowTy: TArrow = {
                kind: 'ARROW',
                param: newUnboundVar(level),
                ret: newUnboundVar(level)
            };
            ty.ref = { kind: 'LINK', type: arrowTy };
            return arrowTy;
        }
    }
    throw new InferenceError(`Expected a function.`);
}


export const validateFlow = (
    flow: FlowGraph,
    baseEnv: Environment,
): FlowGraphContext => {

    const orderedFlow = orderFlowGraph(flow);

    // since all node ids are assumed to be distinct we do not have to worry about scoping.
    // the environment can hold the whole flow content at once without having to shadow definitions from outside.

    const flowScope: LocalScope = { kind: 'local', types: {} }
    for (const node of Object.values(flow.nodes)) {
        if (node.kind === 'function') {
            const funType = newUnboundVar(0);
            flowScope.types[node.id] = funType;
        }
    }

    const flowEnv = pushScope(baseEnv, flowScope);
    let env = flowEnv;

    function inferOrdered(/* env: Environment,  */ level: number, orderedNode: OrderedFlowNode) {
        if (orderedNode.kind === 'function') {
            const funNode = orderedNode.element;

            // infer function type
            const functionLevel = level + 1;
            const paramTypeMap: Record<string, TExpr> = {};
            for (const param of Object.keys(funNode.parameters)) {
                const newVar = newUnboundVar(functionLevel);
                paramTypeMap[param] = newVar;
                const paramIdentifier = `${funNode.id}?${param}`;
                env = pushScope(env, { kind: 'local', types: { [paramIdentifier]: newVar } })
            }

            for (const child of orderedNode.children) {
                inferOrdered(functionLevel, child);
            }

            const resultType = resolveReference(env, level, funNode.result);

            const constructedType: TArrow = {
                kind: 'ARROW',
                param: trecord(paramTypeMap),
                ret: resultType,
            };

            const generalConstructedType = generalizeType(level, constructedType);
            const declaredType = getInstantiatedEnvType(env, level, funNode.id as NamespacePath);
            unifyTypes(declaredType, generalConstructedType);
        }
        else if (orderedNode.kind === 'single') {
            const callNode = orderedNode.element;
            assert(callNode.kind === 'call');

            const functionEnvType = getInstantiatedEnvType(env, level, callNode.functionId);
            const { param, ret } = matchFunctionType(functionEnvType);

            const argMap: Record<string, TExpr> = {};
            for (const arg of Object.values(callNode.argumentMap)) {
                const argType = resolveArgumentRow(env, level, arg);
                argMap[arg.id] = argType;
            }
            const argRecord = trecord(argMap);
            unifyTypes(param, argRecord);

            const generalRet = generalizeType(level, ret); // UNSURE
            env = pushScope(env, { kind: 'local', types: { [callNode.id]: generalRet } });
        }
        assert(0);
    }

    try {
        for (const ordered of orderedFlow) {
            inferOrdered(0, ordered);
        }
    } catch (e) {
        console.error(e);
    }

    const result: FlowGraphContext = {
        problems: [],
        nodes: {},
        env: flowEnv,
    };

    return result;

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
