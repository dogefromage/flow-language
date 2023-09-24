import { ByteInstruction, ByteOperation, ByteProgram, CallFrame, CallableChunk, StackValue, ThunkValue, byteCodeConstructors, operationNameTags } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";
import { instructionToString } from "./byteCodeUtils";

const { op, thunk } = byteCodeConstructors;

interface StackMachineArgs {
    trace?: boolean;
    countExecutedInstructions?: boolean;
    recordMaximumStackHeights?: boolean;
}

export class StackMachine {
    stack: StackValue[] = [];
    sideStack: StackValue[] = [];
    callStack: CallFrame[] = [];
    instructionTimer = 0;
    maxMainStackHeight = 0;
    maxCallStackHeight = 0;

    private identityChunk: CallableChunk = {
        arity: 1,
        instructions: [
            // expecting non-thunked value
            op(ByteOperation.return),
        ],
    }

    constructor(
        private program: ByteProgram,
        private args: StackMachineArgs,
    ) {}

    reset() {
        this.stack = [];
        this.sideStack = [];
        this.callStack = [];
        this.instructionTimer = 0;
    }

    getChunk(label: string) {
        return assertDef(this.program.chunks.get(label), `Could not find chunk with label '${label}'`);
    }

    interpret() {
        try {
            const entryLabel = this.program.entryChunk;
            this.execCall(entryLabel, this.getChunk(entryLabel));

            while (this.callStack.length) {
                const scope = this.callStack.at(-1)!;
                assertTruthy(0 <= scope.ip && scope.ip < scope.chunk.instructions.length,
                    `Instruction pointer out of bounds: ${scope.ip}, chunk size: ${scope.chunk.instructions.length}.`);
                const instr = scope.chunk.instructions[scope.ip];
                scope.ip++;
                this.runInstruction(instr);
            }
        } catch (e: any) {
            e.message += '\n' + this.stackFrameToString();
            throw e;
        }
        finally {
            if (this.args.countExecutedInstructions) {
                console.log(`Executed ${this.instructionTimer} dynamic instructions in total.`);
            }
            if (this.args.recordMaximumStackHeights) {
                console.log(`Max main stack height: ${this.maxMainStackHeight}, max call stack height: ${this.maxCallStackHeight}`);
            }
        }
    }

    stackFrameToString() {
        let callStackLines: string[] = [];
        const maxLines = Math.min(20, this.callStack.length);
        const remainingFrames = this.callStack.length - maxLines;
        for (let i = 0; i < maxLines; i++) {
            const frame = this.callStack.at(-i-1)!;
            const lastIp = frame.ip - 1;
            const instrString = instructionToString(frame.chunk.instructions[lastIp]);
            callStackLines.push(`    ${instrString}  ${frame.label}:${lastIp}`);
        }
        if (remainingFrames > 0) {
            callStackLines.push(`${remainingFrames} further stack frames hidden.`);
        }
        return callStackLines.join('\n');
    }

