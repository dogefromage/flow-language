import { createSlice } from "@reduxjs/toolkit";
import { Draft, original } from "immer";
import * as lang from "noodle-language";
import { useCallback } from "react";
import { defaultFlows } from "../content/defaultDocument";
import { RootState } from "../redux/rootReducer";
import { FLOW_REGION_MIN_SIZE } from "../styles/flowStyles";
import { EditorClipboardData, RowSignatureBlueprint, Size2, UndoAction, Vec2 } from "../types";
import { except } from "../utils/exceptions";
import { flowsIdRegex, listItemRegex } from "../utils/flows";
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
function getRegion(s: Draft<FlowsSliceState>, a: { payload: { flowId: string, regionId: string } }) {
    const n = getFlow(s, a)?.regions[a.payload.regionId];
    if (!n) except(`Region with id '${a.payload.regionId}' not found`);
    return n;
}

function removeConnectionsToNodes(g: lang.FlowGraph, nodes: Set<string>) {
    for (const node of Object.values(g.nodes)) {
        for (const [rowId, rowState] of Object.entries(node.rowStates)) {
            for (const key of Object.keys(rowState.connections)) {
                const conn = rowState.connections[key];
                if (nodes.has(conn.nodeId)) {
                    delete rowState.connections[key];
                }
            }
        }
    }
}

const initialState: FlowsSliceState = { ...defaultFlows };

// function findUniquePortId<T extends { id: string }>(ports: T[]) {
//     for (let i = 0; true; i++) {
//         let id = i.toString(36);
//         if (ports.find(p => p.id == id) == null) {
//             return id;
//         }
//     }
// }

// function listConnectionsToArr(obj: Record<string, lang.FlowConnection>) {
//     const arr: lang.FlowConnection[] = [];
//     for (const key of Object.keys(obj)) {
//         if (key.match(/^\d+$/)) {
//             arr[parseInt(key)] = obj[key];
//         }
//     }
//     // filter holes
//     const unholy = arr.filter(x => x != null);
//     return unholy;
// }

function getNextId(usedIds: string[]) {
    const gen = lang.createIdGenerator(...usedIds);
    return gen.next().value!;
}

type ListedState = lang.InputRowSignature | lang.TemplateParameter;
type RowSignature = lang.InputRowSignature | lang.OutputRowSignature;

function createRowSignature(id: string, label: string, blueprint: RowSignatureBlueprint) {
    const s = {
        id,
        rowType: blueprint.rowType,
        specifier: blueprint.specifier,
    }
    return s as RowSignature;
}

