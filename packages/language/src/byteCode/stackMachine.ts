import { ByteInstruction, ByteProgram, CallStackNode, CallableChunk, DataValue } from "../types/byteCode";
import { assertAddress, assertDef, assertNever } from "../utils";

export class StackMachine {
    stack: DataValue[] = [];
    callStack: CallStackNode[] = [];

    constructor(
        private chunks: Map<string, CallableChunk>,
    ) {}

    getChunk(label: string) {
        return assertDef(this.chunks.get(label), `Could not find chunk with label '${label}'`);
    }

    handleCall(chunk: CallableChunk) {
        this.callStack.push({
            chunk,
            ip: 0,
            // expecting parameters already on stack
            stackBase: this.stack.length - chunk.aryness,
        });
        for (let i = 0; i < chunk.locals; i++) {
            this.dpush(0); // making room for locals
        }
    }
    handleReturn(chunk: CallableChunk) {

    }

    interpret(entryLabel: string) {
        this.handleCall(this.getChunk(entryLabel));
    }

    // get d0() { return assertDef(this.DS[0], 'Stack is empty.'); }
    // dget(index: number) {
    //     if (index <= 0 || index > this.DS.length) {
    //         throw new Error(`DStack index out of bounds '${index}'.`);
    //     }
    //     return this.DS[index];
    // }
    // dpop() {
    //     if (this.DS.length == 0) {
    //         throw new Error(`Data stack is empty.`);
    //     }
    //     return this.DS.shift()!;
    // }
    dpush(d: DataValue) { this.stack.unshift(d); }

    // popNum() {
    //     const t = this.dpop();
    //     if (typeof t !== 'number') {
    //         throw new TypeError(`Invalid type '${typeof t}' expected number.`)
    //     }
    //     return t;
    // }
    // popStr() {
    //     const t = this.dpop();
    //     if (typeof t !== 'string') {
    //         throw new TypeError(`Invalid type '${typeof t}' expected string.`)
    //     }
    //     return t;
    // }
    // popObj() {
    //     const t = this.dpop();
    //     if (typeof t !== 'object') {
    //         throw new TypeError(`Invalid type '${typeof t}' expected object.`)
    //     }
    //     return t;
    // }
    // popBool() {
    //     const t = this.dpop();
    //     if (typeof t !== 'boolean') {
    //         throw new TypeError(`Invalid type '${typeof t}' expected boolean.`)
    //     }
    //     return t;
    // }
    // popAddr() {
    //     const t = this.dpop();
    //     if (typeof t !== 'number' || 
    //         !isFinite(t) ||
    //         Math.floor(t) != t 
    //     ) {
    //         throw new Error(`DValue not valid address '${t}'.`);
    //     }
    //     return t;
    // }

    // get c0() { return assertDef(this.callStack[0], 'Call stack is empty.'); }
    // cpop() { return assertDef(this.callStack.shift(), 'Call stack is empty.'); }
    // cpush(c: CallStackNode) { this.callStack.unshift(c); }



    // private run(callNode: ByteProgram) {
    //     this.ip = 0;

    //     while (this.ip < prog.length) {
    //         const token = prog[this.ip++];
    //         if (token.type === 'data') {
    //             this.dpush(token.data);
    //             continue;
    //         } 

    //         switch (token.instruction) {
    //             case ByteInstruction.bneg:
    //                 this.dpush(!this.popBool()); break;
    //             case ByteInstruction.nneg:
    //                 this.dpush(-this.popNum()); break;
    //             case ByteInstruction.nadd:
    //                 this.dpush(this.popNum() + this.popNum()); break;
    //             case ByteInstruction.nsub:
    //                 this.dpush(this.popNum() - this.popNum()); break;
    //             case ByteInstruction.nmul:
    //                 this.dpush(this.popNum() * this.popNum()); break;
    //             case ByteInstruction.ndiv:
    //                 this.dpush(this.popNum() / this.popNum()); break;
    //             case ByteInstruction.ngt:
    //                 this.dpush(this.popNum() > this.popNum()); break;
    //             case ByteInstruction.nlt:
    //                 this.dpush(this.popNum() < this.popNum()); break;
    //             case ByteInstruction.neq:
    //                 this.dpush(this.popNum() === this.popNum()); break;
    //             case ByteInstruction.band:
    //                 this.dpush(this.popBool() && this.popBool()); break;
    //             case ByteInstruction.bor:
    //                 this.dpush(this.popBool() || this.popBool()); break;
    //             case ByteInstruction.dup:
    //                 this.dpush(this.d0); break;
    //             case ByteInstruction.pop:
    //                 this.dpop(); break;
    //             case ByteInstruction.swp: {
    //                 const t0 = this.dpop()!;
    //                 const t1 = this.dpop()!;
    //                 this.dpush(t0);
    //                 this.dpush(t1);
    //                 break;
    //             }
    //             // case ByteInstruction.popn: {
    //             //     const n = this.popAddr();
    //             //     this.dget(n); // throws if oub
    //             //     this.dpush(this.DS.splice(n, 1)[0]);
    //             //     break;
    //             // }
    //             // case ByteInstruction.dupn: 
    //             //     this.dpush(this.dget(this.popAddr()));
    //             //     break;
    //             case ByteInstruction.call:
    //                 const callAddr = this.popAddr();
    //                 this.cpush({ returnAddr: this.ip, stackPointer: this.DS.length });

    //                 this.ip = callAddr;
    //                 break;
    //             case ByteInstruction.jr:
    //                 this.ip = assertAddress(this.cpop());
    //                 break;
    //             case ByteInstruction.j:
    //                 this.ip = this.popAddr();
    //                 break;
    //             case ByteInstruction.jo:
    //                 this.ip += this.popAddr();
    //                 break;
    //             case ByteInstruction.jzo: {
    //                 const addr = this.popAddr();
    //                 if (this.popBool()) {
    //                     this.ip += addr;
    //                 }
    //                 break;
    //             }
    //             default:
    //                 assertNever();
    //         }
    //     }
    // }
}
