import * as lang from "@fluss/language";
import { createSlice } from "@reduxjs/toolkit";
import { Draft, enableMapSet } from "immer";
import _, { difference } from "lodash";
import { useCallback } from "react";
import { RootState } from "../redux/store";
import { FlowsSliceState, UndoAction, Vec2, defaultFlows } from "../types";
import { getBasePowers } from "../utils/math";
import { selectDocument } from "../redux/stateHooks";
import { v4 as uuidv4 } from "uuid";
import { RowBlueprint } from "../types/flowRows";
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

// function createBlankRow(id: string, rowAndDataType: RowDataTypeCombination): RowT {
//     const displayName = allowedInputRows[rowAndDataType] || allowedOutputRows[rowAndDataType];
//     const rowName = `New ` + (displayName || 'Row');

//     const { rowType, dataType } = decomposeRowDataTypeCombination(rowAndDataType);

//     switch (rowType) {
//         case 'field':
//         case 'input':
//         case 'output':
//             return {
//                 id, type: rowType, dataType, name: rowName,
//                 value: initialDataTypeValue[dataType],
//             }
//         case 'rotation':
//             return {
//                 id,
//                 type: 'rotation', 
//                 dataType: 'mat3',
//                 name: rowName,
//                 value: initialDataTypeValue['mat3'],
//                 rotationModel: 'xyz',
//             }
//         case 'color':
//             return {
//                 id,
//                 type: 'color', 
//                 dataType: 'vec3',
//                 name: rowName,
//                 value: [ 1, 1, 1 ],
//             }
//         default: 
//             throw new Error(`${rowAndDataType} not implemented`);
//     }
// }

function generateAlphabeticalId(index: number) {
    const token = getBasePowers(index, 26)
        .reverse()
        .map(x => String.fromCharCode('a'.charCodeAt(0) + x))
        .join('');
    return token;
}

const initialState: FlowsSliceState = { ...defaultFlows };

function pushPort<T extends { id: string }>(ports: T[], port: T) {
    for (let i = 0; true; i++) {
        let id = i.toString(36);
        if (ports.find(p => p.id == id)) {
            continue;
        }
        port.id = id;
        ports.push(port);
        return;
    }
}