export const flowsSlice = createSlice({
    name: 'flows',
    initialState,
    reducers: {
        create: (s, a: UndoAction<{
            flowId: string;
            signature: lang.AnonymousFlowSignature,
        }>) => {
            let id = a.payload.flowId;
            if (!flowsIdRegex.test(id)) {
                except(`Invalid characters in id '${id}'`);
            }
            if (s[id] != null) {
                except(`Flow with id '${id}' already exists!`);
            }

            const flow: lang.FlowGraph = {
                ...a.payload.signature,
                id,
                imports: ['standard'],
                attributes: {},
                nodes: {
                    a: { id: 'a', signature: { path: `document::${id}::input` }, position: { x: 400, y: 200 }, rowStates: {} },
                    b: { id: 'b', signature: { path: `document::${id}::output` }, position: { x: 1000, y: 200 }, rowStates: {} },
                },
                regions: {},
            }
            s[id] = flow as any;
        },
        remove: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string }>) => {
            delete s[a.payload.flowId];
        },
        rename: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, name: string }>) => {
            const g = getFlow(s, a);
            // g.name = a.payload.name;
        },
        setAttribute: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, key: string, value?: string }>) => {
            const g = getFlow(s, a);

            if (a.payload.value != null) {
                g.attributes[a.payload.key] = a.payload.value;
            } else {
                delete g.attributes[a.payload.key];
            }
        },
        addNode: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, signature: lang.NamespacePath, 
            position: Vec2, rowStates?: lang.FlowNode['rowStates'], nodeId?: string }>) => {            
            const g = getFlow(s, a);
            const nodeId = a.payload.nodeId || getNextId(Object.keys(g.nodes));
            if (g.nodes[nodeId] != null) {
                except(`Node with id=${nodeId} already in flow ${a.payload.flowId}.`);
            }
            const node: lang.FlowNode = {
                id: nodeId,
                signature: a.payload.signature,
                rowStates: a.payload.rowStates || {},
                position: a.payload.position,
            }
            g.nodes[node.id] = node;
        },
        removeSelection: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: lang.FlowSelection }>) => {
            const g = getFlow(s, a);
            const removedNodeIds = new Set<string>();
            for (const item of a.payload.selection.items) {
                if (item.type === 'node') {
                    delete g.nodes[item.id];
                    removedNodeIds.add(item.id);
                } 
                if (item.type === 'region') {
                    delete g.regions[item.id];
                }
            }
            removeConnectionsToNodes(g, removedNodeIds);
        },
        updateNodeSignature: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, signature: lang.NamespacePath }>) => {
            getNode(s, a).signature = a.payload.signature;
        },
        moveSelection: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: lang.FlowSelection, delta: Vec2 }>) => {
            const g = getFlow(s, a);
            for (const selItem of a.payload.selection.items) {
                let element: { position: Vec2 } | undefined;
                if (selItem.type === 'node')   element = g.nodes[selItem.id];
                if (selItem.type === 'region') element = g.regions[selItem.id];
                if (!element) continue;
                element.position.x += a.payload.delta.x;
                element.position.y += a.payload.delta.y;
            }
        },
        addRegion: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, 
            position: Vec2, size?: Size2, regionId?: string }>) => {            
                const g = getFlow(s, a);
                const regionId = a.payload.regionId || getNextId(Object.keys(g.regions));
                if (g.regions[regionId] != null) {
                    except(`Region with id=${regionId} already in flow ${a.payload.flowId}.`);
                }
                const region: lang.FlowRegion = {
                    id: regionId,
                    position: a.payload.position,
                    attributes: {},
                    size: a.payload.size || FLOW_REGION_MIN_SIZE,
                }
                g.regions[region.id] = region;
        },
        resizeRegion: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, regionId: string, size: Size2 }>) => {
            const r = getRegion(s, a);
            const clamped: Size2 = {
                w: Math.max(FLOW_REGION_MIN_SIZE.w, a.payload.size.w),
                h: Math.max(FLOW_REGION_MIN_SIZE.h, a.payload.size.h),
            };
            r.size = clamped;
        },
        setRegionAttribute: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, regionId: string, key: string, value: string }>) => {
            const r = getRegion(s, a);
            r.attributes[a.payload.key] = a.payload.value;
        },
        setRowValue: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, rowId: string, rowValue: lang.InitializerValue }>) => {
            const n = getNode(s, a);
            // init default
            n.rowStates[a.payload.rowId] ||= { connections: {}, value: null };
            // set value
            n.rowStates[a.payload.rowId].value = a.payload.rowValue;
        },
        addConnection: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string,
            locations: [lang.JointLocation, lang.JointLocation],
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

            const inputLocation = resolvedLocations
                .find(l => l.direction === 'input') as lang.InputJointLocation | undefined;
            const outputLocation = resolvedLocations
                .find(l => l.direction === 'output') as lang.OutputJointLocation | undefined;
            if (!inputLocation || !outputLocation ||
                inputLocation.nodeId === outputLocation.nodeId) {
                return;
            }

            const inputNode = getNode(s, {
                payload: {
                    nodeId: inputLocation.nodeId,
                    flowId: a.payload.flowId,
                }
            });
            if (!inputNode) {
                except(`Couldn't find input node.`);
            }
            const newConn: lang.FlowConnection = {
                nodeId: outputLocation.nodeId,
                accessor: outputLocation.accessor,
            };

            inputNode.rowStates[inputLocation.rowId] ||= { connections: {}, value: null };
            const rs = inputNode.rowStates[inputLocation.rowId];

            rs.connections[inputLocation.accessor] = newConn;
        },
        removeConnection: (s: Draft<FlowsSliceState>,
            a: UndoAction<{ flowId: string, input: lang.InputJointLocation }>) => {
            const g = getFlow(s, a);
            const { nodeId, rowId, accessor } = a.payload.input;
            const nodeState = g.nodes[nodeId]?.rowStates[rowId];
            if (!nodeState) return;
            delete nodeState.connections[accessor];
        },
        addListItem: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, itemId: string, prop: 'inputs' | 'generics' }>) => {
            const g = getFlow(s, a);
            const list: ListedState[] = g[a.payload.prop];
            const itemId = a.payload.itemId;
            if (!listItemRegex.test(itemId)) {
                except(`Invalid item name.`);
            }
            if (list.find(el => el.id === itemId)) {
                except(`Item with id='${itemId}' already in list.`);
            }
            if (a.payload.prop === 'inputs') {
                const defaultInput: RowSignatureBlueprint = { rowType: 'input-simple', specifier: lang.createAnyType() };
                const port = createRowSignature(itemId, 'New Input', defaultInput);
                list.push(port as lang.InputRowSignature);
            }
            if (a.payload.prop === 'generics') {
                list.push({ id: itemId, constraint: null });
            }
        },
        removeListItem: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, portId: string, prop: 'inputs' | 'generics' }>) => {
            const g = getFlow(s, a);
            const list: ListedState[] = g[a.payload.prop];
            const index = list.findIndex(i => i.id === a.payload.portId);
            if (index >= 0) {
                list.splice(index, 1);
            }
        },
        reorderList: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, newOrder: string[], prop: 'inputs' | 'generics' }>) => {
            const g = getFlow(s, a);
            const list: ListedState[] = g[a.payload.prop];
            const newRows = a.payload.newOrder
                .map(rowId => list.find(row => row.id === rowId));
            if (!newRows.every(row => row != null)) {
                except('Invalid row ids passed');
            }
            g[a.payload.prop] = newRows as any[];
        },
        replaceInput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, rowId: string, blueprint: RowSignatureBlueprint }>) => {
            const g = getFlow(s, a);
            const index = g.inputs.findIndex(i => i.id === a.payload.rowId);
            const port = g.inputs[index];
            if (port == null) {
                except(`Row not found.`);
            }
            const newPort = createRowSignature(port.id, port.id, a.payload.blueprint);
            g.inputs.splice(index, 1, newPort as lang.InputRowSignature);
        },
        updateInput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, portId: string, newState: Partial<RowSignature> }>) => {
            const g = getFlow(s, a);
            const port = g.inputs.find(p => p.id === a.payload.portId);
            if (port == null) {
                except(`Row not found`);
            }
            Object.assign(port, a.payload.newState);
        },
        replaceOutput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, blueprint: RowSignatureBlueprint }>) => {
            const g = getFlow(s, a);
            g.output = createRowSignature(g.output.id, g.output.id, a.payload.blueprint) as lang.OutputRowSignature;
        },
        updateOutput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, newState: Partial<RowSignature> }>) => {
            const g = getFlow(s, a);
            Object.assign(g.output, a.payload.newState);
        },
        replaceGeneric: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, genericId: string, constraint: lang.TemplateParameter['constraint'] }>) => {
            const g = getFlow(s, a);
            const generic = g.generics.find(gen => gen.id === a.payload.genericId);
            if (!generic) except(`Could not find generic`);
            generic.constraint = a.payload.constraint;
        },
        pasteNodes: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, clipboard: EditorClipboardData }>) => {
            const originalFlow = lang.assertDef(original(getFlow(s, a)));
            const referenceFlow = a.payload.clipboard.snapshot.flows[a.payload.clipboard.selection.flowId];
            if (!referenceFlow) {
                except('Missing reference flow.');
            }
            s[a.payload.flowId] = lang.pasteSelectedNodes(
                referenceFlow,
                originalFlow,
                a.payload.clipboard.selection, 
                { x: 20, y: 20 },
            );
        }
    }
});

