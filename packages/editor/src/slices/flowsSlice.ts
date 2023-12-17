import { createSlice } from "@reduxjs/toolkit";
import { Draft, original } from "immer";
import _ from "lodash";
import * as lang from "noodle-language";
import { useCallback } from "react";
import { FUNCTION_NODE_MIN_WIDTH } from "../components/FlowNodeFunction";
import { RootState } from "../redux/rootReducer";
import { FLOW_COMMENT_MIN_SIZE } from "../styles/flowStyles";
import { JointLocation, Size2, UndoAction, Vec2, createConnectionReference, getJointDir } from "../types";
import { assert, except } from "../utils";
import { flowsIdRegex } from "../utils/flows";
import { selectDocument } from "./documentSlice";

type FlowsSliceState = Record<string, lang.FlowGraph>;

function getFlow(s: Draft<FlowsSliceState>, a: { payload: { flowId: string } }) {
    const g = s[a.payload.flowId];
    if (!g) except(`Flow with id '${a.payload.flowId}' not found`);
    return g as any as lang.FlowGraph;
}

function getNode(s: Draft<FlowsSliceState>, a: { payload: { flowId: string, nodeId: string } }) {
    const n = getFlow(s, a)?.nodes[a.payload.nodeId];
    if (!n) except(`Node with id '${a.payload.nodeId}' not found`);
    return n;
}
function getNodeAs<T extends lang.FlowNode>(s: Draft<FlowsSliceState>, a: { payload: { flowId: string, nodeId: string } }, kind: T['kind']) {
    const n = getNode(s, a);
    if (n.kind !== kind) except(`Node with id '${a.payload.nodeId}' is not of kind '${kind}'.`);
    return n as T;
}

function removeReferencesStartingWith(g: lang.FlowGraph, ...prefixes: string[]) {
    for (const node of Object.values(g.nodes)) {
        switch (node.kind) {
            case 'call':
                for (const arg of Object.values(node.argumentMap)) {
                    for (const [key, pair] of Object.entries(arg.references)) {
                        if (pair.typeRef && prefixes.some(p => lang.referenceDigest(pair.typeRef!).startsWith(p))) {
                            delete pair.typeRef;
                        }
                        if (pair.valueRef && prefixes.some(p => lang.referenceDigest(pair.valueRef!).startsWith(p))) {
                            delete pair.valueRef;
                        }
                        cleanupReferenceArgMap(arg.references, key);
                    }
                }
                break;
            case 'function':
                if (node.result.typeRef && prefixes.some(p => lang.referenceDigest(node.result.typeRef!).startsWith(p))) {
                    delete node.result.typeRef;
                }
                if (node.result.valueRef && prefixes.some(p => lang.referenceDigest(node.result.valueRef!).startsWith(p))) {
                    delete node.result.valueRef;
                }
                cleanupReferenceSingle(node.result);
                break;
        }
    }
}

function cleanupReferenceArgMap(rowArguments: Record<string, lang.ConnectionReferencePair>, accessor: string) {
    const value = rowArguments[accessor].valueRef;
    const type = rowArguments[accessor].typeRef;
    // merge into value and type
    if (value && type &&
        lang.referenceDigest(value) === lang.referenceDigest(type)) {
        delete rowArguments[accessor].typeRef;
    }
    // empty
    if (!value && !type) {
        delete rowArguments[accessor];
    }
}
function cleanupReferenceSingle(pair: lang.ConnectionReferencePair) {
    // merge into value and type
    if (pair.typeRef && pair.valueRef && pair.valueRef === pair.typeRef) {
        delete pair.typeRef;
    }
}

function getNextId(usedIds: string[]) {
    const gen = lang.createIdGenerator(...usedIds);
    return gen.next().value!;
}

function getTimestamp() {
    return new Date().getTime();
}

// type ListedState = lang.InputRowSignature | lang.TemplateParameter;
// type RowSignature = lang.InputRowSignature | lang.OutputRowSignature;
// function createRowSignature(id: string, label: string, blueprint: RowSignatureBlueprint) {
//     const s = {
//         id,
//         rowType: blueprint.rowType,
//         specifier: blueprint.specifier,
//     }
//     return s as RowSignature;
// }

