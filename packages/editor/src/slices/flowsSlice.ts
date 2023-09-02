import * as lang from "@fluss/language";
import { createSlice } from "@reduxjs/toolkit";
import { Draft, enableMapSet } from "immer";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { selectDocument } from "../redux/stateHooks";
import { RootState } from "../redux/store";
import { FlowsSliceState, UndoAction, Vec2, defaultFlows } from "../types";
import { RowSignatureBlueprint } from "../types/flowInspectorView";
import { getBasePowers } from "../utils/math";
enableMapSet();

function getFlow(s: Draft<FlowsSliceState>, a: { payload: { flowId: string } }) {
    const g = s[a.payload.flowId];
    if (!g) return console.error(`Flow with id ${a.payload.flowId} not found`);
    return g as any as lang.FlowGraph;
}

function getNode(s: Draft<FlowsSliceState>, a: { payload: { flowId: string, nodeId: string } }) {
    const n = getFlow(s, a)?.nodes[a.payload.nodeId];
    if (!n) return console.error(`Node with id ${a.payload.nodeId} not found`);
    return n;
}

function removeConnectionsToNodes(g: lang.FlowGraph, nodes: Set<string>) {
    for (const node of Object.values(g.nodes)) {
        for (const [rowId, rowState] of Object.entries(node.rowStates)) {
            for (let i = rowState.connections.length - 1; i >= 0; i--) {
                const conn = rowState.connections[i];
                if (nodes.has(conn.nodeId)) {
                    rowState.connections.splice(i, 1);
                }
            }
        }
    }
}

function generateAlphabeticalId(index: number) {
    const token = getBasePowers(index, 26)
        .reverse()
        .map(x => String.fromCharCode('a'.charCodeAt(0) + x))
        .join('');
    return token;
}

const initialState: FlowsSliceState = { ...defaultFlows };