export const {
    // CRUD
    create: flowsCreate,
    rename: flowsRename,
    remove: flowsRemove,
    // CONTENT
    setAttribute: flowsSetAttribute,
    addNode: flowsAddNode,
    removeSelection: flowsRemoveNodes,
    updateNodeSignature: flowsUpdateNodeSignature,
    moveSelection: flowsMoveSelection,
    addRegion: flowsAddRegion,
    resizeRegion: flowsResizeRegion,
    setRegionAttribute: flowsSetRegionAttribute,
    addConnection: flowsAddConnection,
    removeConnection: flowsRemoveConnection,
    setRowValue: flowsSetRowValue,
    // META LIST CRUD
    addListItem: flowsAddListItem,
    removeListItem: flowsRemoveListItem,
    reorderList: flowsReorderList,
    // META UPDATE
    replaceInput: flowsReplaceInput,
    updateInput: flowsUpdateInput,
    replaceOutput: flowsReplaceOutput,
    updateOutput: flowsUpdateOutput,
    replaceGeneric: flowsReplaceGeneric,
    // HIGHER ORDER
    pasteNodes: flowsPasteNodes,
} = flowsSlice.actions;

export const selectFlows = (state: RootState) => selectDocument(state).flows;

const selectSingleFlow = (flowId: string) => (state: RootState) =>
    selectFlows(state)[flowId] as lang.FlowGraph | undefined;
export const useSelectSingleFlow = (flowId: string) =>
    useCallback(selectSingleFlow(flowId), [flowId]);

const flowsReducer = flowsSlice.reducer;
export default flowsReducer;
