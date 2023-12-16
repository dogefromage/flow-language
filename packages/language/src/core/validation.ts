import _ from "lodash";
import { ArgumentRowState, CallNode, CallNodeContext, ConnectionReference, ConnectionReferencePair, DocumentContext, EnvSymbolRow, Environment, FlowDocument, FlowGraph, FlowGraphContext, FunctionNode, FunctionNodeContext, FunctionSignature, LanguageConfiguration, MaybeProblem, ReferenceContext, RowContext, TypeSignature, decodeOutputRef, decodeParameterRef, referenceDigest } from "../types";
import { generalizeInPlace, generalizeType, instantiateType, unifyTypes } from "../typesystem/core";
import { TArrow, TExpr, createGenericNamingContext, newUnboundVar, populateGenericNamingContext, tyToString, typeConstructors } from "../typesystem/typeExpr";
import { assert } from "../utils";
import { createEnvironment, getEnvironmentSignature, getEnvironmentSignatureOfKind, pushEnv } from "./environment";
import { OrderedGraph } from "./graph";

const { trecord, tconst, tapp, tarrow, tgeneric } = typeConstructors;

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

function referenceInWords(ref: ConnectionReference) {
    switch (ref.kind) {
        case 'output':
            return `output of call #${ref.nodeId}`;
        case 'parameter':
            return `parameter ${ref.parameter} of function #${ref.nodeId}`;
    }
    assert(false);
}

interface OrderingResult {
    referenceContexts: Record<string, ReferenceContext>;
    order: OrderedFlowNode[];
}

