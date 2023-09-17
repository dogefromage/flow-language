import { ByteInstruction, ByteOperation, ByteProgram, CallStackScope, CallableChunk, ConcreteValue, StackValue, ThunkValue } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";

export class StackMachine {
    stack: StackValue[] = [];
    callStack: CallStackScope[] = [];

    constructor(
        private program: ByteProgram,
    ) {}

    reset() {
        this.stack = [];
        this.callStack = [];
    }

    interpret(entryLabel: string) {
        this.callChunk(this.getChunk(entryLabel));
        while (this.callStack.length) {
            const scope = this.callStack[0]
            assertTruthy(0 <= scope.ip && scope.ip < scope.chunk.instructions.length,
                `Instruction pointer out of bounds: ${scope.ip}, chunk size: ${scope.chunk.instructions.length}.`);
            const instr = scope.chunk.instructions[scope.ip];
            scope.ip++;
            this.runInstruction(instr);
        }
        return this.dpop();
    }

    runInstruction(instr: ByteInstruction) {
        if (instr.type === 'data') {
            this.dpush(instr.data);
        } else {
            this.runOperation(instr.operation);
        }
        assertNever();
    }

    runOperation(op: ByteOperation) {
        switch (op) {
            // THUNKABLE OPS
            case ByteOperation.bneg:
            case ByteOperation.nneg:
            case ByteOperation.ncmpz:
            case ByteOperation.ncmpnz:
            case ByteOperation.ntrunc:
                this.runOperationOrThunk(1, op);
                break;
            case ByteOperation.nadd:
            case ByteOperation.nsub:
            case ByteOperation.nmul:
            case ByteOperation.ndiv:
            case ByteOperation.ngt:
            case ByteOperation.nlt:
            case ByteOperation.ncmp:
            case ByteOperation.band:
            case ByteOperation.bor:
            case ByteOperation.sconcat:
            case ByteOperation.oget:
            case ByteOperation.aget:
            case ByteOperation.aconcat:
                this.runOperationOrThunk(2, op);
                break;
            case ByteOperation.ssub:
            case ByteOperation.asub:
                this.runOperationOrThunk(3, op);
                break;

            // NON-THUNKABLE OPS
            case ByteOperation.dup:
                this.dpush(this.dget(0)); break;
            case ByteOperation.pop:
                this.dpop(); break;
            case ByteOperation.swp: {
                const t0 = this.dpop()!;
                const t1 = this.dpop()!;
                this.dpush(t0);
                this.dpush(t1);
                break;
            }
            case ByteOperation.narg:
                this.dpush(this.assertDataType(
                    this.getNthScopeElement(this.dpop('n')), 'n'));
                break;
            case ByteOperation.barg:
                this.dpush(this.assertDataType(
                    this.getNthScopeElement(this.dpop('n')), 'b'));
                break;
            case ByteOperation.sarg:
                this.dpush(this.assertDataType(
                    this.getNthScopeElement(this.dpop('n')), 's'));
                break;
            case ByteOperation.oarg:
                this.dpush(this.assertDataType(
                    this.getNthScopeElement(this.dpop('n')), 'o'));
                break;

            case ByteOperation.call:
                const thunk: ThunkValue = {
                    arguments: [],
                    chunk: this.getChunk(this.dpop<string>('s')),
                }
                for (let i = 0; i < thunk.chunk.arity; i++) {
                    thunk.arguments.push(this.dpop());
                }
                this.dpush(thunk);
                // this.callChunk(
                //     this.getChunk(this.dpop<string>('s')));
                // break;
            case ByteOperation.return:
                this.returnCall();
                break;
            case ByteOperation.j:
                this.currScope().ip += this.dpop('i');
                break;
            case ByteOperation.jc: {
                const addr = this.dpop('i');
                const condition = this.dpop('b');
                if (condition) {
                    this.currScope().ip += addr;
                }
                break;
            }
            default:
                assertNever(`Unknown instruction '${op}'`);
        }
    }

    runOperationOrThunk(arity: number, op: ByteOperation) {
        
    }

