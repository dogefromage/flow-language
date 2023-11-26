import { Expr, exprToString } from "./demolang/expr";
import { infer } from "./hindleymilner/infer";
import { Ty, TypeEnvironment, newGenericVar, tyToString } from "./hindleymilner/types";

const bool: Ty = { kind: 'CONST', name: 'boolean' };
const num: Ty = { kind: 'CONST', name: 'number' };

const varA = newGenericVar();

const testEnv = new TypeEnvironment({
    cond: {
        kind: 'ARROW',
        params: [bool, varA, varA],
        ret: varA,
    },
    zero: {
        kind: 'ARROW',
        params: [num],
        ret: bool,
    },
    pred: {
        kind: 'ARROW',
        params: [num],
        ret: num,
    },
    less: {
        kind: 'ARROW',
        params: [num, num],
        ret: bool,
    },
    add: {
        kind: 'ARROW',
        params: [num, num],
        ret: num,
    },
});

const johnRecord: Expr = {
    kind: 'RECORDEXTEND',
    key: 'name',
    value: {
        kind: 'LITERAL',
        value: 'John',
    },
    rest: {
        kind: 'RECORDEXTEND',
        key: 'age',
        value: {
            kind: 'LITERAL',
            value: 42,
        },
        rest: {
            kind: 'RECORDEMPTY',
        },
    },
};

const examples: Expr[] = [
    // FACTORIAL FUNCTION
    {
        kind: 'LETREC',
        x: 'factorial',
        defn: {
            kind: 'FUN',
            params: ['n'],
            body: {
                kind: 'CALL',
                head: {
                    kind: 'IDENTIFIER',
                    value: 'cond',
                },
                args: [
                    {
                        kind: 'CALL',
                        head: {
                            kind: 'IDENTIFIER',
                            value: 'zero',
                        },
                        args: [{
                            kind: 'IDENTIFIER',
                            value: 'n',
                        }],
                    },
                    {
                        kind: 'LITERAL',
                        value: 1,
                    },
                    {
                        kind: 'CALL',
                        head: {
                            kind: 'IDENTIFIER',
                            value: 'factorial',
                        },
                        args: [
                            {
                                kind: 'CALL',
                                head: {
                                    kind: 'IDENTIFIER',
                                    value: 'pred',
                                },
                                args: [{
                                    kind: 'IDENTIFIER',
                                    value: 'n',
                                }],
                            }
                        ]
                    }
                ]
            }
        },
        body: {
            kind: 'CALL',
            head: {
                kind: 'IDENTIFIER',
                value: 'factorial',
            },
            args: [{
                kind: 'LITERAL',
                value: 5,
            }],
        }
    },

    // Fibonacci expression
    {
        kind: 'LETREC',
        x: 'fib',
        defn: {
            kind: 'FUN',
            params: ['n'],
            body: {
                kind: 'CALL',
                head: {
                    kind: 'IDENTIFIER',
                    value: 'cond',
                },
                args: [
                    {
                        kind: 'CALL',
                        head: {
                            kind: 'IDENTIFIER',
                            value: 'less',
                        },
                        args: [
                            { kind: 'IDENTIFIER', value: 'n' },
                            { kind: 'LITERAL', value: 2 },
                        ]
                    },
                    { kind: 'IDENTIFIER', value: 'n' },
                    {
                        kind: 'CALL',
                        head: {
                            kind: 'IDENTIFIER',
                            value: 'add',
                        },
                        args: [
                            {
                                kind: 'CALL',
                                head: {
                                    kind: 'IDENTIFIER',
                                    value: 'fib',
                                },
                                args: [
                                    {
                                        kind: 'CALL',
                                        head: {
                                            kind: 'IDENTIFIER',
                                            value: 'pred',
                                        },
                                        args: [{
                                            kind: 'IDENTIFIER',
                                            value: 'n',
                                        }],
                                    }
                                ]
                            },
                            {
                                kind: 'CALL',
                                head: {
                                    kind: 'IDENTIFIER',
                                    value: 'fib',
                                },
                                args: [
                                    {
                                        kind: 'CALL',
                                        head: {
                                            kind: 'IDENTIFIER',
                                            value: 'pred',
                                        },
                                        args: [
                                            {
                                                kind: 'CALL',
                                                head: {
                                                    kind: 'IDENTIFIER',
                                                    value: 'pred',
                                                },
                                                args: [{
                                                    kind: 'IDENTIFIER',
                                                    value: 'n',
                                                }],
                                            }
                                        ],
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        },
        body: {
            kind: 'CALL',
            head: {
                kind: 'IDENTIFIER',
                value: 'fib',
            },
            args: [{
                kind: 'LITERAL',
                value: 5,
            }],
        }
    },

    johnRecord,
    {
        kind: 'RECORDSELECT',
        rec: johnRecord,
        key: 'age',
    },
    {
        kind: 'RECORDSELECT',
        rec: johnRecord,
        key: 'hobby',
    },
    {
        kind: 'RECORDRESTRICT',
        rec: johnRecord,
        key: 'age',
    },
    {
        kind: 'RECORDEXTEND',
        key: 'age',
        value: {
            kind: 'LITERAL',
            value: 'one-hundred',
        },
        rest: johnRecord,
    },
]

function tryInfer(env: TypeEnvironment, expr: Expr) {
    const exprStr = exprToString(expr);
    try {
        console.log(`${exprStr} : ${tyToString(infer(env, 0, expr))}`);
    } catch (e: any) {
        console.log(`${exprStr} : ${e.message}`);
    }
}

for (const example of examples) {
    tryInfer(testEnv, example);
}