function orderFlowGraph(flow: FlowGraph): OrderingResult {
    const result: OrderingResult = {
        order: [],
        referenceContexts: {},
    };

    const verticesOfG: string[] = [];
    // const allFunctions: string[] = [];
    for (const element of Object.values(flow.nodes)) {
        switch (element.kind) {
            case 'call':
                verticesOfG.push(element.id);
                break;
            case 'function':
                verticesOfG.push(functionStart(element.id));
                verticesOfG.push(functionEnd(element.id));
                // allFunctions.push(element.id);
                break;
            case 'comment':
                break;
            default:
                assert(0); // unknown
        }
    }

    interface TimestampedEdge {
        fromVert: string;
        toVert: string;
        timestamp: number;
        refSourceId: string;
        ref: ConnectionReference;
    }
    const timestampedEdges: TimestampedEdge[] = [];
    const allFunctions: string[] = [];

    function getDependency(ref: ConnectionReference) {
        if (ref.kind === 'parameter') {
            return functionStart(ref.nodeId);
        } else {
            return ref.nodeId;
        }
    }

    for (const element of Object.values(flow.nodes)) {
        switch (element.kind) {
            case 'call': {
                const call = element;
                for (const arg of Object.values(call.argumentMap)) {
                    for (const connection of Object.values(arg.references)) {
                        if (connection.valueRef != null) {
                            timestampedEdges.push({
                                fromVert: getDependency(connection.valueRef),
                                toVert: call.id,
                                timestamp: connection.valueRef.__timestamp,
                                refSourceId: call.id,
                                ref: connection.valueRef,
                            });
                        }
                    }
                }
                break;
            }
            case 'function': {
                const fun = element;
                allFunctions.push(fun.id);
                if (fun.result.valueRef != null) {
                    timestampedEdges.push({
                        fromVert: getDependency(fun.result.valueRef),
                        toVert: functionEnd(fun.id),
                        timestamp: fun.result.valueRef.__timestamp,
                        refSourceId: fun.id,
                        ref: fun.result.valueRef,
                    });
                }
                break;
            }
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
    const G = new OrderedGraph(verticesOfG);
    for (const fun of allFunctions) {
        G.addEdge(functionStart(fun), functionEnd(fun));
    }
    
    // sort edges by timestamp
    // this will make errors more accurate, since latest change could cause a cycle
    timestampedEdges.sort((a, b) => a.timestamp - b.timestamp);

    for (const timestampedEdge of timestampedEdges) {
        const context: ReferenceContext = {
            kind: 'reference',
            problems: [],
        };
        const referenceTag = referenceDigest(timestampedEdge.ref) + ';' + timestampedEdge.refSourceId;
        result.referenceContexts[referenceTag] = context;

        G.addEdge(timestampedEdge.fromVert, timestampedEdge.toVert);
        
        G.calculatePrePostOrderAndCycles();
        if (G.cycles.length > 0) {
            let referenceName = referenceInWords(timestampedEdge.ref);
            context.problems.push({
                message: `Cycle detected after adding connection. ${
                    _.capitalize(referenceName)} depends on node #${timestampedEdge.refSourceId
                    } and can not be used to calculate its value.`,
            });
            return result;
        }

        // TODO: really bad time complexity
        G.calculateReachability();
        for (const f of allFunctions) {
            for (const g of allFunctions) {
                if (f !== g && G.isReachable(functionStart(f), functionEnd(g))) {
                    G.addEdge(functionStart(f), functionStart(g));
                    G.addEdge(functionEnd(g), functionEnd(f));
                }
            }
        }
        
        G.calculatePrePostOrderAndCycles();
        if (G.cycles.length > 0) {
            // let referenceName = referenceInWords(timestampedEdge.ref);
            context.problems.push({
                message: `Cannot resolve function relations. This connection passes a value to a more general scope which is not allowed.`,
            });
            return result;
        }
    }

    const topSort = G.sortTopologically();
    // console.log(topSordt);

    // build final order
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
            const top = stack.at(-1);
            if (top != null) {
                top.children.push(functionBlock);
            } else {
                result.order.push(functionBlock);
            }
            stack.push(functionBlock);
        }
        else if (itemId.endsWith(':out')) {
            const funId = functionId(itemId);
            const top = stack.pop();
            if (top == null || top.element.id !== funId) {
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
                result.order.push(orderedNode);
            }
        }
    }
    return result;

    // const verticesOfG: string[] = [];
    // const allFunctions: string[] = [];
    // for (const element of Object.values(flow.nodes)) {
    //     switch (element.kind) {
    //         case 'call':
    //             verticesOfG.push(element.id);
    //             break;
    //         case 'function':
    //             verticesOfG.push(functionStart(element.id));
    //             verticesOfG.push(functionEnd(element.id));
    //             allFunctions.push(element.id);
    //             break;
    //         case 'comment':
    //             break;
    //         default:
    //             assert(0); // unknown
    //     }
    // }

    // /**
    //  * G represents temporal dependencies inside graph.
    //  * if a -> b then a must occur before b.
    //  */
    // // reversed graph of G
    // const reversedG = new OrderedGraph(verticesOfG);

    // function getDependency(ref: ConnectionReference) {
    //     if (ref.kind === 'parameter') {
    //         return functionStart(ref.nodeId);
    //     } else {
    //         return ref.nodeId;
    //     }
    // }

    // for (const element of Object.values(flow.nodes)) {
    //     switch (element.kind) {
    //         case 'call': {
    //             const callNode = element;
    //             const deps: string[] = []; // duplicates dont matter since graph class checks
    //             for (const arg of Object.values(callNode.argumentMap)) {
    //                 for (const connection of Object.values(arg.references)) {
    //                     if (connection.valueRef != null) {
    //                         deps.push(getDependency(connection.valueRef));
    //                     }
    //                 }
    //             }
    //             reversedG.addEdgesFrom(callNode.id, ...deps);
    //             break;
    //         }
    //         case 'function': {
    //             const functionNode = element;
    //             const deps: string[] = [
    //                 functionStart(functionNode.id), // function end must come before function start
    //             ];
    //             if (functionNode.result.valueRef != null) {
    //                 deps.push(getDependency(functionNode.result.valueRef));
    //             }
    //             reversedG.addEdgesFrom(functionEnd(functionNode.id), ...deps);
    //             break;
    //         }
    //         case 'comment':
    //             break;
    //         default:
    //             assert(0); // unknown
    //     }
    // }

    // const G = reversedG.reverse();

    // /**
    //  * H contains all functions.
    //  * An edge from f to g represents that g must be contained 
    //  * in f for the program to work correctly.
    //  */
    // const H = new OrderedGraph(allFunctions);

    // /**
    //  * Edge (f,g) must be in H iff f:in ---> g:out is a path in G.
    //  */
    // G.calculateReachability();
    // for (const f of allFunctions) {
    //     for (const g of allFunctions) {
    //         if (f !== g && G.isReachable(functionStart(f), functionEnd(g))) {
    //             H.addEdgesFrom(f, g);
    //         }
    //     }
    // }

    // /**
    //  * H must be a tree for the program to be valid.
    //  * If a function f inside H has multiple parents, 
    //  * one must be decided.
    //  */

    // // for now just error if multiple parents
    // H.calculateDegrees();
    // for (const f of allFunctions) {
    //     if (H.getInDegree(f) > 1) {
    //         throw new Error(`Parenting function of '${f}' must be decided.`);
    //     }
    // }

    // /**
    //  * For every edge (f,g) in H, the following relation must hold:
    //  * 
    //  *  f:in < g:in
    //  *                g:out < f:out
    //  * 
    //  * This can be added to G
    //  */
    // for (const [f, g] of H.edges()) {
    //     G.addEdgesFrom(functionStart(f), functionStart(g));
    //     G.addEdgesFrom(functionEnd(g), functionEnd(f));
    // }

    // /**
    //  * The final ordering is the topological sort of G.
    //  */
    // const topSort = G.sortTopologically();

    // // build final order
    // const orderedFlow: OrderedFlowNode[] = [];
    // const stack: FunctionBlock[] = [];

    // // console.log(topSort);

    // for (const itemId of topSort) {
    //     if (itemId.endsWith(':in')) {
    //         const funId = functionId(itemId);
    //         const functionNode = flow.nodes[funId] as FunctionNode;
    //         assert(functionNode?.kind === 'function');
    //         const functionBlock: FunctionBlock = {
    //             kind: 'function',
    //             element: functionNode,
    //             children: [],
    //         };
    //         const top = stack.at(-1);
    //         if (top != null) {
    //             top.children.push(functionBlock);
    //         } else {
    //             orderedFlow.push(functionBlock);
    //         }
    //         stack.push(functionBlock);
    //     }
    //     else if (itemId.endsWith(':out')) {
    //         const funId = functionId(itemId);
    //         const top = stack.pop();
    //         if (top == null || top.element.id !== funId) {
    //             throw new Error(`Invalid ordering of function bounds.`);
    //         }
    //     }
    //     else {
    //         const node = flow.nodes[itemId] as CallNode;
    //         assert(node);
    //         const top = stack.at(-1);
    //         const orderedNode: OrderedFlowNode = { kind: 'single', element: node };
    //         if (top != null) {
    //             top.children.push(orderedNode);
    //         } else {
    //             orderedFlow.push(orderedNode);
    //         }
    //     }
    // }
    // return orderedFlow;
}

