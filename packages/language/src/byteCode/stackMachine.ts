import { ByteInstruction, ByteOperation, ByteProgram, CallFrame, CallableChunk, StackValue, ThunkValue } from "../types/byteCode";
import { assertDef, assertNever, assertTruthy } from "../utils";
import { instructionToString } from "./byteCodeUtils";

const thunk = (
    args: ThunkValue['args'], chunk: ThunkValue['chunk'], label: string,
): ThunkValue => ({ args, chunk, label });

export class StackMachine {
    stack: StackValue[] = [];
    sideStack: StackValue[] = [];
    callStack: CallFrame[] = [];

    constructor(
        private program: ByteProgram,
    ) {}

    reset() {
        this.stack = [];
        this.callStack = [];
    }

    getChunk(label: string) {
        return assertDef(this.program.chunks.get(label), `Could not find chunk with label '${label}'`);
    }

    interpret(entryLabel: string) {
        try {
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
    }

    stackFrameToString() {
        let callStackLines: string[] = [];
        for (let i = this.callStack.length - 1; i >= 0; i--) {
            const frame = this.callStack[i];
            const lastIp = frame.ip - 1;
            const instrString = instructionToString(frame.chunk.instructions[lastIp]);
            callStackLines.push(`    ${instrString}  ${frame.label}:${lastIp}`);
        }
        return callStackLines.join('\n');
    }

    runInstruction(instr: ByteInstruction) {
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
            case ByteOperation.apack:
                const arr: any[] = [];
                const n = this.dpop();
                for (let i = 0; i < n; i++) {
                    arr.push(this.dpop());
                }
                this.dpush(arr);
                break;
            case ByteOperation.aget: {
                const index = this.dpop();
                this.dpush(this.dpop().at(index));
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
            case ByteOperation.getlocal: {
                const index = this.dpop();
                const locals = this.getFrame().locals;
                assertTruthy(0 <= index && index < locals.length, 'Local access out of bounds.');
                this.dpush(locals[index]);
            }
            case ByteOperation.setlocal: {
                const index = this.dpop();
                const val = this.dpop();
                const locals = this.getFrame().locals;
                locals[index] = val;
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
                for (let i = thunk.chunk.arity - 1; i >= 0; i--) {
                    this.dpush(thunk.args[i]);
                }
                this.execCall(thunk.label, thunk.chunk);
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

    execCall(label: string, chunk: CallableChunk) {
        if (this.callStack.length >= 100000) {
            assertNever(`Stack overflow (call stack has ${this.callStack.length} entries).`);
        }
        this.callStack.push({
            label,
            chunk,
            ip: 0,
            baseIndex: this.stack.length - chunk.arity,
            locals: [],
        });
    }
    execReturn() {
        const frame = assertDef(this.callStack.pop(), 'Cannot pop call stack');
        this.stack = this.stack.slice(0, frame.baseIndex);
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
        const x = assertDef(this.stack.pop(), 'Data stack is empty.');
        return x as any;
    }
    dpush(d: StackValue) { this.stack.push(d); }
}