export const flowsSlice = createSlice({
    name: 'flows',
    initialState: {} as FlowsSliceState,
    reducers: {
        create: (s, a: UndoAction<{
            flowId: string;
            // signature: lang.AnonymousFlowSignature,
        }>) => {
            let id = a.payload.flowId;
            if (!flowsIdRegex.test(id)) {
                except(`Invalid characters in id '${id}'`);
            }
            if (s[id] != null) {
                except(`Flow with id '${id}' already exists!`);
            }

            const flow: lang.FlowGraph = {
                // ...a.payload.signature,
                id,
                imports: ['standard'],
                attributes: {},
                nodes: {
                    a: {
                        attributes: {},
                        kind: 'call', id: 'a', functionId: 'core/number/add' as string,
                        position: { x: 400, y: 200 }, argumentMap: { x: { id: 'x', exprType: 'initializer', references: {} } }, output: {}
                    },

                    b: {
                        attributes: {},
                        kind: 'call', id: 'b', functionId: 'core/number/number' as string,
                        position: { x: 1000, y: 200 }, argumentMap: {}, output: {}
                    },
                },
            }
            s[id] = flow as any;
        },
        remove: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string }>) => {
            delete s[a.payload.flowId];
        },
        setAttribute: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, key: string, value?: string }>) => {
            const g = getFlow(s, a);
            if (a.payload.value != null) {
                g.attributes[a.payload.key] = a.payload.value;
            } else {
                delete g.attributes[a.payload.key];
            }
        },
        addCallNode: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string, signature: lang.FunctionSignature, signaturePath: string, position: Vec2, nodeId?: string
        }>) => {
            const g = getFlow(s, a);
            const nodeId = a.payload.nodeId || getNextId(Object.keys(g.nodes));
            if (g.nodes[nodeId] != null) {
                except(`Node with id=${nodeId} already in flow ${a.payload.flowId}.`);
            }
            const node: lang.FlowNode = {
                kind: 'call',
                id: nodeId,
                attributes: {},
                functionId: a.payload.signaturePath,
                argumentMap: _.mapValues(a.payload.signature.parameters, param => {
                    const arg: lang.ArgumentRowState = {
                        id: param.id,
                        exprType: param.defaultExprType || 'initializer',
                        value: param.defaultValue,
                        references: {},
                    };
                    return arg;
                }),
                output: {},
                position: a.payload.position,
            }
            g.nodes[node.id] = node;
        },
        addCommentNode: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string, position: Vec2, size?: Size2, nodeId?: string
        }>) => {
            const g = getFlow(s, a);
            const nodeId = a.payload.nodeId || getNextId(Object.keys(g.nodes));
            if (g.nodes[nodeId] != null) {
                except(`Node with id=${nodeId} already in flow ${a.payload.flowId}.`);
            }
            const comment: lang.CommentNode = {
                kind: 'comment',
                id: nodeId,
                position: a.payload.position,
                attributes: {},
                size: a.payload.size || FLOW_COMMENT_MIN_SIZE,
            }
            g.nodes[comment.id] = comment;
        },
        addFunctionNode: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string, position: Vec2, width?: number, nodeId?: string
        }>) => {
            const g = getFlow(s, a);
            const nodeId = a.payload.nodeId || getNextId(Object.keys(g.nodes));
            if (g.nodes[nodeId] != null) {
                except(`Node with id=${nodeId} already in flow ${a.payload.flowId}.`);
            }
            const fun: lang.FunctionNode = {
                kind: 'function',
                id: nodeId,
                attributes: {},
                position: a.payload.position,
                width: a.payload.width || FUNCTION_NODE_MIN_WIDTH,
                parameters: {
                    u: { id: 'u', constraint: {} },
                },
                result: {},
                isExported: false,
            }
            g.nodes[fun.id] = fun;
        },
        setFunctionExported: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, exported: boolean }>) => {
            const fun = getNodeAs<lang.FunctionNode>(s, a, 'function');
            fun.isExported = a.payload.exported;
        },
        addFunctionParameter: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string, nodeId: string, parameterId?: string, /* parameter: lang.ParameterRowState, */
        }>) => {
            const fun = getNodeAs<lang.FunctionNode>(s, a, 'function');
            const parameterId = a.payload.parameterId || getNextId(Object.keys(fun.parameters));
            if (fun.parameters[parameterId] != null) {
                except(`Parameter with id=${parameterId} already in function ${a.payload.nodeId}.`);
            }
            fun.parameters[parameterId] = { id: parameterId, constraint: {} };
        },
        removeFunctionParameter: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string, nodeId: string, parameterId: string,
        }>) => {
            const g = getFlow(s, a);
            const fun = getNodeAs<lang.FunctionNode>(s, a, 'function');
            delete fun.parameters[a.payload.parameterId];
            const paramRef: lang.ParameterRerefence = {
                kind: 'parameter',
                nodeId: a.payload.nodeId, parameter: a.payload.parameterId, __timestamp: 0
            };
            removeReferencesStartingWith(g, lang.referenceDigest(paramRef));
        },
        removeSelection: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: lang.FlowSelection }>) => {
            const g = getFlow(s, a);
            for (const item of a.payload.selection.nodes) {
                delete g.nodes[item];
            }
            removeReferencesStartingWith(g, ...a.payload.selection.nodes);
        },
        moveSelection: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: lang.FlowSelection, delta: Vec2 }>) => {
            const g = getFlow(s, a);
            for (const nodeId of a.payload.selection.nodes) {
                const node = g.nodes[nodeId];
                if (!node) continue;
                node.position.x += a.payload.delta.x;
                node.position.y += a.payload.delta.y;
            }
        },
        resizeComment: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, size: Size2 }>) => {
            const comm = getNodeAs<lang.CommentNode>(s, a, 'comment');
            const clamped: Size2 = {
                w: Math.max(FLOW_COMMENT_MIN_SIZE.w, a.payload.size.w),
                h: Math.max(FLOW_COMMENT_MIN_SIZE.h, a.payload.size.h),
            };
            comm.size = clamped;
        },
        resizeFunction: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, width: number }>) => {
            const fun = getNodeAs<lang.FunctionNode>(s, a, 'function');
            fun.width = Math.max(FUNCTION_NODE_MIN_WIDTH, a.payload.width);
        },
        setSelectionAttribute: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: string[], key: string, value: string }>) => {
            const g = getFlow(s, a);
            for (const nodeId of a.payload.selection) {
                const node = g.nodes[nodeId];
                if (!node) continue;
                node.attributes[a.payload.key] = a.payload.value;
            }
        },
        setCallArgumentRowValue: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, rowId: string, rowValue: lang.InitializerValue }>) => {
            const n = getNodeAs<lang.CallNode>(s, a, 'call');
            // init default
            if (n.argumentMap[a.payload.rowId] == null) {
                except(`Row '${a.payload.rowId}' not found.`);
            }
            n.argumentMap[a.payload.rowId].value = a.payload.rowValue;
        },
        addConnection: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string,
            locations: [JointLocation, JointLocation],
            syntax: lang.ReferenceSyntacticType,
        }>) => {
            const g = getFlow(s, a);
            let resolvedLocations = a.payload.locations.map(location => {
                if (location.nodeId === '*') {
                    const lastCreatedId = lang.getLastestNodeId(...Object.keys(g.nodes));
                    return {
                        ...location,
                        nodeId: lastCreatedId,
                    };
                }
                return location;
            });

            const refereeLocation = resolvedLocations
                .find(l => getJointDir(l) === 'input');
            const referenceLocation = resolvedLocations
                .find(l => getJointDir(l) === 'output');
            if (!refereeLocation || !referenceLocation) {
                except(`Cannot connect provided joints.`);
            }

            const referee = getNode(s, {
                payload: { nodeId: refereeLocation.nodeId, flowId: a.payload.flowId }
            });

            if (refereeLocation.nodeId === referenceLocation.nodeId &&
                referee.kind !== 'function') {
                except(`Cannot add self-connection to node of kind ${referee.kind}.`);
            }

            const reference: lang.ConnectionReference =
                createConnectionReference(referenceLocation, getTimestamp());

            switch (refereeLocation.kind) {
                case 'argument':
                    assert(referee.kind === 'call');
                    const arg = referee.argumentMap[refereeLocation.argumentId];
                    if (!arg) except(`Argument with id '${refereeLocation.argumentId}' not found.`);
                    const accessor = refereeLocation.accessor ?? '0';
                    const pair = (arg.references[accessor] ||= {});
                    if (a.payload.syntax === 'type-only') {
                        pair.typeRef = reference;
                    } else {
                        pair.valueRef = reference;
                    }
                    cleanupReferenceArgMap(arg.references, accessor)
                    break;
                case 'result': {
                    assert(referee.kind === 'function');
                    const pair = referee.result;
                    if (a.payload.syntax === 'type-only') {
                        pair.typeRef = reference;
                    } else {
                        pair.valueRef = reference;
                    }
                    cleanupReferenceSingle(pair);
                    break;
                }
                default:
                    except(`Cannot add reference to joint of kind '${refereeLocation.kind}'.`);
            }
        },
        removeConnection: (s: Draft<FlowsSliceState>,
            a: UndoAction<{ flowId: string, input: JointLocation, syntax: lang.ReferenceSyntacticType }>) => {
            const node = getNode(s, { payload: { flowId: a.payload.flowId, nodeId: a.payload.input.nodeId } });
            const input = a.payload.input;
            if (input.kind === 'result') {
                assert(node.kind === 'function');
                if (a.payload.syntax === 'type-only') {
                    delete node.result.typeRef;
                } else {
                    delete node.result.valueRef;
                }
                cleanupReferenceSingle(node.result);
            }
            else if (input.kind === 'argument') {
                assert(node.kind === 'call');
                const arg = node.argumentMap[input.argumentId];
                if (!arg) except(`Argument with id '${input.argumentId}' not found.`);
                const accessor = input.accessor ?? '0';
                if (a.payload.syntax === 'type-only') {
                    delete arg.references[accessor].typeRef;
                } else {
                    delete arg.references[accessor].valueRef;
                }
                cleanupReferenceArgMap(arg.references, accessor);
            }
        },
        // renameConnectionAccessor: (s: Draft<FlowsSliceState>,
        //     a: UndoAction<{ flowId: string, input: lang.InputJointLocation, newAccessor: string }>) => {
        //     const node = getNode(s, { payload: { flowId: a.payload.flowId, nodeId: a.payload.input.nodeId } });
        //     const oldInput = a.payload.input;

        //     node.inputs[oldInput.rowId] ||= { rowArguments: {}, value: null };
        //     const rs = node.inputs[oldInput.rowId];

        //     if (rs.rowArguments[oldInput.accessor] != null &&
        //         oldInput.accessor !== a.payload.newAccessor) {
        //         rs.rowArguments[a.payload.newAccessor] = rs.rowArguments[oldInput.accessor];
        //         delete rs.rowArguments[oldInput.accessor];
        //     }
        // },
        // pasteNodes: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, clipboard: EditorClipboardData }>) => {
        //     const originalFlow = lang.assertDef(original(getFlow(s, a)));
        //     const referenceFlow = a.payload.clipboard.snapshot.flows[a.payload.clipboard.selection.flowId];
        //     if (!referenceFlow) {
        //         except('Missing reference flow.');
        //     }
        //     s[a.payload.flowId] = lang.pasteSelectedNodes(
        //         referenceFlow,
        //         originalFlow,
        //         a.payload.clipboard.selection,
        //         { x: 20, y: 20 },
        //     );
        // }
    }
});