    runInstruction(instr: ByteInstruction) {
        this.instructionTimer++;

        if (this.args.trace) {
            if (instr.type === 'data') {
                console.groupCollapsed(`INSTR data(${instr.data.toString()})`);
                console.log(instr.data);
            } else {
                console.groupCollapsed(`INSTR op(${operationNameTags[instr.operation]})`);
            }
            console.log(this.stack.slice());
            console.groupEnd();
        }

        if (instr.type === 'data') {
            this.dpush(instr.data);
            return;
        }

        switch (instr.operation) {
            // DATA
            case ByteOperation.bneg:
                this.dpush(!this.dpop()); break;
            case ByteOperation.nneg:
                this.dpush(-this.dpop()); break;
            case ByteOperation.ncmpz:
                this.dpush(this.dpop() === 0); break;
            case ByteOperation.ntrunc:
                this.dpush(Math.floor(this.dpop())); break;
            case ByteOperation.nadd:
                this.dpush(this.dpop() + this.dpop()); break;
            case ByteOperation.nsub:
                this.dpush(this.dpop() - this.dpop()); break;
            case ByteOperation.nmul:
                this.dpush(this.dpop() * this.dpop()); break;
            case ByteOperation.ndiv:
                this.dpush(this.dpop() / this.dpop()); break;
            case ByteOperation.ngt:
                this.dpush(this.dpop() > this.dpop()); break;
            case ByteOperation.nlt:
                this.dpush(this.dpop() < this.dpop()); break;
            case ByteOperation.ncmp:
                this.dpush(this.dpop() === this.dpop()); break;
            case ByteOperation.band:
                this.dpush(this.dpop() && this.dpop()); break;
            case ByteOperation.bor:
                this.dpush(this.dpop() || this.dpop()); break;
            case ByteOperation.ssub: {
                const str: string = this.dpop();
                const start = this.dpop();
                const len = this.dpop();
                this.dpush(str.slice(start, Math.max(0, start + len)));
                break;
            }
            case ByteOperation.sconcat:
                this.dpush(this.dpop() + this.dpop());
                break;
            // arrays
            case ByteOperation.apack: {
                const arr: any[] = [];
                const n = this.dpop();
                for (let i = 0; i < n; i++) {
                    arr.push(this.dpop());
                }
                this.dpush(arr);
                break;
            }
            case ByteOperation.aspread: {
                const arr: any[] = this.dpop();
                for (let i = arr.length-1; i >= 0; i--) {
                    this.dpush(arr[i]);
                }
                break;
            }
            case ByteOperation.apop: {
                const arr: any[] = this.dpop();
                assertTruthy(arr.length > 0, 'Cannot pop array of length zero.');
                this.dpush(arr.slice(1));
                this.dpush(arr[0]);
                break;
            }
            case ByteOperation.apush:
                this.dpush([ this.dpop(), ...this.dpop() ]);
                break;
            case ByteOperation.aget: {
                const i = this.dpop();
                const arr = this.dpop();
                assertTruthy(i >= -arr.length && i < arr.length, `Index out of bounds (length=${arr.length}, index=${i}).`);
                this.dpush(arr.at(i));
                break;
            }
            case ByteOperation.aconcat:
                this.dpush(this.dpop().concat(this.dpop()));
                break;
            case ByteOperation.asub: {
                const arr: any[] = this.dpop();
                const start = this.dpop();
                const len = this.dpop();
                this.dpush(arr.slice(start, Math.max(0, start + len)));
                break;
            }
            // objects
            case ByteOperation.opack: {
                // expects: [ n, key_1, value_1, ... , key_n, value_n ]
                // returns: [ { key_1: value_1, ... } ]
                const n = this.dpop();
                const obj: any = {};
                for (let i = 0; i < n; i++) {
                    const key = this.dpop();
                    const element = this.dpop();
                    obj[key] = element;
                }
                this.dpush(obj);
                break;
            }
            case ByteOperation.oget: {
                const propKey = this.dpop();
                const obj = this.dpop();
                this.dpush(obj[propKey]);
                break;
            }

            // STACK & SCOPE
            case ByteOperation.dup:
                this.dpush(this.dpeek(0)); break;
            case ByteOperation.pop:
                this.dpop(); break;
            case ByteOperation.swp: {
                const t0 = this.dpop()!;
                const t1 = this.dpop()!;
                this.dpush(t0);
                this.dpush(t1);
                break;
            }
            case ByteOperation.moveaside:
                this.sideStack.push(this.dpop());
                break;
            case ByteOperation.moveback:
                this.dpush(assertDef(this.sideStack.pop()));
                break;
            case ByteOperation.getarg: {
                const index = this.dpop();
                const args = this.getFrame().args;
                assertTruthy(0 <= index && index < args.length, 'Arg access out of bounds.');
                this.dpush(args[index]);
                break;
            }
            case ByteOperation.getlocal: {
                const index = this.dpop();
                const locals = this.getFrame().locals;
                assertTruthy(0 <= index && index < locals.length, 'Local access out of bounds.');
                this.dpush(locals[index]);
                break;
            }
            case ByteOperation.setlocal: {
                const index = this.dpop();
                const val = this.dpop();
                const locals = this.getFrame().locals;
                locals[index] = val;
                break;
            }

            // CONTROL FLOW
            case ByteOperation.return:
                this.execReturn();
                break;
            case ByteOperation.call: {
                const label: string = this.dpop();
                this.execCall(label, this.getChunk(label));
                break;
            }
            case ByteOperation.evaluate: {
                const thunk: ThunkValue = this.dpop();
                if (thunk.result != null) {
                    this.dpush(thunk.result);
                } else {
                    for (let i = thunk.chunk.arity - 1; i >= 0; i--) {
                        this.dpush(thunk.args[i]);
                    }
                    this.execCall(thunk.label, thunk.chunk, thunk);
                }
                break;
            }
            case ByteOperation.thunk: {
                const label: string = this.dpop();
                const chunk = this.getChunk(label);
                const args = [];
                for (let i = 0; i < chunk.arity; i++) {
                    args.push(this.dpop());
                }
                this.dpush(thunk(args, chunk, label));
                break;
            }
            case ByteOperation.thunk_id: {
                this.dpush(thunk([ this.dpop() ], this.identityChunk, 'identity'));
                break;
            }
            case ByteOperation.j: {
                const ipOffset = this.dpop();
                this.getFrame().ip += ipOffset;
                break;
            }
            case ByteOperation.jc: {
                const ipOffset = this.dpop();
                if (this.dpop()) {
                    this.getFrame().ip += ipOffset;
                }
                break;
            }
            default:
                assertNever(`Unknown instruction '${JSON.stringify(instr)}'`);
        }
    }

    execCall(label: string, chunk: CallableChunk, thunk?: ThunkValue) {
        if (this.args.trace) {
            console.groupCollapsed(`CALL ${label}`);
            console.log(chunk);
            console.groupEnd();
        }

        this.maxCallStackHeight = Math.max(this.maxCallStackHeight, this.callStack.length);

        if (this.callStack.length >= 100000) {
            assertNever(`Stack overflow (call stack has ${this.callStack.length} entries).`);
        }
        this.callStack.push({
            label,
            chunk,
            thunk,
            ip: 0,
            baseIndex: this.stack.length - chunk.arity,
            locals: [],
            // copy arguments into arg array AND REVERSE
            args: this.stack
                .slice(this.stack.length - chunk.arity, chunk.arity)
                .reverse(),
        });
    }
    execReturn() {
        if (this.args.trace) {
            console.log(`RETURN`);
        }
        const frame = assertDef(this.callStack.pop(), 'Cannot pop call stack');
        // memoize result
        if (frame.thunk != null) {
            frame.thunk.result = this.dpeek(0);
        }
    }
    getFrame() {
        return assertDef(this.callStack.at(-1), 'Call stack is empty.');
    }

    dpeek(index: number) {
        assertTruthy(0 <= index && index < this.stack.length,
            `Value stack index out of bounds '${index}'.`);
        const x = this.stack[this.stack.length - 1 - index];
        return x;
    }
    dpop() {
        assertTruthy(this.stack.length > 0, 'Data stack is empty.');
        return this.stack.pop() as any;
    }
    dpush(d: StackValue) { 
        this.stack.push(d); 
        this.maxMainStackHeight = Math.max(this.maxMainStackHeight, this.stack.length);
    }
}