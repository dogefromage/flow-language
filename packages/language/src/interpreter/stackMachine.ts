import { assertAddress, assertNever } from "../utils";

type DValue = number | string;
type RValue = number;

type UnaryInstr =
    | '!'
    | '--'
type BinaryInstr =
    | '+' | '-' | '*' | '/'
    | 'AND' | 'OR'
type StackInstr = 
    | 'DUP' | 'POP'
type BranchInstr =
    | 'CALL'        // rpush(ip), d0 -> ip
    | 'J'           // d0 -> ip
    | 'JZ'          // d0 -> ip if d1 == 0
    | 'JR'          // r0 -> ip

type Instruction = 
    | UnaryInstr
    | BinaryInstr
    | StackInstr
    | BranchInstr

type Token = 
    | { type: 'instruction', instruction: Instruction }
    | { type: 'data', data: DValue }

export class StackMachine {
    DS: DValue[] = [];
    RS: RValue[] = [];
    ip = 0;

    constructor() {

    }

    get d0() { return this.DS[0]; }
    get d1() { return this.DS[1]; }
    dpop() { return this.DS.shift(); }
    dpush(d: DValue) { this.DS.unshift(d); }

    get r0() { return this.RS[0]; }
    get r1() { return this.RS[1]; }
    rpop() { return this.RS.shift(); }
    rpush(r: RValue) { this.RS.unshift(r); }

    interpret(prog: Token[]) {
        this.ip = 0;

        while (true) {
            const token = prog[this.ip++];
            switch (token.type) {
                case 'data':
                    this.dpush(token.data); 
                    break;
                case 'instruction':
                    switch (token.instruction) {
                        case '!':
                        case '--':
                            this.unaryOp(token.instruction); break;
                        case '+':
                        case '-':
                        case '*':
                        case '/':
                        case 'AND':
                        case 'OR':
                            this.binaryOp(token.instruction); break;
                        case 'DUP':
                            this.dpush(this.d0); break;
                        case 'POP':
                            this.dpop();
                        case 'CALL':
                            this.rpush(this.ip);
                            this.ip = assertAddress(this.dpop());
                            break;
                        case 'J':
                            this.ip = assertAddress(this.dpop());
                            break;
                        case 'JZ':
                            const addr = assertAddress(this.dpop());
                            const d = this.dpop();
                            if (d === 0) {
                                this.ip = addr;
                            }
                            break;
                        case 'JR':
                            this.ip = assertAddress(this.rpop());
                            break;
                    }
                    break;
            }
        }
    }

    unaryOp(instr: UnaryInstr) {
        const a: any = this.dpop();
        switch (instr) {
            case '!':
                this.dpush(1-a); return;
            case '--':
                this.dpush(-a); return;
        }
        assertNever();
    }
    binaryOp(instr: BinaryInstr) {
        const a: any = this.dpop();
        const b: any = this.dpop();
        switch (instr) {
            case '+':
                this.dpush(a + b); return;
            case '-':
                this.dpush(a - b); return;
            case '*':
                this.dpush(a * b); return;
            case '/':
                this.dpush(a / b); return;
            case 'AND':
                this.dpush(a && b); return;
            case 'OR':
                this.dpush(a || b); return;
        }
        assertNever();
    }
}