function maybeUnify(a: TExpr, b: TExpr): MaybeProblem<void> {
    try {
        unifyTypes(a, b);
        return MaybeProblem.ok(undefined);
    } catch (e: any) {
        return MaybeProblem.problem({ message: e.message });
    }
}

function resolveReference(
    env: Environment, path: string[], level: number, refPair: ConnectionReferencePair
): MaybeProblem<TExpr> {
    const ref = refPair.typeRef || refPair.valueRef;
    if (!ref) {
        return MaybeProblem.problem({ message: `Expected a connection.` });
    }
    const [identifier, accessor] = referenceDigest(ref).split('.');

    return getEnvironmentSignature(env, identifier, path).flatMap(sig => {
        const type = sig.type;

        if (accessor == null) {
            return MaybeProblem.ok(type);
        }
        // select field using unification
        const accessedField = newUnboundVar(level);
        const rest = newUnboundVar(level);
        const recType: TExpr = trecord({ [accessor]: accessedField }, rest);

        const unification = maybeUnify(type, recType);
        if (unification.kind() === 'problem') {
            return unification
                .mapProblem(p => ({ message: `Could not access field '${accessor}' in '${identifier}'.` }))
                .cast<TExpr>();
        }

        return MaybeProblem.ok(accessedField);
    });
}

