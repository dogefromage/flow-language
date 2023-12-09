
interface ValueSymbolReference {
    target: any;
    key: string;
    prefix?: string;
    postfix?: string;
}
interface KeySymbolReference {
    target: any;
    prefix?: string;
    postfix?: string;
}

interface BuilderSymbol {
    value: string;
    valueReferences: ValueSymbolReference[];
    keyReferences: KeySymbolReference[];
}

const valueRef = <O extends object>(
    target: O, key: keyof O & string, prefix?: string, postfix?: string
): ValueSymbolReference => ({ target, key, prefix, postfix });

const keyRef = <O extends object>(
    target: O, prefix?: string, postfix?: string
): KeySymbolReference => ({ target, prefix, postfix });

function sandwich(identifier: string, ref: ValueSymbolReference | KeySymbolReference) {
    const prefix = ref.prefix || '';
    const postfix = ref.postfix || '';
    return prefix + identifier + postfix;
}

// export class Builder {
//     private doc: FlowDocument;
//     private symbols = new WeakMap<object, BuilderSymbol>();

//     constructor(referenceDocument: FlowDocument) {
//         this.doc = structuredClone(referenceDocument);
//         this.scanDocumentSymbols();
//     }

//     get document() {
//         return this.doc;
//     }

//     finalize() {
//         deepFreeze(this.doc);
//         return this.doc;
//     }

//     private scanGenericSymbols(generics: TemplateParameter[], X: TypeSpecifier) {
//         switch (X.type) {
//             case 'generic':
//                 const genericDef = generics.find(g => g.id === X.alias);
//                 if (genericDef != null) {
//                     const symbol = assertDef(this.symbols.get(genericDef));
//                     symbol.valueReferences.push(valueRef(X, 'alias'));
//                 }
//                 break;
//             case 'function':
//                 this.scanGenericSymbols(generics, X.output);
//                 this.scanGenericSymbols(generics, X.parameter);
//                 break;
//             case 'list':
//                 this.scanGenericSymbols(generics, X.element);
//                 break;
//             case 'tuple':
//                 for (const el of X.elements) {
//                     this.scanGenericSymbols(generics, el);
//                 }
//                 break;
//             case 'map':
//                 for (const el of Object.values(X.elements)) {
//                     this.scanGenericSymbols(generics, el);
//                 }
//                 break;
//             case 'alias':
//             case 'any':
//             case 'primitive':
//                 break;
//             default:
//                 assertNever();
//         }
//     }

//     private scanDocumentSymbols() {
//         for (const [flowId, flow] of Object.entries(this.doc.flows)) {
//             assertTruthy(flowId == flow.id);

//             this.symbols.set(flow, {
//                 value: flowId,
//                 keyReferences: [
//                     keyRef(this.doc.flows),
//                 ],
//                 valueReferences: [
//                     valueRef(flow, 'id'),
//                 ],
//             });
//             for (const generic of flow.generics) {
//                 this.symbols.set(generic, {
//                     value: generic.id,
//                     keyReferences: [],
//                     valueReferences: [
//                         valueRef(generic, 'id'),
//                     ],
//                 });
//             }
//             for (const input of flow.inputs) {
//                 this.symbols.set(input, {
//                     value: input.id,
//                     keyReferences: [],
//                     valueReferences: [
//                         valueRef(input, 'id'),
//                     ],
//                 });
//                 this.scanGenericSymbols(flow.generics, input.specifier);
//             }
//             this.symbols.set(flow.output, {
//                 value: flow.output.id,
//                 keyReferences: [],
//                 valueReferences: [
//                     valueRef(flow.output, 'id'),
//                 ],
//             });
//             this.scanGenericSymbols(flow.generics, flow.output.specifier);

//             for (const [nodeId, node] of Object.entries(flow.nodes)) {
//                 assertDef(node.id === nodeId);

//                 this.symbols.set(node, {
//                     value: nodeId,
//                     keyReferences: [
//                         keyRef(flow.nodes),
//                     ],
//                     valueReferences: [
//                         valueRef(node, 'id'),
//                     ],
//                 });
//             }
//         }

//         for (const [flowId, flow] of Object.entries(this.doc.flows)) {
//             for (const node of Object.values(flow.nodes)) {

//                 // flow id
//                 const pathMatch = node.protoPath.path.match(/^document::([\d\w]+)(?:::([\d\w]+))?$/);
//                 const refFlow = this.doc.flows[pathMatch?.[1]!];
//                 const syntaxType = pathMatch?.[2];
//                 const refFlowSymbol = refFlow && this.symbols.get(refFlow);

//                 if (refFlowSymbol != null) { // is flow instance node
//                     // link signature path
//                     refFlowSymbol.valueReferences.push(valueRef(
//                         node.protoPath, 'path',
//                         'document::',
//                         syntaxType && `::${syntaxType}`
//                     ));

//                     if (syntaxType === 'output') {
//                         // link rowstate key to output id
//                         if (node.inputs[refFlow.output.id] != null) {
//                             const outputSymbol = assertDef(this.symbols.get(refFlow.output));
//                             outputSymbol.keyReferences.push(keyRef(node.inputs));
//                         }
//                     }

//                     if (syntaxType == null) {
//                         // link node instance row ids to flow inputs
//                         for (const input of refFlow.inputs) {
//                             if (node.inputs[input.id] != null) {
//                                 const inputSymbol = assertDef(this.symbols.get(input));
//                                 inputSymbol.keyReferences.push(keyRef(node.inputs));
//                             }
//                         }
//                     }
//                 }

//                 // link connections to nodes
//                 for (const [_, rowState] of Object.entries(node.inputs)) {
//                     for (const [_, args] of Object.entries(rowState.rowArguments)) {
//                         for (const conn of [args.typeRef, args.valueRef]) {
//                             if (!conn) continue;
//                             const refNode = flow.nodes[conn.nodeId];
//                             if (!refNode) continue;
//                             const refNodeSymbol = assertDef(this.symbols.get(refNode));
//                             refNodeSymbol.valueReferences.push(valueRef(conn, 'nodeId'));
//                         }
//                     }
//                 }
//             }
//         }
//     }

//     private renameSymbol(symbol: BuilderSymbol, newValue: string) {

//         if (symbol.value == newValue) {
//             return;
//         }

//         // check if symbol can be renamed
//         for (const keyRef of symbol.keyReferences) {
//             const newKey = sandwich(newValue, keyRef);
//             if (keyRef.target[newKey] != null) {
//                 throw new Error(`Could not rename symbol due to a naming collision.`);
//             }
//         }

//         const oldValue = symbol.value
//         symbol.value = newValue;
//         for (const valueRef of symbol.valueReferences) {
//             valueRef.target[valueRef.key] = sandwich(newValue, valueRef);
//         }
//         for (const keyRef of symbol.keyReferences) {
//             const oldKey = sandwich(oldValue, keyRef);
//             const newKey = sandwich(newValue, keyRef);
//             keyRef.target[newKey] = keyRef.target[oldKey];
//             delete keyRef.target[oldKey];
//         }
//     }

//     renameItem(item: object, newName: string) {
//         const symbol = this.symbols.get(item);
//         if (symbol == null) {
//             throw new Error(`Could not rename item. No symbol found.`);
//         }
//         this.renameSymbol(symbol, newName);
//     }

//     pasteNodes(flowId: string, referenceFlow: FlowGraph, selection: string[]) {
//         throw Error('implement');
//     }
// }

export {}