export const {
    create: flowsCreate,
    remove: flowsRemove,
    setAttribute: flowsSetAttribute,
    addCallNode: flowsAddCallNode,
    addCommentNode: flowsAddCommentNode,
    addFunctionNode: flowsAddFunctionNode,
    addFunctionParameter: flowsAddFunctionParameter,
    setFunctionExported: flowsSetFunctionExported,
    removeFunctionParameter: flowsRemoveFunctionParameter,
    removeSelection: flowsRemoveSelection,
    moveSelection: flowsMoveSelection,
    resizeComment: flowsResizeComment,
    resizeFunction: flowsResizeFunction,
    setSelectionAttribute: flowsSetSelectionAttribute,
    addConnection: flowsAddConnection,
    removeConnection: flowsRemoveConnection,
    setCallArgumentRowValue: flowsSetCallArgumentRowValue,
} = flowsSlice.actions;

export const selectFlows = (state: RootState) =>
    selectDocument(state).flows;

const selectSingleFlow = (flowId: string) => (state: RootState) =>
    selectFlows(state)[flowId] as lang.FlowGraph | undefined;
export const useSelectSingleFlow = (flowId: string) =>
    useCallback(selectSingleFlow(flowId), [flowId]);

const selectFlowNode = (flowId: string, nodeId: string) => (state: RootState) =>
    selectFlows(state)[flowId].nodes[nodeId] as lang.FlowNode | undefined;
export const useSelectFlowNode = (flowId: string, nodeId: string) =>
    useCallback(selectFlowNode(flowId, nodeId), [flowId, nodeId]);

const flowsReducer = flowsSlice.reducer;

export default flowsReducer;