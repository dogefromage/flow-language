import lang from '@fluss/language';
import { TypeSystemExceptionData, TypeTreePath } from '@fluss/language/lib/types/typeSystem/exceptionHandling';

export default function formatSpecifier(X: lang.TypeSpecifier, env: lang.FlowEnvironment): string {
    if (typeof X === 'string') {
        return X;
    }
    switch (X.type) {
        case 'primitive':
            return X.name;
        case 'missing':
            return `Missing`;
        case 'any':
            return 'Any';
        case 'function':
            return `Fn<${formatSpecifier(X.parameter, env)}, ${formatSpecifier(X.output, env)}>`;
        case 'list':
            return `List<${formatSpecifier(X.element, env)}>`;
        case 'tuple':
            return `Tuple<${X.elements.map(Y => formatSpecifier(Y, env)).join(',')}>`;
        case 'map':
            const entries = Object.entries(X.elements)
                .map(([key, Y]) => `${key}:${formatSpecifier(Y, env)}`)
                .join(',');
            return `Map<${entries}>`;
    }
    throw new Error(`Unknown type`);
}

