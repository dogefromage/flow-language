import { assert } from "../utils";


export class OrderedGraph {
    private adjacencyList = new Map<string, string[]>();

    private reachability: Map<string, Set<string>> = new Map();

    private inDegrees: Map<string, number> = new Map();
    private outDegrees: Map<string, number> = new Map();

    private preOrder: Map<string, number> = new Map();
    private postOrder: Map<string, number> = new Map();
    private cycles: string[][] = [];
    
    constructor(nodes: string[]) {
        nodes.forEach(node => this.adjacencyList.set(node, []));
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

    addEdgesFrom(from: string, ...to: string[]) {
        const adjacency = this.adjacencyList.get(from)!;
        if (!adjacency) {
            throw new Error(`Node '${from}' does not exist.`);
        }
        for (const v of to) {
            if (!this.adjacencyList.has(v)) { 
                throw new Error(`Node '${v}' does not exist.`);
            }
            if (from === v) {
                throw new Error(`Cannot add self-edge '${from}'.`);
            }
            if (!adjacency.includes(v)) {
                adjacency.push(v);
            }
        }
    }

    reverse(): OrderedGraph {
        const H = new OrderedGraph(Array.from(this.adjacencyList.keys()));
        for (const [from, to] of this.adjacencyList.entries()) {
            for (const u of to) {
                H.addEdgesFrom(u, from);
            }
        }
        return H;
    }

    calculateReachability(): void {
        // TODO: This alg is very crude. O(n+m) should be achievable
        // calculate reachability for every node in the graph
        for (const node of this.adjacencyList.keys()) {
            this.calculateReachabilityFrom(node);
        }
    }

    private calculateReachabilityFrom(node: string): void {
        // calculate reachability for a single node
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

    private calculatePrePostOrderAndCycles(): void {
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
        if (this.cycles.length > 0) {
            throw new Error(`Graph contains cycles. [${this.cycles.map(c => c.join(', ')).join('], [')}]`);
        }

        const topologicalSorting = Array.from(this.postOrder.entries())
            .sort(([ u, post_u ], [ v, post_v ]) => post_v - post_u)
            .map(([ u, post_u ]) => u);

        return topologicalSorting;
    }
}