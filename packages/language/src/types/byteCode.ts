
export type DataValue = object | string | number | boolean;

export type ByteProgram = ByteToken[];

export interface CallableChunk {
    aryness: number;
    locals: number;
    prog: ByteProgram;
}

export interface CallStackNode {
    ip: number;
    stackBase: number;
    chunk: CallableChunk;
}

export enum ByteInstruction {
    // Unary
    nneg,
    bneg,
    ncmpz,
    ncmpnz,
    // Binary
    nadd, nsub, nmul, ndiv,
    ngt, nlt, neq,
    band, bor,
    // Stack
    dup, pop, swp, /* swpn, putn,  */
    narg, barg, oarg, sarg, // take n, dup n-th element starting from call stack start,
    // Control Flow
    call, jr, j, jo, jzo,
}

// export type UnaryInstr =
//     | 'ineg'
//     | 'bneg'
// export type BinaryInstr =
//     | 'nadd' | 'nsub' | 'nmul' | 'ndiv'
//     | 'bAND' | 'bOR'
//     | 'GT' | 'LT'
// export type StackInstr = 
//     | 'DUP' 
//     | 'POP'
//     | 'SWP'
//     | 'GETN'        // pop n from ds, afterwards take n-th (starting zero) item from stack and place at top
//     | 'PUTN'        // pop n from ds, afterwards insert d0 to n-th (starting zero) place
// export type BranchInstr =
//     | 'CALL'        // rpush(ip), d0 -> ip
//     | 'JR'          // r0 -> ip
//     | 'J'           // d0 -> ip
//     | 'JO'          // ip <- d0 + ip
//     | 'JZO'         // ip <- d0 + ip if d1 == 0

// // export type ByteInstruction = 
// //     | UnaryInstr
// //     | BinaryInstr
// //     | StackInstr
// //     | BranchInstr

export type ByteToken = 
    | { type: 'instruction', instruction: ByteInstruction }
    | { type: 'data', data: DataValue }

export type UnlinkedToken = 
    | ByteToken
    | { type: 'label', label: string, method: 'absolute' | 'offset' }