function findUniquePortId<T extends { id: string }>(ports: T[]) {
    for (let i = 0; true; i++) {
        let id = i.toString(36);
        if (ports.find(p => p.id == id) == null) {
            return id;
        }
    }
}
type ListedState = lang.InputRowSignature | lang.GenericTag;
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
            // name: string;
            flowId?: string;
            signature: lang.AnonymousFlowSignature,
        }>) => {
            let id = a.payload.flowId;
            if (id == null) {
                do {
                    id = uuidv4();
                } while (s[id] != null);
            } else {
                if (!/^\w+$/.test(id)) {
                    return console.error(`Invalid characters in id '${id}'`);
                }
                if (s[id!] != null) {
                    return console.error(`Flow with id '${id}' already exists!`);
                }
            }

            const flow: lang.FlowGraph = {
                ...a.payload.signature,
                id,
                // name: a.payload.name,
                attributes: {},
                nodes: {
                    a: { id: 'a', signature: 'input', position: { x: 400, y: 200 }, rowStates: {} },
                    b: { id: 'b', signature: 'output', position: { x: 1000, y: 200 }, rowStates: {} },
                },
                idCounter: 2,
            }
            s[id] = flow as any;
        },
        remove: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string }>) => {
            delete s[a.payload.flowId];
        },
        rename: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, name: string }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            // g.name = a.payload.name;
        },
        setAttribute: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, key: string, value?: string }>) => {
            const g = getFlow(s, a);
            if (!g) return;

            if (a.payload.value != null) {
                g.attributes[a.payload.key] = a.payload.value;
            } else {
                delete g.attributes[a.payload.key];
            }
        },
        addNode: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, signatureId: string, position: Vec2, rowStates?: lang.FlowNode['rowStates'] }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const node: lang.FlowNode = {
                id: generateAlphabeticalId(g.idCounter++),
                signature: a.payload.signatureId,
                rowStates: a.payload.rowStates || {},
                position: a.payload.position,
            }
            g.nodes[node.id] = node;
        },
        removeNodes: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: string[] }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const targets = a.payload.selection;
            if (targets.length > 0) {
                for (const id of targets) {
                    delete g.nodes[id];
                }
                removeConnectionsToNodes(g, new Set(targets));
            }
        },
        positionNode: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, position: Vec2 }>) => {
            const n = getNode(s, a);
            if (!n) return;
            n.position = { ...a.payload.position };
        },
        moveSelection: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, selection: string[], delta: Vec2 }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            for (const id of a.payload.selection) {
                const node = g.nodes[id];
                if (!node) continue;
                node.position.x += a.payload.delta.x;
                node.position.y += a.payload.delta.y;
            }
        },
        setRowValue: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, nodeId: string, rowId: string, rowValue: lang.InitializerValue }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const node = g.nodes[a.payload.nodeId];
            if (!node) {
                return console.error(`Could not find node ${a.payload.nodeId}`);
            }
            // init default
            node.rowStates[a.payload.rowId] ||= { connections: [], value: null };
            // set value
            node.rowStates[a.payload.rowId].value = a.payload.rowValue;
        },
        addLink: (s: Draft<FlowsSliceState>, a: UndoAction<{
            flowId: string,
            locations: [lang.JointLocation, lang.JointLocation],
        }>) => {
            const g = getFlow(s, a);
            if (!g) return;

            let resolvedLocations = a.payload.locations.map(location => {
                if (location.nodeId === '*') {
                    return {
                        ...location,
                        nodeId: generateAlphabeticalId(g.idCounter - 1),
                    };
                }
                return location;
            });

            const inputLocation = resolvedLocations
                .find(l => l.direction === 'input') as lang.InputJointLocation | undefined;
            const outputLocation = resolvedLocations
                .find(l => l.direction === 'output') as lang.OutputJointLocation | undefined;
            if (!inputLocation || !outputLocation) {
                return console.error(`Must provide both input and output location.`);
            }

            if (inputLocation.nodeId === outputLocation.nodeId) {
                return console.error(`Cannot create link with both sides on same node.`);
            }

            const inputNode = getNode(s, {
                payload: {
                    nodeId: inputLocation.nodeId,
                    flowId: a.payload.flowId,
                }
            });
            if (!inputNode) {
                return console.error(`Couldn't find input node.`);
            }

            inputNode.rowStates[inputLocation.rowId] ||= { connections: [], value: null };
            const connections = inputNode.rowStates[inputLocation.rowId]!.connections;
            const setIndex = Math.max(0, Math.min(inputLocation.jointIndex, connections.length));
            connections[setIndex] = {
                nodeId: outputLocation.nodeId,
                accessor: outputLocation.accessor,
            }
        },
        removeEdge: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, input: lang.InputJointLocation }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const { nodeId, rowId, jointIndex } = a.payload.input;
            g.nodes[nodeId]?.rowStates[rowId]?.connections.splice(jointIndex, 1);
        },
        addListItem: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, prop: 'inputs' | 'generics' }>) => {
            const g = getFlow(s, a);
            if (!g) return;

            const list: ListedState[] = g[a.payload.prop];
            const nextId = findUniquePortId(list);

            if (a.payload.prop === 'inputs') {
                const defaultInput: RowSignatureBlueprint = { rowType: 'input-simple', specifier: lang.createAnyType() };
                const port = createRowSignature(nextId, 'New Input', defaultInput);
                list.push(port as lang.InputRowSignature);
            }
            if (a.payload.prop === 'generics') {
                list.push({ id: nextId, constraint: null });
            }
        },
        removeListItem: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, portId: string, prop: 'inputs' | 'generics' }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const list: ListedState[] = g[a.payload.prop];
            const index = list.findIndex(i => i.id === a.payload.portId);
            if (index >= 0) {
                list.splice(index, 1);
            }
        },
        reorderList: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, newOrder: string[], prop: 'inputs' | 'generics' }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const list: ListedState[] = g[a.payload.prop];
            const newRows = a.payload.newOrder
                .map(rowId => list.find(row => row.id === rowId));
            if (!newRows.every(row => row != null)) {
                console.error('Invalid row ids passed');
                return;
            }
            g[a.payload.prop] = newRows as any[];
        },
        replaceInput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, rowId: string, blueprint: RowSignatureBlueprint }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const index = g.inputs.findIndex(i => i.id === a.payload.rowId);
            const port = g.inputs[index];
            if (port == null) {
                return console.error(`Row not found.`);
            }
            const newPort = createRowSignature(port.id, port.id, a.payload.blueprint);
            g.inputs.splice(index, 1, newPort as lang.InputRowSignature);
        },
        updateInput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, portId: string, newState: Partial<RowSignature> }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const port = g.inputs.find(p => p.id === a.payload.portId);
            if (port == null) {
                return console.error(`Row not found`);
            }
            Object.assign(port, a.payload.newState);
        },
        replaceOutput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, blueprint: RowSignatureBlueprint }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            g.output = createRowSignature(g.output.id, g.output.id, a.payload.blueprint) as lang.OutputRowSignature;
        },
        updateOutput: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, newState: Partial<RowSignature> }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            Object.assign(g.output, a.payload.newState);
        },
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
    removeNodes: flowsRemoveNodes,
    positionNode: flowsPositionNode,
    moveSelection: flowsMoveSelection,
    addLink: flowsAddLink,
    removeEdge: flowsRemoveEdge,
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
} = flowsSlice.actions;

export const selectFlows = (state: RootState) => selectDocument(state).flows;

export const selectSingleFlow = (flowId: string) =>
    useCallback((state: RootState) => // memoize selector IMPORTANT
        selectFlows(state)[flowId] as lang.FlowGraph | undefined,
        [flowId]
    );

const flowsReducer = flowsSlice.reducer;
export default flowsReducer;