function resolveArgumentRow(
    env: Environment, path: string[], level: number, argRow: ArgumentRowState
): MaybeProblem<TExpr> {
    switch (argRow.exprType) {
        case 'initializer': {
            const hasInitializer =
                argRow.references[0]?.typeRef != null ||
                argRow.references[0]?.valueRef != null;
            if (hasInitializer) {
                return resolveReference(env, path, level, argRow.references[0] || {});
            } else if (argRow.value != null) {
                // TODO: after all types are constrained, validate stored initializer value
                return MaybeProblem.ok(tconst(typeof argRow.value));
            } else {
                return MaybeProblem.problem({
                    message: `Expected either value reference or initializer value on argument row of type '${argRow.exprType}'.`
                });
            }
        }
        case 'structure': {
            const fieldMap: Record<string, TExpr> = {};
            for (const [key, ref] of Object.entries(argRow.references)) {
                const refTypeMaybe = resolveReference(env, path, level, ref);
                if (refTypeMaybe.kind() === 'problem') {
                    return refTypeMaybe; // pass on error, maybe update message
                }
                fieldMap[key] = refTypeMaybe.result();
            }
            return MaybeProblem.ok(trecord(fieldMap));
        }
    }
    assert(false);
}

function matchFunctionType(ty: TExpr): MaybeProblem<TArrow> {
    if (ty.kind === 'ARROW') {
        return MaybeProblem.ok(ty);
    }
    if (ty.kind === 'VAR') {
        if (ty.ref.kind === 'LINK') {
            return matchFunctionType(ty.ref.type);
        }
        else if (ty.ref.kind === 'UNBOUND') {
            const level = ty.ref.level;
            const arrowTy = tarrow(newUnboundVar(level), newUnboundVar(level));
            ty.ref = { kind: 'LINK', type: arrowTy };
            return MaybeProblem.ok(arrowTy);
        }
    }
    return MaybeProblem.problem({ message: `Expected a function. Type of kind '${
        ty.kind}' cannot be used for application.` });
}

export const validateDocument = (document: FlowDocument, configuration: LanguageConfiguration) => {
    const result: DocumentContext = {
        flowContexts: {},
        problems: [],
    };

    let envWithModules = createEnvironment();
    for (const mod of configuration.modules) {
        envWithModules = pushEnv(envWithModules, mod.row);
    }

    const documentPath = [ 'document' ]; // TODO: change this to document id or better

    for (const flow of Object.values(document.flows)) {
        const flowContext = validateFlow(flow, envWithModules, documentPath);
        result.flowContexts[flow.id] = flowContext;
    }
    return result;
};

