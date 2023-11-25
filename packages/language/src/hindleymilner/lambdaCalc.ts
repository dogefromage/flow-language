


// class LambdaNode {
//     constructor(
//         public v: string,
//         public body: ExpressionNode,
//     ) {}

//     toString(): string {
//         return `λ${this.v}. ${this.body}`
//     }
// }

// class IdentifierNode {
//     constructor(
//         public name: string,
//     ) {}
//     toString(): string {
//         return this.name;
//     }
// }

// class ApplyNode {
//     constructor(
//         public fn: ExpressionNode,
//         public arg: ExpressionNode,
//     ) {}

//     toString(): string {
//         return [
//             wrapBrackets(this.fn.toString()),
//             wrapBrackets(this.arg.toString()),
//         ].join(' ');
//     }
// }

// class LetNode {
//     constructor(
//         public v: string,
//         public def: ExpressionNode,
//         public body: ExpressionNode,
//     ) {}

//     toString(): string {
//         const def = wrapBrackets(this.def.toString());
//         const body = wrapBrackets(this.body.toString());
//         return `let ${this.v} = ${def} in ${body}`;
//     }
// }

// class LetrecNode {
//     constructor(
//         public v: string,
//         public def: ExpressionNode,
//         public body: ExpressionNode,
//     ) {}

//     toString(): string {
//         const def = wrapBrackets(this.def.toString());
//         const body = wrapBrackets(this.body.toString());
//         return `letrec ${this.v} = ${def} in ${body}`;
//     }
// }

// type ExpressionNode =
//     | LambdaNode
//     | IdentifierNode
//     | ApplyNode
//     | LetNode
//     | LetrecNode


// // https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
// export function isIntegerString(str: any) {
//     if (typeof str != "string") return false // we only process strings!  
//     return !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
//         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
// }




// function getType(name: string, env: TypeEnvironment, bound: Set<VariableType>) {
//     if (env[name] != null) {
//         return clone(env[name], bound);
//     }
//     else if (isIntegerString(name)) {
//         return baseEnvironment.int;
//     }
//     throw new Error(`Undefined symbol ${name}.`);
// }


// function analyse(node: ExpressionNode, env: TypeEnvironment, bound = new Set<VariableType>()): MonoType {

//     if (node instanceof IdentifierNode) {
//         return getType(node.name, env, bound);
//     }
//     if (node instanceof ApplyNode) {
//         const funType = analyse(node.fn, env, bound);
//         const argType = analyse(node.arg, env, bound);
//         const resultType = new VariableType();
//         unify(new FunctionType(argType, resultType), funType);
//         return resultType;
//     }
//     if (node instanceof LambdaNode) {
//         const argType = new VariableType();
//         const newEnv = { ...env, [node.v]: argType };
//         const newNonGeneric = new Set([...bound, argType]);
//         const resultType = analyse(node.body, newEnv, newNonGeneric);
//         return new FunctionType(argType, resultType);
//     }
//     if (node instanceof LetNode) {
//         const defnType = analyse(node.def, env, bound);
//         const newEnv = { ...env, [node.v]: defnType };
//         return analyse(node.body, newEnv, bound);
//     }
//     if (node instanceof LetrecNode) {
//         const newType = new VariableType();
//         const newEnv = { ...env, [node.v]: newType };
//         const newNonGeneric = new Set([...bound, newType]);
//         const defnType = analyse(node.def, newEnv, newNonGeneric);
//         unify(newType, defnType);
//         return analyse(node.body, newEnv, bound);
//     }
//     assertNever(`Unhandled syntax node.`);
// }


// function tryAnalyze(node: ExpressionNode, env: TypeEnvironment) {
//     try {
//         const t = analyse(node, env);
//         console.log(`${node} : ${t}`);
//     } catch (e: any) {
//         console.log(`${node} : ${e.message}`);
//     }
// }