    runRealOperation(op: ByteOperation) {
        switch (op) {
            // DATA
            case ByteOperation.bneg:
                this.dpush(!this.dpop('b')); break;
            case ByteOperation.nneg:
                this.dpush(-this.dpop('n')); break;
            case ByteOperation.ncmpz:
                this.dpush(this.dpop('n') === 0); break;
            case ByteOperation.ncmpnz:
                this.dpush(this.dpop('n') !== 0); break;
            case ByteOperation.ntrunc:
                this.dpush(Math.floor(this.dpop('n'))); break;
            case ByteOperation.nadd:
                this.dpush(this.dpop('n') + this.dpop('n')); break;
            case ByteOperation.nsub:
                this.dpush(this.dpop('n') - this.dpop('n')); break;
            case ByteOperation.nmul:
                this.dpush(this.dpop('n') * this.dpop('n')); break;
            case ByteOperation.ndiv:
                this.dpush(this.dpop('n') / this.dpop('n')); break;
            case ByteOperation.ngt:
                this.dpush(this.dpop('n') > this.dpop('n')); break;
            case ByteOperation.nlt:
                this.dpush(this.dpop('n') < this.dpop('n')); break;
            case ByteOperation.ncmp:
                this.dpush(this.dpop('n') === this.dpop('n')); break;
            case ByteOperation.band:
                this.dpush(this.dpop('b') && this.dpop('b')); break;
            case ByteOperation.bor:
                this.dpush(this.dpop('b') || this.dpop('b')); break;
            case ByteOperation.ssub: {
                const str = this.dpop<string>('s');
                const start = this.dpop<number>('n');
                const len = this.dpop<number>('n');
                this.dpush(str.slice(start, Math.max(0, start + len)));
                break;
            }
            case ByteOperation.sconcat:
                this.dpush( this.dpop<string>('s') + this.dpop('s') );
                break;
            // ARRAYS
            case ByteOperation.aget: {
                const index = this.dpop('n');
                this.dpush(this.dpop('a').at(index));
                break;
            }
            case ByteOperation.aconcat:
                this.dpush( this.dpop<any[]>('a').concat(this.dpop('a')) );
                break;
            case ByteOperation.asub: {
                const arr = this.dpop<any[]>('a');
                const start = this.dpop<number>('n');
                const len = this.dpop<number>('n');
                this.dpush(arr.slice(start, Math.max(0, start + len)));
                break;
            }
            // OBJECTS
            case ByteOperation.oget: {
                const propKey = this.dpop();
                const obj = this.dpop('o');
                this.dpush(obj[propKey]);
                break;
            }
            default:
                assertNever();
        }
    }

    // runInstruction(instr: ByteInstruction) {
    //     if (instr.type === 'data') {
    //         this.dpush(instr.data);
    //         return;
    //     }

    //     switch (instr.operation) {
    //         // DATA
    //         case ByteOperation.bneg:
    //             this.dpush(!this.dpop('b')); break;
    //         case ByteOperation.nneg:
    //             this.dpush(-this.dpop('n')); break;
    //         case ByteOperation.ncmpz:
    //             this.dpush(this.dpop('n') === 0); break;
    //         case ByteOperation.ncmpnz:
    //             this.dpush(this.dpop('n') !== 0); break;
    //         case ByteOperation.ntrunc:
    //             this.dpush(Math.floor(this.dpop('n'))); break;
    //         case ByteOperation.nadd:
    //             this.dpush(this.dpop('n') + this.dpop('n')); break;
    //         case ByteOperation.nsub:
    //             this.dpush(this.dpop('n') - this.dpop('n')); break;
    //         case ByteOperation.nmul:
    //             this.dpush(this.dpop('n') * this.dpop('n')); break;
    //         case ByteOperation.ndiv:
    //             this.dpush(this.dpop('n') / this.dpop('n')); break;
    //         case ByteOperation.ngt:
    //             this.dpush(this.dpop('n') > this.dpop('n')); break;
    //         case ByteOperation.nlt:
    //             this.dpush(this.dpop('n') < this.dpop('n')); break;
    //         case ByteOperation.ncmp:
    //             this.dpush(this.dpop('n') === this.dpop('n')); break;
    //         case ByteOperation.band:
    //             this.dpush(this.dpop('b') && this.dpop('b')); break;
    //         case ByteOperation.bor:
    //             this.dpush(this.dpop('b') || this.dpop('b')); break;
    //         case ByteOperation.ssub: {
    //             const str = this.dpop<string>('s');
    //             const start = this.dpop<number>('n');
    //             const len = this.dpop<number>('n');
    //             this.dpush(str.slice(start, Math.max(0, start + len)));
    //             break;
    //         }
    //         case ByteOperation.sconcat:
    //             this.dpush( this.dpop<string>('s') + this.dpop('s') );
    //             break;
    //         // // arrays
    //         // case ByteOperation.apack:
    //         //     const n = this.dpop<number>('n');
    //         //     const arr: any[] = [];
    //         //     for (let i = 0; i < n; i++) {
    //         //         arr.push(this.dpop());
    //         //     }
    //         //     this.dpush(arr);
    //         //     break;
    //         case ByteOperation.aget: {
    //             const index = this.dpop('n');
    //             this.dpush(this.dpop('a').at(index));
    //             break;
    //         }
    //         case ByteOperation.aconcat:
    //             this.dpush( this.dpop<any[]>('a').concat(this.dpop('a')) );
    //             break;
    //         case ByteOperation.asub: {
    //             const arr = this.dpop<any[]>('a');
    //             const start = this.dpop<number>('n');
    //             const len = this.dpop<number>('n');
    //             this.dpush(arr.slice(start, Math.max(0, start + len)));
    //             break;
    //         }
    //         // // objects
    //         // case ByteOperation.opack: {
    //         //     // expects: [ n, key_1, value_1, ... , key_n, value_n ]
    //         //     // returns: [ { key_1: value_1, ... } ]
    //         //     const n = this.dpop<number>('n');
    //         //     const obj: any = {};
    //         //     for (let i = 0; i < n; i++) {
    //         //         const key = this.dpop('s');
    //         //         const element = this.dpop();
    //         //         obj[key] = element;
    //         //     }
    //         //     this.dpush(obj);
    //         //     break;
    //         // }
    //         case ByteOperation.oget: {
    //             const propKey = this.dpop();
    //             const obj = this.dpop('o');
    //             this.dpush(obj[propKey]);
    //             break;
    //         }

