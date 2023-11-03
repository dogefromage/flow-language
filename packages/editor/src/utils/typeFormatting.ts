import lang, { assertNever } from '@noodles/language';

export function formatSpecifier(X: lang.TypeSpecifier, env: lang.FlowEnvironment): string {
    switch (X.type) {
        case 'primitive':
            return X.name;
        case 'any':
            return 'Any';
        case 'function':
            return `${formatSpecifier(X.parameter, env)} -> ${formatSpecifier(X.output, env)}`;
        case 'list':
            return `${formatSpecifier(X.element, env)}[]`;
        case 'map':
            const entries = Object.entries(X.elements)
                .map(([key, Y]) => `${key}: ${formatSpecifier(Y, env)}`)
                .join(', ');
            return `{ ${entries} }`;
        case 'tuple':
            return `(${X.elements.map(Y => formatSpecifier(Y, env)).join(', ')})`;
        case 'alias':
        case 'generic':
            return X.alias;
    }
    assertNever();
}

export function formatSpecifierWithGenerics(T: lang.TemplatedTypeSpecifier, env: lang.FlowEnvironment) {
    const gens = T.generics.map(g => {
        if (g.constraint != null) {
            return `${g.id} ⊆ ${formatSpecifier(g.constraint, env)}`;
        }
        return g.id;
    });

    const baseSpec = formatSpecifier(T.specifier, env);
    if (gens.length) {
        return `<${gens.join(', ')}>${baseSpec}`;
    }
    return baseSpec;
}

export function formatValue(v: any) {
    switch (typeof v) {
        case 'string':
            return `"${v}"`;
        case 'number':
        case 'boolean':
        default:
            return v.toString();
    }
}