
export interface TypeSystemExceptionData {
    message: string;
    type?: 'incompatible-type' | 'invalid-value' | 'required-type' | 'cyclic-definition' | 'unknown-reference';
    path: TypeTreePath;
}

export class TypeSystemException extends Error {
    constructor(
        public data: TypeSystemExceptionData
    ) {
        const msg = [
            'Uncaught TypeSystemException:',
            data.message,
            data.path.nodes.map(n => n.key).join()
        ].join('\n');
        super(msg);
    }
}

interface TypeTreeNode {
    key: string;
    formatting: 'property' | 'type' | 'alias',
}

export class TypeTreePath {
    constructor(
        public nodes: TypeTreeNode[] = [],
    ) {}
    
    add(node: TypeTreeNode) {
        return new TypeTreePath([ ...this.nodes, node ]);
    }
}