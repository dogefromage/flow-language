import { createSlice } from "@reduxjs/toolkit";
import { Draft } from "immer";
import _ from "lodash";
import * as lang from "noodle-language";
import { useCallback } from "react";
import { RootState } from "../redux/rootReducer";
import { FLOW_COMMENT_MIN_SIZE } from "../styles/flowStyles";
import { Size2, UndoAction, Vec2 } from "../types";
import { except } from "../utils";
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
function getNodeAs<T extends lang.FlowNode>(s: Draft<FlowsSliceState>, a: { payload: { flowId: string, nodeId: string } }, kind: lang.FlowNode['kind']) {
    const n = getNode(s, a);
    if (n.kind !== kind) except(`Node with id '${a.payload.nodeId}' is not of kind '${kind}'.`);
    return n as T;
}

function removeConnectionsToNodes(g: lang.FlowGraph, nodes: Set<string>) {
    console.warn(`TODO`);
    // for (const node of Object.values(g.nodes)) {
    //     for (const [_, rowState] of Object.entries(node.inputs)) {
    //         for (const [key, arg] of Object.entries(rowState.rowArguments)) {
    //             if (nodes.has(arg.valueRef?.nodeId!)) {
    //                 delete arg.valueRef;
    //             }
    //             if (nodes.has(arg.typeRef?.nodeId!)) {
    //                 delete arg.typeRef;
    //             }
    //             if (!arg.valueRef && !arg.typeRef) {
    //                 delete rowState.rowArguments[key];
    //             }
    //         }
    //     }
    // }
}

function cleanupRowArguments(rowArguments: Record<string, lang.ConnectionReferencePair>, accessor: string) {
    const value = rowArguments[accessor].valueRef;
    const type = rowArguments[accessor].typeRef;
    // merge into value and type
    if (value && type && value === type) {
        delete rowArguments[accessor].typeRef;
    }
    // empty
    if (!value && !type) {
        delete rowArguments[accessor];
    }
}