    //         // STACK & SCOPE
    //         case ByteOperation.dup:
    //             this.dpush(this.dget(0)); break;
    //         case ByteOperation.pop:
    //             this.dpop(); break;
    //         case ByteOperation.swp: {
    //             const t0 = this.dpop()!;
    //             const t1 = this.dpop()!;
    //             this.dpush(t0);
    //             this.dpush(t1);
    //             break;
    //         }
    //         case ByteOperation.narg:
    //             this.dpush(this.assertDataType(
    //                 this.getNthScopeElement(this.dpop('n')), 'n'));
    //             break;
    //         case ByteOperation.barg:
    //             this.dpush(this.assertDataType(
    //                 this.getNthScopeElement(this.dpop('n')), 'b'));
    //             break;
    //         case ByteOperation.sarg:
    //             this.dpush(this.assertDataType(
    //                 this.getNthScopeElement(this.dpop('n')), 's'));
    //             break;
    //         case ByteOperation.oarg:
    //             this.dpush(this.assertDataType(
    //                 this.getNthScopeElement(this.dpop('n')), 'o'));
    //             break;

    //         // CONTROL FLOW
    //         case ByteOperation.call:
    //             this.callChunk(
    //                 this.getChunk(this.dpop<string>('s')));
    //             break;
    //         case ByteOperation.return:
    //             this.returnCall();
    //             break;
    //         case ByteOperation.j:
    //             this.currScope().ip += this.dpop('i');
    //             break;
    //         case ByteOperation.jc: {
    //             const addr = this.dpop('i');
    //             const condition = this.dpop('b');
    //             if (condition) {
    //                 this.currScope().ip += addr;
    //             }
    //             break;
    //         }
    //         default:
    //             assertNever(`Unknown instruction '${JSON.stringify(instr)}'`);
    //     }
    // }

    getChunk(label: string) {
        return assertDef(this.program.chunks.get(label), `Could not find chunk with label '${label}'`);
    }
    callChunk(chunk: CallableChunk) {        
        if (this.callStack.length > 100000) {
            assertNever('Stack overflow :(');
        }
        this.callStack.unshift({
            chunk,
            ip: 0,
            // expecting parameters already on stack
            stackTailLength: this.stack.length - chunk.arity,
        });
        for (let i = 0; i < chunk.locals; i++) {
            this.dpush(0); // making room for locals
        }
    }
    returnCall() {
        const currCall = assertDef(this.callStack.shift(), 'Cannot pop call stack');
        this.stack = this.stack.slice(-currCall.stackTailLength);
    }
    currScope() {
        assertTruthy(this.callStack.length, 'No call stack found.');
        return this.callStack[0];
    }
    getNthScopeElement(index: number) {
        const tailLength = this.currScope().stackTailLength;
        const indexFromBack = tailLength + index;
        assertTruthy(indexFromBack < this.stack.length, 'Scope element index out of bounds');
        return this.stack.at(-1 - indexFromBack)!;
    }

    assertDataType<T = any>(x: ConcreteValue, typeTag: ValueTypes): T {
        const expectedType = typeofMap[typeTag];
        assertTruthy(typeof x === expectedType,
            `Expected value to be of type '${expectedType}', received '${typeof x}'`);
        switch (typeTag) {
            case 'i':
                assertTruthy(typeof x === 'number' && isFinite(x) && Math.floor(x) == x, `Expected integer value.`);
                break;
            case 'a':
                assertTruthy(typeof x === 'object' && Array.isArray(x), 'Expected array.');
                break;
        }
        return x as T;
    }
    dget(index: number, checkType?: ConcreteValue['dataType']) {
        assertTruthy(0 <= index && index < this.stack.length,
            `Value stack index out of bounds '${index}'.`);
        const x = this.stack[index];
        if (checkType != null) {
            this.assertDataType(x, checkType);
        }
        return x;
    }
    dpop<T = any>(): T {
        const x = assertDef(this.stack.shift(), 'Data stack is empty.');
        if (checkType != null) {
            this.assertDataType(x, checkType);
        }
        return x as T;
    }
    dpush(d: ConcreteValue) { this.stack.unshift(d); }
}


const typeofMap: Record<ValueTypes, string> = {
    i: 'number',
    n: 'number',
    b: 'boolean',
    s: 'string',
    a: 'object',
    o: 'object',
};