const validateFlow = (
    flow: FlowGraph,
    baseEnv: Environment,
    documentPath: string[],
): FlowGraphContext => {
    
    const orderResult = orderFlowGraph(flow);
    // console.log(orderedFlow);

    const path = [...documentPath, flow.id];
    const flowBaseLevel = 1;

    // since all node ids are assumed to be distinct we do not have to worry about scoping.
    // the environment can hold the whole flow content at once without having to shadow definitions from outside.

    // populate environment with local function signatures
    const functionSymbolRow: EnvSymbolRow = { path: path, symbols: {} };
    for (const node of Object.values(flow.nodes)) {
        if (node.kind === 'function') {
            const paramMap = _.mapValues(node.parameters, param => newUnboundVar(flowBaseLevel));
            const paramRecord = trecord(paramMap);
            const resultType = newUnboundVar(flowBaseLevel);
            const funType = tarrow(paramRecord, resultType);
            const funSignature: FunctionSignature = {
                kind: 'function',
                type: funType,
                attributes: {},
                parameters: _.mapValues(node.parameters, param => ({ id: param.id })),
                output: {},
            };
            functionSymbolRow.symbols[node.id] = funSignature;
        }
    }

    const flowBaseEnv = pushEnv(baseEnv, functionSymbolRow);
    const flowContext: FlowGraphContext = {
        problems: [],
        nodes: {},
        env: flowBaseEnv, // TODO exports
        namingContext: createGenericNamingContext(),
        references: orderResult.referenceContexts,
    };

    let env = flowBaseEnv;

    function inferOrdered(level: number, orderedNode: OrderedFlowNode) {

        function validateFunction(fnBlock: FunctionBlock) {
            const funNode = fnBlock.element;

            // infer function type
            const insideLevel = level + 1;
            const paramTypeMap: Record<string, TExpr> = {};
            for (const param of Object.keys(funNode.parameters)) {
                const newVar = newUnboundVar(insideLevel);
                paramTypeMap[param] = newVar;
                const paramIdentifier = `${funNode.id}?${param}`;
                const typeSig: TypeSignature = { kind: 'type', type: newVar };
                env = pushEnv(env, { path: path, symbols: { [paramIdentifier]: typeSig } })
            }

            for (const child of fnBlock.children) {
                inferOrdered(insideLevel, child);
            }

            const resultContext: RowContext = {
                problems: [],
                type: null,
            }
            const resultTypeMaybe = resolveReference(env, path, level, funNode.result)
            let resultType: TExpr;
            if (resultTypeMaybe.kind() === 'ok') {
                resultType = resultTypeMaybe.result();
            } else {
                resultType = newUnboundVar(insideLevel);
                resultContext.problems.push(resultTypeMaybe.problem());
            }

            const constructedType = tarrow(trecord(paramTypeMap), resultType);
            const constructedGeneralizedType = generalizeType(insideLevel, constructedType);

            const functionSignature = getEnvironmentSignatureOfKind<FunctionSignature>(env, funNode.id, path, 'function')
                .result(); // should not fail since we defined it above
            const definedInstantiatedType = instantiateType(insideLevel, functionSignature.type);

            const funContext: FunctionNodeContext = {
                kind: 'function',
                problems: [],
                signature: functionSignature,
                result: resultContext,
            };
            flowContext.nodes[funNode.id] = funContext;

            const unification = maybeUnify(definedInstantiatedType, constructedGeneralizedType);
            if (unification.kind() === 'problem') {
                funContext.problems.push(unification.problem());
            }
        }

        function validateCall(callNode: CallNode) {
            const callContext: CallNodeContext = {
                kind: 'call',
                problems: [],
                inputRows: {},
                outputType: null,
                signature: null,
            };
            flowContext.nodes[callNode.id] = callContext;

            const sigMaybe = getEnvironmentSignatureOfKind<FunctionSignature>(
                env, callNode.functionId, path, 'function');
            if (sigMaybe.kind() === 'problem') {
                callContext.problems.push(sigMaybe.problem());
                return;
            }

            const sig = sigMaybe.result();
            callContext.signature = sig;
            const instantiatedFunType = instantiateType(level, sig.type);
            const arrowTypeMaybe = matchFunctionType(instantiatedFunType);
            if (arrowTypeMaybe.kind() === 'problem') {
                callContext.problems.push(arrowTypeMaybe.problem());
                return;
            }
            const { param, ret } = arrowTypeMaybe.result();

            const argMap: Record<string, TExpr> = {};
            for (const arg of Object.values(callNode.argumentMap)) {
                const argContext: RowContext = {
                    problems: [],
                    type: null,
                };
                callContext.inputRows[arg.id] = argContext;
                const argTypeMaybe = resolveArgumentRow(env, path, level, arg);
                if (argTypeMaybe.kind() === 'problem') {
                    argContext.problems.push(argTypeMaybe.problem());
                    argMap[arg.id] = newUnboundVar(level);
                } else {
                    argContext.type = argMap[arg.id] = argTypeMaybe.result();
                }
            }
            const argRecord = trecord(argMap);
            const unification = maybeUnify(param, argRecord);
            if (unification.kind() === 'problem') {
                callContext.problems.push(unification.problem());
            }

            // const generalRet = generalizeType(level, ret); // UNSURE
            env = pushEnv(env, {
                path,
                symbols: { [callNode.id]: { kind: 'type', type: ret } },
            });

            callContext.outputType = ret;
        }

        if (orderedNode.kind === 'function') {
            return validateFunction(orderedNode);
        }
        if (orderedNode.kind === 'single' &&
            orderedNode.element.kind === 'call') {
            return validateCall(orderedNode.element);
        }
        assert(false);
    }

    for (const ordered of orderResult.order) {
        inferOrdered(flowBaseLevel, ordered);
    }

    // "Fixate" types by generalizing every node.
    // also give every generic a unique var literal for displaying in editor
    for (const node of Object.values(flow.nodes)) {
        const nodeMaybe = getEnvironmentSignature(env, node.id, path);
        if (nodeMaybe.kind() === 'problem') continue;
        const nodeTy = nodeMaybe.result().type;
        generalizeInPlace(0, nodeTy);
        populateGenericNamingContext(nodeTy, flowContext.namingContext);
        // console.log(`#${node.id}: ${tyToString(nodeTy, flowContext.namingContext)}`);
    }

    return flowContext;

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
