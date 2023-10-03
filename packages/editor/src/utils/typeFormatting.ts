import lang, { GenericTag } from '@fluss/language';

export function getSpecifierLabel(X: lang.TypeSpecifier) {
    if (typeof X === 'string') {
        return X;
    }
    switch (X.type) {
        case 'primitive':
            return X.name;
        // case 'missing':
        //     return `Missing`;
        case 'any':
            return 'Any';
        case 'function':
            return `Fn`;
        case 'list':
            return `List`;
        case 'tuple':
            return `Tuple`;
        case 'map':
            return `Map`;
        // case 'union':
        //     return `Union`;
    }
    throw new Error(`Unknown type`);
}

export function formatSpecifier(X: lang.TypeSpecifier, env: lang.FlowEnvironment): string {
    if (typeof X === 'string') {
        return getSpecifierLabel(X);
    }
    switch (X.type) {
        case 'primitive':
        // case 'missing':
        case 'any':
            return getSpecifierLabel(X);
        case 'function':
            return `${formatSpecifier(X.parameter, env)} -> ${formatSpecifier(X.output, env)}`;
        case 'list':
            return `${getSpecifierLabel(X)}<${formatSpecifier(X.element, env)}>`;
        case 'map':
            const entries = Object.entries(X.elements)
                .map(([key, Y]) => `${key}: ${formatSpecifier(Y, env)}`)
                .join(', ');
            return `{ ${entries} }`;
            // return `${getSpecifierLabel(X)}<${entries}>`;
        case 'tuple':
            return `(${X.elements.map(Y => formatSpecifier(Y, env)).join(', ')})`;
        // case 'tuple':
        //     return `${getSpecifierLabel(X)}<${X.elements.map(Y => formatSpecifier(Y, env)).join(', ')}>`;
    }
    throw new Error(`Unknown type`);
}

export function formatSpecifierWithGenerics(X: lang.TypeSpecifier, env: lang.FlowEnvironment, generics: GenericTag[]) {
    const gens = generics.map(g => {
        if (g.constraint != null) {
            return `${g.id} ⊆ ${formatSpecifier(g.constraint, env)}`;
        }
        return g.id;
    });

    const baseSpec = formatSpecifier(X, env);
    if (gens.length) {
        return `<${gens.join(', ')}>${baseSpec}`;
    }
    return baseSpec;
}