// const pair = new ApplyNode(new ApplyNode(new IdentifierNode("pair"),
//     new ApplyNode(new IdentifierNode("f"),
//         new IdentifierNode("4"))),
//     new ApplyNode(new IdentifierNode("f"),
//         new IdentifierNode("true")))

// const examples = [
//     // factorial
//     new LetrecNode("factorial",  // letrec factorial =
//         new LambdaNode("n",  // fn n =>
//             new ApplyNode(
//                 new ApplyNode(  // cond (zero n) 1
//                     new ApplyNode(new IdentifierNode("cond"),  // cond (zero n)
//                         new ApplyNode(new IdentifierNode("zero"), new IdentifierNode("n"))),
//                     new IdentifierNode("1")),
//                 new ApplyNode(  // times n
//                     new ApplyNode(new IdentifierNode("times"), new IdentifierNode("n")),
//                     new ApplyNode(new IdentifierNode("factorial"),
//                         new ApplyNode(new IdentifierNode("pred"), new IdentifierNode("n")))
//                 )
//             )
//         ),  // in
//         new ApplyNode(new IdentifierNode("factorial"), new IdentifierNode("5"))
//     ),

//     // Should fail:
//     // fn x => (pair(x(3) (x(true)))
//     new LambdaNode("x",
//         new ApplyNode(
//             new ApplyNode(new IdentifierNode("pair"),
//                 new ApplyNode(new IdentifierNode("x"), new IdentifierNode("3"))),
//             new ApplyNode(new IdentifierNode("x"), new IdentifierNode("true")))),

//     // pair(f(3), f(true))
//     new ApplyNode(
//         new ApplyNode(new IdentifierNode("pair"), new ApplyNode(new IdentifierNode("f"), new IdentifierNode("4"))),
//         new ApplyNode(new IdentifierNode("f"), new IdentifierNode("true"))),

//     // let f = (fn x => x) in ((pair (f 4)) (f true))
//     new LetNode("f", new LambdaNode("x", new IdentifierNode("x")), pair),

//     // fn f => f f (fail)
//     new LambdaNode("f", new ApplyNode(new IdentifierNode("f"), new IdentifierNode("f"))),

//     // let g = fn f => 5 in g g
//     new LetNode("g",
//         new LambdaNode("f", new IdentifierNode("5")),
//         new ApplyNode(new IdentifierNode("g"), new IdentifierNode("g"))),

//     // example that demonstrates generic and non-generic variables:
//     // fn g => let f = fn x => g in pair (f 3, f true)
//     new LambdaNode("g",
//         new LetNode("f",
//             new LambdaNode("x", new IdentifierNode("g")),
//             new ApplyNode(
//                 new ApplyNode(new IdentifierNode("pair"),
//                     new ApplyNode(new IdentifierNode("f"), new IdentifierNode("3"))
//                 ),
//                 new ApplyNode(new IdentifierNode("f"), new IdentifierNode("true"))))),

//     // Function composition
//     // fn f (fn g (fn arg (f g arg)))
//     new LambdaNode("f", new LambdaNode("g", new LambdaNode("arg", new ApplyNode(new IdentifierNode("g"), new ApplyNode(new IdentifierNode("f"), new IdentifierNode("arg"))))))
// ]

// const var1 = new VariableType()
// const var2 = new VariableType()
// const var3 = new VariableType()

// const my_env: TypeEnvironment = {
//     pair: new FunctionType(var1, new FunctionType(var2, new ApplicationType("pair", [var1, var2]))),
//     true: baseEnvironment.bool,
//     cond: new FunctionType(baseEnvironment.bool, new FunctionType(var3, new FunctionType(var3, var3))),
//     zero: new FunctionType(baseEnvironment.int, baseEnvironment.bool),
//     pred: new FunctionType(baseEnvironment.int, baseEnvironment.int),
//     times: new FunctionType(baseEnvironment.int, new FunctionType(baseEnvironment.int, baseEnvironment.int)),
// }

// for (const example of examples) {
//     tryAnalyze(example, my_env);
// }