function getNextId(usedIds: string[]) {
    const gen = lang.createIdGenerator(...usedIds);
    return gen.next().value!;
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
                        kind: 'call', id: 'a', functionId: 'core/number/add' as lang.NamespacePath, 
                        position: { x: 400, y: 200 }, argumentMap: { x: { id: 'x', exprType: 'simple', references: {} } }, output: {}
                    },

                    b: { 
                        kind: 'call', id: 'b', functionId: 'core/number/number' as lang.NamespacePath, 
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
            flowId: string, signature: lang.FunctionSignature, signaturePath: lang.NamespacePath, position: Vec2, nodeId?: string
        }>) => {
            const g = getFlow(s, a);
            const nodeId = a.payload.nodeId || getNextId(Object.keys(g.nodes));
            if (g.nodes[nodeId] != null) {
                except(`Node with id=${nodeId} already in flow ${a.payload.flowId}.`);
            }
            const node: lang.FlowNode = {
                kind: 'call',
                id: nodeId,
                functionId: a.payload.signaturePath,
                argumentMap: _.mapValues(a.payload.signature.parameters, param => {
                    const arg: lang.ArgumentRowState = {
                        id: param.id,
                        exprType: 'simple',
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
        removeSelection: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: lang.FlowSelection }>) => {
            const g = getFlow(s, a);
            for (const item of a.payload.selection.nodes) {
                delete g.nodes[item];
            }
            removeConnectionsToNodes(g, new Set(a.payload.selection.nodes));
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
        setCommentAttribute: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, key: string, value: string }>) => {
            const comm = getNodeAs<lang.CommentNode>(s, a, 'comment');
            comm.attributes[a.payload.key] = a.payload.value;
        },
        // setRowValue: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, rowId: string, rowValue: lang.InitializerValue }>) => {
        //     const n = getNode(s, a);
        //     // init default
        //     n.inputs[a.payload.rowId] ||= { rowArguments: {}, value: null };
        //     // set value
        //     n.inputs[a.payload.rowId].value = a.payload.rowValue;
        // },
        // addConnection: (s: Draft<FlowsSliceState>, a: UndoAction<{
        //     flowId: string,
        //     locations: [lang.JointLocation, lang.JointLocation],
        //     syntax: lang.EdgeSyntacticType,
        // }>) => {
        //     const g = getFlow(s, a);

        //     let resolvedLocations = a.payload.locations.map(location => {
        //         if (location.nodeId === '*') {
        //             const lastCreatedId = lang.getLastestNodeId(...Object.keys(g.nodes));
        //             return {
        //                 ...location,
        //                 nodeId: lastCreatedId,
        //             };
        //         }
        //         return location;
        //     });

        //     const inputLocation = resolvedLocations
        //         .find(l => l.direction === 'input') as lang.InputJointLocation | undefined;
        //     const outputLocation = resolvedLocations
        //         .find(l => l.direction === 'output') as lang.OutputJointLocation | undefined;
        //     if (!inputLocation || !outputLocation ||
        //         inputLocation.nodeId === outputLocation.nodeId) {
        //         return;
        //     }

        //     const inputNode = getNode(s, {
        //         payload: {
        //             nodeId: inputLocation.nodeId,
        //             flowId: a.payload.flowId,
        //         }
        //     });
        //     if (!inputNode) {
        //         except(`Couldn't find input node.`);
        //     }
        //     const newConn: lang.FlowConnection = {
        //         nodeId: outputLocation.nodeId,
        //         accessor: outputLocation.accessor,
        //     };

        //     inputNode.inputs[inputLocation.rowId] ||= { rowArguments: {}, value: null };
        //     const rs = inputNode.inputs[inputLocation.rowId];
        //     const arg = (rs.rowArguments[inputLocation.accessor] ||= {});

        //     if (a.payload.syntax === 'type-only') {
        //         arg.typeRef = newConn;
        //     } else {
        //         arg.valueRef = newConn;
        //     }

        //     cleanupRowArguments(rs.rowArguments, inputLocation.accessor);
        // },
        // removeConnection: (s: Draft<FlowsSliceState>,
        //     a: UndoAction<{ flowId: string, input: lang.InputJointLocation, syntax: lang.EdgeSyntacticType }>) => {
        //     const g = getFlow(s, a);
        //     const { nodeId, rowId, accessor } = a.payload.input;
        //     const nodeState = g.nodes[nodeId]?.inputs[rowId];
        //     if (!nodeState) return;
        //     if (a.payload.syntax === 'type-only') {
        //         delete nodeState.rowArguments[accessor].typeRef;
        //     } else {
        //         delete nodeState.rowArguments[accessor].valueRef;
        //     }

        //     cleanupRowArguments(nodeState.rowArguments, accessor);
        // },
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
    removeSelection: flowsRemoveSelection,
    moveSelection: flowsMoveSelection,
    resizeComment: flowsResizeComment,
    setCommentAttribute: flowsSetCommentAttribute,
} = flowsSlice.actions;

export const selectFlows = (state: RootState) =>
    selectDocument(state).flows;

const selectSingleFlow = (flowId: string) => (state: RootState) =>
    selectFlows(state)[flowId] as lang.FlowGraph | undefined;
export const useSelectSingleFlow = (flowId: string) =>
    useCallback(selectSingleFlow(flowId), [flowId]);

const selectSingleFlowNode = (flowId: string, nodeId: string) => (state: RootState) =>
    selectFlows(state)[flowId].nodes[nodeId] as lang.FlowNode | undefined;
export const useSelectSingleFlowNode = (flowId: string, nodeId: string) =>
    useCallback(selectSingleFlowNode(flowId, nodeId), [flowId, nodeId]);

const flowsReducer = flowsSlice.reducer;

export default flowsReducer;