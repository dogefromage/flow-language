import { FunctionType, TypeApplication, TypeVariable } from "./system";

const INT = new TypeApplication('int', []);
const BOOL = new TypeApplication('int', []);
const STRING = new TypeApplication('int', []);
const NULL = new TypeApplication('int', []);

const var1 = new TypeVariable();
const var2 = new TypeVariable();
const var3 = new TypeVariable();

const my_env: TypeEnvironment = {
    pair: new FunctionType(var1, new FunctionType(var2, new TypeApplication("pair", [var1, var2]))),
    true: BOOL,
    cond: new FunctionType(BOOL, new FunctionType(var3, new FunctionType(var3, var3))),
    zero: new FunctionType(INT, BOOL),
    pred: new FunctionType(INT, INT),
    times: new FunctionType(INT, new FunctionType(INT, INT)),
}