export const flowsSlice = createSlice({
    name: 'flows',
    initialState,
    reducers: {
        create: (s, a: UndoAction<{
            name: string;
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
                name: a.payload.name,
                nodes: {
                    a: { id: 'a', signature: lang.getInternalId('input'), position: { x: 400, y: 200 }, rowStates: {} },
                    b: { id: 'b', signature: lang.getInternalId('output'), position: { x: 1000, y: 200 }, rowStates: {} },
                },
                idCounter: 2,
            }
            s[id] = flow as any;
        },
        rename: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, name: string }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            g.name = a.payload.name;
        },
        remove: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string }>) => {
            delete s[a.payload.flowId];
        },
        addNode: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, signatureId: lang.FlowSignatureId, position: Vec2, rowStates?: lang.FlowNode['rowStates'] }>) => {
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
                outputId: outputLocation.rowId,
            }
        },
        removeEdge: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, input: lang.InputJointLocation }>) => {
            const g = getFlow(s, a);
            if (!g) return;
            const { nodeId, rowId, jointIndex } = a.payload.input;
            g.nodes[nodeId]?.rowStates[rowId]?.connections.splice(jointIndex, 1);
        },
        // addPort: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, direction: 'in' | 'out', blueprint: RowBlueprint }>) => {
        //     const g = getFlow(s, a);
        //     if (!g) return;
            
        //     const port = {
        //         id: '',
        //         label: 'New Row',
        //         specifier: a.payload.blueprint.specifier,
        //         rowType: a.payload.blueprint.rowType,
        //     };

        //     if (a.payload.direction === 'in') {
        //         g.inputs.push(port as lang.InputRowSignature);
        //     } else {
        //         g.outputs.push(port as lang.OutputRowSignature);
        //     }
        // },
        // // addDefaultRow: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, direction: 'in' | 'out', defaultRow: InputRowT | OutputRowT }>) => {
        // //     const g = getFlow(s, a);
        // //     if (!g) return;
        // //     if (a.payload.direction === 'in') {
        // //         if (g.inputs.find(row => row.id === a.payload.defaultRow.id)) {
        // //             return; // only one instance
        // //         }
        // //         g.inputs.push(a.payload.defaultRow as InputRowT);
        // //     } else {
        // //         if (g.outputs.find(row => row.id === a.payload.defaultRow.id)) {
        // //             return; // only one instance
        // //         }
        // //         g.outputs.push(a.payload.defaultRow as OutputRowT);
        // //     }
        // //     g.version++;
        // // },
        // replacePort: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, direction: 'in' | 'out', portId: string, blueprint: RowBlueprint }>) => {
        //     const g = getFlow(s, a);
        //     if (!g) return;

        //     if (a.payload.direction === 'in') {
        //         const index = g.inputs.findIndex(i => i.id === a.payload.portId);
                
        //     } else {

        //     }
        //     const ports: RowT[] = a.payload.direction === 'in' ? g.inputs : g.outputs;
        //     const index = rows.findIndex(row => row.id === a.payload.portId);
        //     const newRow = createBlankRow(a.payload.portId, a.payload.rowAndDataType);
        //     newRow.name = rows[index].name; // manual name copy
        //     rows.splice(index, 1, newRow);
        //     g.version++;
        // },
        // updatePort: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, direction: 'in' | 'out', rowId: string, newState: Partial<RowT> }>) => {
        //     const g = getFlow(s, a);
        //     if (!g) return;

        //     const rows: RowT[] = a.payload.direction === 'in' ? g.inputs : g.outputs;
        //     const row = rows.find(row => row.id === a.payload.rowId);
        //     if (!row) {
        //         return console.error(`Row not found`);
        //     }
        //     Object.assign(row, a.payload.newState);
        //     g.version++;
        // },
        // removePort: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, direction: 'in' | 'out', rowId: string }>) => {
        //     const g = getFlow(s, a);
        //     if (!g) return;
        //     const filter = (row: RowT) => row.id != a.payload.rowId;
        //     if (a.payload.direction === 'in') {
        //         g.inputs = g.inputs.filter(filter);
        //     } else {
        //         g.outputs = g.outputs.filter(filter);
        //     }
        //     g.version++;
        // },
        // reorderPorts: (s: Draft<FlowsSliceState>, a: UndoAction<{ flowId: string, direction: 'in' | 'out', newOrder: string[] }>) => {
        //     const g = getFlow(s, a);
        //     if (!g) return;
        //     // get
        //     const rows: RowT[] = a.payload.direction === 'in' ? g.inputs : g.outputs;
        //     // map
        //     const newRows = a.payload.newOrder
        //         .map(rowId => rows.find(row => row.id === rowId));
        //     if (!newRows.every(row => row != null)) {
        //         console.error('Invalid row ids passed');
        //     }
        //     // put
        //     if (a.payload.direction === 'in') {
        //         g.inputs = newRows as InputRowT[];
        //     } else {
        //         g.outputs = newRows as OutputRowT[];
        //     }
        //     g.version++;
        // },
    }
});

export const {
    // CRUD
    create: flowsCreate,
    rename: flowsRename,
    remove: flowsRemove,
    // CONTENT
    addNode: flowsAddNode,
    removeNodes: flowsRemoveNodes,
    positionNode: flowsPositionNode,
    moveSelection: flowsMoveSelection,
    addLink: flowsAddLink,
    removeEdge: flowsRemoveEdge,
    setRowValue: flowsSetRowValue,
    // // META
    // addPort: flowsAddPort,
    // updatePort: flowsUpdatePort,
    // removePort: flowsRemovePort,
    // replacePort: flowsReplacePort,
    // reorderPorts: flowsReorderPorts,
} = flowsSlice.actions;

export const selectFlows = (state: RootState) => selectDocument(state).flows;

export const selectSingleFlow = (flowId: string) =>
    useCallback((state: RootState) => // memoize selector IMPORTANT
        selectFlows(state)[flowId],
        [flowId]
    );

const flowsReducer = flowsSlice.reducer;
export default flowsReducer;
