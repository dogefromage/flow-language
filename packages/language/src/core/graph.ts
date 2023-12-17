import { assert } from "../utils";


export class OrderedGraph {
    private adjacencyList = new Map<string, string[]>();
    
    reachability: Map<string, Set<string>> = new Map();

    inDegrees: Map<string, number> = new Map();
    outDegrees: Map<string, number> = new Map();

    preOrder: Map<string, number> = new Map();
    postOrder: Map<string, number> = new Map();
    cycles: string[][] = [];
    
    constructor(nodes: string[]) {
        nodes.forEach(node => this.adjacencyList.set(node, []));
    }

    clone(): OrderedGraph {
        const H = new OrderedGraph(Array.from(this.adjacencyList.keys()));
        for (const [from, to] of this.adjacencyList.entries()) {
            for (const u of to) {
                H.addEdge(from, u);
            }
        }
        return H;
    }

    *vertices() {
        for (const node of this.adjacencyList.keys()) {
            yield node;
        }
    }
    *edges() {
        for (const [from, to] of this.adjacencyList.entries()) {
            for (const u of to) {
                yield [from, u] as const;
            }
        }
    }

    addEdge(from: string, to: string) {
        const adjacency = this.adjacencyList.get(from)!;
        if (!adjacency) {
            throw new Error(`Node '${from}' does not exist.`);
        }
        if (!this.adjacencyList.has(to)) { 
            throw new Error(`Node '${to}' does not exist.`);
        }
        if (from === to) {
            throw new Error(`Cannot add self-edge '${from}'.`);
        }
        if (!adjacency.includes(to)) {
            adjacency.push(to);
        }
    }

    reverse(): OrderedGraph {
        const H = new OrderedGraph(Array.from(this.adjacencyList.keys()));
        for (const [from, to] of this.adjacencyList.entries()) {
            for (const u of to) {
                H.addEdge(u, from);
            }
        }
        return H;
    }

    calculateReachability(): void {
        // TODO: This alg is very crude. O(n+m) should be achievable
        // calculate reachability for every node in the graph
        this.reachability.clear();
        for (const node of this.adjacencyList.keys()) {
            const reachable = new Set<string>();
            const toVisit = [node];
            while (toVisit.length > 0) {
                const current = toVisit.pop()!;
                if (!reachable.has(current)) {
                    reachable.add(current);
                    for (const next of this.adjacencyList.get(current)!) {
                        toVisit.push(next);
                    }
                }
            }
            this.reachability.set(node, reachable);
        }
    }

    isReachable(from: string, to: string): boolean {
        return this.reachability.get(from)?.has(to) ?? false;
    }

    calculateDegrees(): void {
        for (const node of this.adjacencyList.keys()) {
            this.inDegrees.set(node, 0);
            this.outDegrees.set(node, 0);
        }
        for (const [from, to] of this.adjacencyList.entries()) {
            this.outDegrees.set(from, to.length);
            for (const u of to) {
                this.inDegrees.set(u, (this.inDegrees.get(u) ?? 0) + 1);
            }
        }
    }

    getInDegree(node: string): number {
        assert(this.inDegrees.has(node));
        return this.inDegrees.get(node)!;
    }
    
    getOutDegree(node: string): number {
        assert(this.outDegrees.has(node));
        return this.outDegrees.get(node)!;
    }

    calculatePrePostOrderAndCycles(): void {
        const visited = new Set<string>();
        const cyclicVerts = new Set<string>(); 

        this.preOrder = new Map();
        this.postOrder = new Map();
        
        const orderDFS = (u: string, counter: number): number => {
            visited.add(u);
            this.preOrder.set(u, counter++);

            for (const v of this.adjacencyList.get(u)!) {
                if (!visited.has(v)) {
                    counter = orderDFS(v, counter);
                }
                if (visited.has(v) && !this.postOrder.has(v)) {
                    // vert v is still on stack, therefore cycle
                    cyclicVerts.add(v);
                }
            }
            this.postOrder.set(u, counter++);
            return counter;
        }
    
        let counter = 1;
        for (const u of this.vertices()) {
            if (!visited.has(u)) {
                counter = orderDFS(u, counter);
            }
        }

        this.cycles = [];
        visited.clear();
        const stack: string[] = [];

        const cycleDFS = (u: string) => {
            visited.add(u);
            stack.push(u);
            for (const v of this.adjacencyList.get(u)!) {
                // this only works because the first vertex is known to be in a cycle
                if (stack[0] === v) {
                    this.cycles.push(stack.slice());
                }
                if (!visited.has(v)) {
                    cycleDFS(v);
                }
            }
            stack.pop();
        }

        for (const v of cyclicVerts) {
            if (!visited.has(v)) {
                cycleDFS(v);
            }
        }
    }

    sortTopologically() {
        this.calculatePrePostOrderAndCycles();
        // if (this.cycles.length > 0) {
        //     throw new Error(`Graph contains cycles. [${this.cycles.map(c => c.join(', ')).join('], [')}]`);
        // }

        const topologicalSorting = Array.from(this.postOrder.entries())
            .sort(([ u, post_u ], [ v, post_v ]) => post_v - post_u)
            .map(([ u, post_u ]) => u);

        return topologicalSorting;
    }

    toString(): string {
        const verts = [ ...this.adjacencyList.keys() ];
        const adjacency = verts.map(vert => {
            const edges = this.adjacencyList.get(vert)!;
            return `${vert} -> { ${edges.join(', ')} }`
        }).join('\n');
        return `Directed graph:\n${adjacency}`; 
    }
}