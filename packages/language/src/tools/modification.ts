import { FlowGraph, FlowSelection } from "../types";
import { Vec2 } from "../types/internal";
import { maximum } from "../utils/functional";

function base26StringToIndex(id: string) {
    let acc = 0;
    while (id.length) {
        const x = id.charCodeAt(0) - 'a'.charCodeAt(0);
        id = id.slice(1);
        acc = 26 * acc + x;
    }
    return acc;
}
function convertToBase(x: number, base: number) {
    if (base <= 1) {
        throw new Error(`Invalid base`);
    }
    if (x === 0) return [ 0 ];
    const result: number[] = [];
    while (x > 0) {
        let remainder = x % base;
        result.push(remainder);
        x = (x - remainder) / base;
    }
    return result;
}
function indexToBase26String(n: number) {
    return convertToBase(n, 26)
        .reverse()
        .map(x => String.fromCharCode('a'.charCodeAt(0) + x))
        .join('');
}

// TODO optimize here with better algorithm
export function compareIdStrings(a: string, b: string) {
    return base26StringToIndex(a) - base26StringToIndex(b);
}

export function getLastestNodeId(...ids: string[]) {
    return maximum(ids, compareIdStrings);
}

export function *createIdGenerator(...previousIds: string[]) {
    let n = 0;
    if (previousIds.length) {
        const latest = getLastestNodeId(...previousIds);
        n = base26StringToIndex(latest);
    }
    while (true) {
        n++;
        yield indexToBase26String(n);
    }
}

export function pasteSelectedNodes(
    source: FlowGraph, target: FlowGraph,
    selection: FlowSelection, move: Vec2
): FlowGraph {
    // make mutable
    target = structuredClone(target);
    
    // add regions later
    let nodesOnly = selection.items
        .filter(x => x.type === 'node')
        .map(x => x.id);

    const idGenerator = createIdGenerator(
        ...nodesOnly,
        ...Object.keys(target.nodes),
    );

    // fix selection if incorrect
    nodesOnly = nodesOnly.filter(id => source.nodes[id] != null);
    const nodes = structuredClone(nodesOnly.map(id => source.nodes[id]));

    const newIds = new Set<string>();
    for (const oldId of nodesOnly) {
        const newId = idGenerator.next().value!;
        newIds.add(newId);
        
        // rename node
        const node = nodes.find(node => node.id === oldId)!;
        node.id = newId;

        // rename references
        for (const node of nodes) {
            for (const rowState of Object.values(node.inputs)) {
                for (const connection of Object.values(rowState.rowArguments)) {
                    if (connection.valueRef?.nodeId === oldId) {
                        connection.valueRef.nodeId = newId;
                    }
                    if (connection.typeRef?.nodeId === oldId) {
                        connection.typeRef.nodeId = newId;
                    }
                }
            }
        }
    }

    for (const node of nodes) {
        // remove external references (UPDATE IN FUTURE)
        for (const rowState of Object.values(node.inputs)) {
            for (const key of Object.keys(rowState.rowArguments)) {
                const conn = rowState.rowArguments[key];
                if (!newIds.has(conn.typeRef?.nodeId!)) {
                    delete conn.typeRef;
                }
                if (!newIds.has(conn.valueRef?.nodeId!)) {
                    // fix this later
                    // @ts-ignore
                    delete conn.valueRef;
                }
            }
        }

        // offset
        node.position.x += move.x;
        node.position.y += move.y;

        // add
        target.nodes[node.id] = node;
    }
    
    return target;
}
