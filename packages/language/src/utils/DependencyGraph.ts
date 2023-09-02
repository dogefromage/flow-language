
// export default class DependencyGraph<T> {
    
//     private depAdjacency: Map<T, T[]> = new Map();
//     private knownNames: Set<T> = new Set();

//     addDependencies(dependant: T, dependencies: T[]) {
//         this.knownNames.add(dependant);
//         let row = this.depAdjacency.get(dependant);
//         if (!row) {
//             row = [];
//             this.depAdjacency.set(dependant, row);
//         }
//         for (const dependency of dependencies) {
//             this.knownNames.add(dependency);
//             if (!row.includes(dependency)) {
//                 row.push(dependency);
//             }
//         }
//     }

//     sortTopologically() {
//         const orderedNames = [ ...this.knownNames ];
//         const N = orderedNames.length;

//         const dependenciesNumbered = new Array(N).fill([]).map(_ => [] as number[]);
//         for (let i = 0; i < N; i++) {
//             const dependant = orderedNames[i];
//             const deps = this.depAdjacency.get(dependant);
//             if (deps) {
//                 for (const dependency of deps) {
//                     const depIndex = orderedNames.indexOf(dependency);
//                     assertTruthy(depIndex >= 0);
//                     dependenciesNumbered[i].push(depIndex);
//                 }
//             }
//         }

//         const topSortResult = sortTopologically(dependenciesNumbered);

//         return {
//             cycles: topSortResult.cycles
//                 .map(cycle => cycle.map(i => orderedNames[i])),
//             bottomToTopDependencies: topSortResult.topologicalSorting
//                 .map(i => orderedNames[i])
//                 .reverse(),
//         }
//     }
    
//     findDependenciesRecursive(entry: T) {
//         const finalDeps = new Set<T>();
//         const visited = new Set<T>();
//         const queue = [ entry ];

//         while (queue.length > 0) {
//             const u = queue.shift()!;
//             visited.add(u);
//             for (const v of this.depAdjacency.get(u) || []) {
//                 finalDeps.add(v);
//                 if (!visited.has(v)) {
//                     queue.push(v);
//                 }
//             }
//         }
//         return finalDeps;
//     }
// }